<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, triggerRef, watch } from 'vue'
import { TYPES, type Multiplier, type TypeId } from '@/data/types'
import { t, typeName } from '@/i18n'
import { MULTIPLIERS, formatMult, multClass } from '@/lib/typecalc'
import { deckStats, emptyDeck, grade, loadDeck, pickNext, rollDay, saveDeck } from '@/lib/srs'
import { AnimatePresence, motion } from 'motion-v'
import { FADE, PRESS } from '@/lib/motion'
import {
  MULTI_QUESTIONS,
  cardKind,
  cardLabel,
  checkMulti,
  explain,
  getCard,
  getCurriculum,
  matchups,
  multiPrompt,
  multiQuestion,
  newCardOrder,
  type Card,
} from '@/lib/quiz'
import { CHOICES, LIMITS, defaultSettings, loadSettings, normalize, saveSettings } from '@/lib/quizSettings'
import { hintFor } from '@/lib/hints'
import TypeIcon from '@/components/TypeIcon.vue'
import TypePicker from '@/components/TypePicker.vue'
import { confirmDialog } from '@/composables/useConfirm'

// Dev-only controls to fast-forward the quiz; left out of production builds.
const QuizDevTools = import.meta.env.DEV ? defineAsyncComponent(() => import('@/dev/QuizDevTools.vue')) : null

const deck = shallowRef(loadDeck())
// Settings live apart from progress, so resetting progress keeps them. Decks used to hold the dual types choice.
const settings = ref(loadSettings(deck.value.duals))
if (deck.value.duals !== undefined) {
  delete deck.value.duals
  saveDeck(deck.value)
  saveSettings(settings.value)
}
rollDay(deck.value, settings.value.newPerDay)
const { basic, dual } = getCurriculum()

const graduated = computed(() => {
  void deck.value.tick
  let n = 0
  for (const c of basic) {
    const s = deck.value.cards[c.id]
    if (s && s.reps > 0) n++
  }
  return n
})
const unlockAt = computed(() => Math.ceil(basic.length * settings.value.dualUnlock))
const dualsAuto = computed(() => graduated.value >= unlockAt.value)
const dualsOn = computed(() => {
  const mode = settings.value.duals
  return mode === 'auto' ? dualsAuto.value : mode === 'on'
})

/**
 * Cards switched off in the settings (dual types, tick-all cards or some of their questions) are left out
 * entirely, reviews included; they resume, schedules intact, when switched back on.
 */
function skip(id: string): boolean {
  const kind = cardKind(id)
  if (kind === 'dual') return !dualsOn.value
  if (kind === 'multi') return !settings.value.multiEvery || !settings.value.questions[multiQuestion(id)]
  return false
}

/**
 * New cards in study order. Each pool has its own rate, counted over the cards seen so far:
 * one tick-all card in every `multiEvery` basic cards, and one dual in every `dualEvery` cards.
 */
function* newIds() {
  const order = newCardOrder(deck.value.seed!)
  const s = settings.value
  const seen = { single: 0, multi: 0, dual: 0 }
  for (const id of Object.keys(deck.value.cards)) seen[cardKind(id)]++
  const all = seen.single + seen.multi + seen.dual
  if (dualsOn.value && all % s.dualEvery === s.dualEvery - 1) yield* order.dual
  if (s.multiEvery && (seen.single + seen.multi) % s.multiEvery === s.multiEvery - 1) yield* order.multi
  yield* order.single
  yield* order.multi
  yield* order.dual
}

// ---- Current card ----
const current = ref<Card | null>(null)

// A single type can't take 4× or ¼×, so those are only offered against dual types.
const SINGLE_MULTIPLIERS = MULTIPLIERS.filter((m) => m !== 0.25 && m !== 4)
const options = computed(() =>
  current.value?.kind === 'mult' && current.value.def.length === 1 ? SINGLE_MULTIPLIERS : MULTIPLIERS,
)
const picked = ref<TypeId[]>([])
const result = ref<{ correct: boolean; choice?: Multiplier; missed: TypeId[]; wrong: TypeId[] } | null>(null)
let shownAt = 0

const session = ref({ seen: 0, correct: 0 })

function next(ignoreLimit = false) {
  const id = pickNext(deck.value, { newIds: newIds(), avoid: current.value?.id, ignoreLimit, skip })
  current.value = id ? (getCard(id) ?? null) : null
  picked.value = []
  result.value = null
  shownAt = performance.now()
}

function record(correct: boolean, slow?: boolean) {
  const c = current.value!
  const secs = c.kind === 'mult' ? settings.value.slowMult : settings.value.slowMulti
  slow ??= secs > 0 && performance.now() - shownAt > secs * 1000
  grade(deck.value, c.id, correct ? (slow ? 3 : 4) : 1)
  saveDeck(deck.value)
  triggerRef(deck)
  session.value.seen++
  if (correct) session.value.correct++
}

function answerMult(m: Multiplier) {
  const c = current.value
  if (!c || c.kind !== 'mult' || result.value) return
  const correct = m === c.answer
  result.value = { correct, choice: m, missed: [], wrong: [] }
  record(correct)
}

function submitMulti() {
  const c = current.value
  if (!c || c.kind !== 'multi' || result.value) return
  const r = checkMulti(c, picked.value)
  result.value = r
  record(r.correct)
}

/** Dev: answer the current card as if right (quick or slow) or wrong, without picking. */
function simulate(correct: boolean, slow = false) {
  const c = current.value
  if (!c || result.value) return
  if (c.kind === 'mult') {
    const choice = correct ? c.answer : options.value.find((m) => m !== c.answer)!
    result.value = { correct, choice, missed: [], wrong: [] }
  } else {
    picked.value = correct ? [...c.answer] : c.answer.slice(1)
    result.value = checkMulti(c, picked.value)
  }
  record(correct, slow)
}

/** Dev: the card the quiz would show next, ignoring the daily limit. */
const devPick = (avoid?: string) => pickNext(deck.value, { newIds: newIds(), avoid, ignoreLimit: true, skip })
const devBasicIds = computed(() => {
  const order = newCardOrder(deck.value.seed!)
  return [...order.single, ...order.multi]
})
function devDone() {
  saveDeck(deck.value)
  triggerRef(deck)
  next()
}

/** After answering: the memory hook for each matchup the card is about. */
const hints = computed(() => {
  const c = current.value
  if (!result.value || !c || !settings.value.hints) return []
  return matchups(c).flatMap(([atk, def]) => {
    const text = hintFor(atk, def)
    return text ? [{ atk, def, text }] : []
  })
})

const marks = computed(() => {
  const c = current.value
  if (!result.value || !c || c.kind !== 'multi') return undefined
  const m: Partial<Record<TypeId, 'ok' | 'missed' | 'wrong'>> = {}
  for (const t of c.answer) m[t] = picked.value.includes(t) ? 'ok' : 'missed'
  for (const t of result.value.wrong) m[t] = 'wrong'
  return m
})

function names(ts: TypeId[]) {
  return ts.map(typeName).join(', ')
}

// ---- Keyboard: 1–6 answer, Enter submits / continues ----
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  const c = current.value
  if (!c) return
  if (result.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      next()
    }
    return
  }
  if (import.meta.env.DEV && (e.key === 'c' || e.key === 'x')) {
    simulate(e.key === 'c')
    return
  }
  if (c.kind === 'mult') {
    const i = Number(e.key) - 1
    if (i >= 0 && i < options.value.length) answerMult(options.value[i]!)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    submitMulti()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  next()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// ---- Stats & settings ----
const stats = computed(() => {
  void deck.value.tick
  return deckStats(deck.value, Date.now(), skip)
})
const total = computed(() => [...basic, ...dual].filter((c) => !skip(c.id)).length)
const accuracy = computed(() =>
  session.value.seen ? Math.round((100 * session.value.correct) / session.value.seen) : 0,
)
const weakSpots = computed(() => {
  void deck.value.tick
  return Object.entries(deck.value.cards)
    .filter(([id, s]) => s.lapses > 0 && !skip(id))
    .sort((a, b) => b[1].lapses - a[1].lapses || b[1].ease - a[1].ease)
    .slice(0, 8)
    .map(([id, s]) => ({ id, lapses: s.lapses, learning: s.step >= 0, card: getCard(id) }))
    .filter((w) => w.card)
})

function learnMore() {
  deck.value.newLimit += settings.value.learnMoreStep
  saveDeck(deck.value)
  triggerRef(deck)
  next()
}

// Settings apply from the next card; an unanswered card that was just switched off is replaced now.
let newPerDay = settings.value.newPerDay
watch(
  settings,
  (s) => {
    // A cleared or out-of-range number goes back to its default.
    const clean = normalize(s)
    if (JSON.stringify(clean) !== JSON.stringify(s)) {
      settings.value = clean
      return
    }
    // Today's allowance follows the new daily number, keeping anything "Learn more" added.
    if (s.newPerDay !== newPerDay) {
      deck.value.newLimit = Math.max(0, deck.value.newLimit + s.newPerDay - newPerDay)
      newPerDay = s.newPerDay
      saveDeck(deck.value)
      triggerRef(deck)
    }
    saveSettings(s)
    if (!current.value || (!result.value && skip(current.value.id))) next()
  },
  { deep: true },
)

function restoreDefaults() {
  settings.value = defaultSettings()
}

const QUESTION_LABELS = {
  weak: 'settings.q.weak',
  resist: 'settings.q.resist',
  immune: 'settings.q.immune',
  se: 'settings.q.se',
  nve: 'settings.q.nve',
  noeff: 'settings.q.noeff',
} as const

async function reset() {
  if (!(await confirmDialog({ message: t('quiz.resetConfirm'), confirm: t('quiz.reset'), danger: true }))) return
  deck.value = emptyDeck(settings.value.newPerDay)
  saveDeck(deck.value)
  session.value = { seen: 0, correct: 0 }
  current.value = null
  next()
}

const KEYS = ['1', '2', '3', '4', '5', '6']

// After answering: the right answer pops, a wrong pick gives a small shake.
function ansAnimate(m: Multiplier) {
  if (!result.value || current.value?.kind !== 'mult') return {}
  if (m === current.value.answer) return { scale: [1, 1.06, 1] }
  if (m === result.value.choice) return { x: [0, -4, 4, -2, 0] }
  return {}
}
</script>

<template>
  <div class="layout">
    <section class="panel card">
      <!-- Each question slides in as the previous one slides out. -->
      <AnimatePresence mode="wait" :initial="false">
        <motion.div
          :key="current?.id ?? 'done'"
          :initial="{ opacity: 0, x: 12 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: -12 }"
          :transition="FADE"
        >
          <template v-if="current?.kind === 'mult'">
            <p class="muted q">{{ t('quiz.howEffective') }}</p>
            <div class="matchup">
              <TypeIcon :type="current.atk" :scale="2" />
              <span class="arrow">→</span>
              <span class="defs">
                <TypeIcon v-for="t in current.def" :key="t" :type="t" :scale="2" />
              </span>
            </div>
            <!-- One row of buttons, or two rows on phones. -->
            <div class="answers" :style="{ '--cols': options.length, '--cols-narrow': options.length / 2 }">
              <motion.button
                v-for="(m, i) in options"
                :key="m"
                type="button"
                class="btn ans num"
                :class="{
                  right: result && m === current.answer,
                  miss: result && m === result.choice && !result.correct,
                }"
                :disabled="!!result"
                :while-press="result ? undefined : PRESS"
                :animate="ansAnimate(m)"
                :transition="{ duration: 0.3 }"
                @click="answerMult(m)"
              >
                <kbd>{{ KEYS[i] }}</kbd
                >{{ formatMult(m) }}
              </motion.button>
            </div>
          </template>

          <template v-else-if="current?.kind === 'multi'">
            <p class="q prompt">
              <span v-if="multiPrompt(current)[0]">{{ multiPrompt(current)[0] }}</span>
              <TypeIcon :type="current.type" :scale="2" />
              <span>{{ multiPrompt(current)[1] }}</span>
            </p>
            <p class="muted small">{{ t('quiz.tickAll') }}</p>
            <TypePicker v-model="picked" :disabled="!!result" :marks="marks" />
          </template>

          <div v-else class="done">
            <h2>{{ t('quiz.caughtUp') }}</h2>
            <p class="muted">{{ t('quiz.caughtUpText', { n: deck.newLimit }) }}</p>
            <button type="button" class="btn primary" @click="learnMore">
              {{ t('quiz.learnMore', { n: settings.learnMoreStep }) }}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <!-- The button sits right under the question, in the same place before and after answering;
           feedback appears below it, so its length never moves the button. -->
      <div v-if="current" class="bottom">
        <div class="actions">
          <button v-if="result" type="button" class="btn primary" @click="next()">
            {{ t('quiz.next') }} <kbd>Enter</kbd>
          </button>
          <button v-else-if="current.kind === 'multi'" type="button" class="btn primary" @click="submitMulti">
            {{ t('quiz.submit') }} <kbd>Enter</kbd>
          </button>
          <!-- Multiplier cards are answered by their buttons; this keeps the row's height. -->
          <button v-else type="button" class="btn primary placeholder" tabindex="-1" aria-hidden="true">
            {{ t('quiz.next') }} <kbd>Enter</kbd>
          </button>
        </div>
        <motion.div
          v-if="result"
          class="feedback"
          :class="result.correct ? 'ok' : 'bad'"
          :initial="{ opacity: 0, y: 6 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="FADE"
        >
          <div class="verdict">
            <b>{{ t(result.correct ? 'quiz.correct' : 'quiz.wrong') }}</b>
            <template v-if="current.kind === 'mult'">
              <span class="mult-tag" :class="multClass(current.answer)">{{ formatMult(current.answer) }}</span>
              <span class="muted">{{ explain(current) }}</span>
            </template>
            <template v-else-if="!result.correct">
              <span v-if="result.missed.length">{{ t('quiz.missed', { list: names(result.missed) }) }}</span>
              <span v-if="result.wrong.length">{{ t('quiz.extra', { list: names(result.wrong) }) }}</span>
            </template>
          </div>
          <!-- Memory hooks to reinforce the answer (Advanced settings > Show hints). -->
          <ul v-if="hints.length" class="hints">
            <li v-for="h in hints" :key="h.atk + h.def">
              <span class="pair">
                <TypeIcon :type="h.atk" />
                <span class="muted">→</span>
                <TypeIcon :type="h.def" />
              </span>
              <span>{{ h.text }}</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>

    <aside>
      <component
        :is="QuizDevTools"
        v-if="QuizDevTools"
        :deck="deck"
        :can-answer="!!current && !result"
        :simulate="simulate"
        :pick="devPick"
        :basic-ids="devBasicIds"
        :graduated="graduated"
        :unlock-at="unlockAt"
        :done="devDone"
      />
      <div class="panel">
        <h2>{{ t('quiz.progress') }}</h2>
        <dl class="stats">
          <dt>{{ t('quiz.session') }}</dt>
          <dd class="num">
            {{ session.correct }}/{{ session.seen }} <span class="muted">({{ accuracy }}%)</span>
          </dd>
          <dt>{{ t('quiz.newToday') }}</dt>
          <dd class="num">{{ Math.min(deck.newToday, deck.newLimit) }}/{{ deck.newLimit }}</dd>
          <dt>{{ t('quiz.learning') }}</dt>
          <dd class="num">{{ stats.learning }}</dd>
          <dt>{{ t('quiz.due') }}</dt>
          <dd class="num">{{ stats.due }}</dd>
          <dt>{{ t('quiz.seen') }}</dt>
          <dd class="num">{{ stats.seen }}/{{ total }}</dd>
          <dt>{{ t('quiz.mature') }}</dt>
          <dd class="num">{{ stats.mature }}</dd>
        </dl>
      </div>

      <details class="panel settings small">
        <summary>{{ t('settings.title') }}</summary>
        <label class="check">
          <input v-model="settings.hints" type="checkbox" />
          {{ t('settings.hints') }}
        </label>

        <label class="row">
          <span>{{ t('settings.newPerDay') }}</span>
          <input
            v-model.lazy.number="settings.newPerDay"
            type="number"
            :min="LIMITS.newPerDay[0]"
            :max="LIMITS.newPerDay[1]"
            required
          />
        </label>
        <label class="row">
          <span>{{ t('settings.learnMoreStep') }}</span>
          <input
            v-model.lazy.number="settings.learnMoreStep"
            type="number"
            :min="LIMITS.learnMoreStep[0]"
            :max="LIMITS.learnMoreStep[1]"
            required
          />
        </label>

        <label class="row">
          <span>{{ t('settings.multiEvery') }}</span>
          <select v-model.number="settings.multiEvery">
            <option v-for="n in CHOICES.multiEvery" :key="n" :value="n">
              {{ n ? t('settings.everyN', { n }) : t('quiz.off') }}
            </option>
          </select>
        </label>
        <fieldset :disabled="!settings.multiEvery">
          <legend>{{ t('settings.questions') }}</legend>
          <label v-for="q in MULTI_QUESTIONS" :key="q" class="check">
            <input v-model="settings.questions[q]" type="checkbox" />
            {{ t(QUESTION_LABELS[q]) }}
          </label>
        </fieldset>

        <label class="row">
          <span>{{ t('quiz.dualTypes') }}</span>
          <select v-model="settings.duals">
            <option value="auto">
              {{ t('quiz.auto', { s: dualsAuto ? t('quiz.unlocked') : `${graduated}/${unlockAt}` }) }}
            </option>
            <option value="on">{{ t('quiz.on') }}</option>
            <option value="off">{{ t('quiz.off') }}</option>
          </select>
        </label>
        <label class="row">
          <span>{{ t('settings.dualUnlock') }}</span>
          <select v-model.number="settings.dualUnlock" :disabled="settings.duals !== 'auto'">
            <option v-for="n in CHOICES.dualUnlock" :key="n" :value="n">
              {{ t('settings.percent', { n: n * 100 }) }}
            </option>
          </select>
        </label>
        <label class="row">
          <span>{{ t('settings.dualEvery') }}</span>
          <select v-model.number="settings.dualEvery" :disabled="settings.duals === 'off'">
            <option v-for="n in CHOICES.dualEvery" :key="n" :value="n">{{ t('settings.everyN', { n }) }}</option>
          </select>
        </label>

        <label class="row">
          <span>{{ t('settings.slowMult') }}</span>
          <input
            v-model.lazy.number="settings.slowMult"
            type="number"
            :min="LIMITS.slow[0]"
            :max="LIMITS.slow[1]"
            required
          />
        </label>
        <label class="row">
          <span>{{ t('settings.slowMulti') }}</span>
          <input
            v-model.lazy.number="settings.slowMulti"
            type="number"
            :min="LIMITS.slow[0]"
            :max="LIMITS.slow[1]"
            required
          />
        </label>
        <p class="muted">{{ t('settings.slowNote') }}</p>

        <button type="button" class="btn" @click="restoreDefaults">{{ t('settings.restore') }}</button>
      </details>

      <div class="panel">
        <h2>{{ t('quiz.weakSpots') }}</h2>
        <p v-if="!weakSpots.length" class="muted small">{{ t('quiz.weakEmpty') }}</p>
        <ol class="weak">
          <li v-for="w in weakSpots" :key="w.id">
            <span>{{ cardLabel(w.card!) }}</span>
            <span class="muted">×{{ w.lapses }}</span>
          </li>
        </ol>
      </div>

      <div class="panel about small muted">
        <p>{{ t('quiz.about1') }}</p>
        <p>{{ t('quiz.about2', { n: TYPES.length }) }}</p>
        <button type="button" class="btn" @click="reset">{{ t('quiz.reset') }}</button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 12px;
  align-items: start;
}
@media (max-width: 760px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.card {
  min-height: 260px;
}

.q {
  margin-bottom: 12px;
}
.prompt {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: calc(15px * var(--text-scale));
  font-weight: bold;
  margin-bottom: 4px;
}
.small {
  font-size: calc(11px * var(--text-scale));
}

.matchup {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0 24px;
}
.arrow {
  font-size: calc(20px * var(--text-scale));
  color: var(--muted);
}
.defs {
  display: inline-flex;
  gap: 4px;
}

.answers {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 6px;
}
@media (max-width: 480px) {
  .answers {
    grid-template-columns: repeat(var(--cols-narrow), 1fr);
  }
}
.ans {
  gap: 8px;
  min-height: 40px;
  font-size: calc(15px * var(--text-scale));
  font-weight: bold;
}
.ans:disabled {
  opacity: 0.55;
}
.ans.right {
  opacity: 1;
  border-color: var(--good);
  box-shadow: inset 0 0 0 2px var(--good);
}
.ans.miss {
  opacity: 1;
  border-color: var(--bad);
  box-shadow: inset 0 0 0 2px var(--bad);
}

kbd {
  font:
    10px/1 Verdana,
    sans-serif;
  padding: 2px 3px;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--muted);
}
.btn.primary kbd {
  color: inherit;
  border-color: currentColor;
  opacity: 0.8;
}
/* Touch-first devices (phones, tablets) usually have no keyboard. */
@media (hover: none) and (pointer: coarse) {
  kbd {
    display: none;
  }
}

.actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
.actions .placeholder {
  visibility: hidden;
}
/* Phones: one full-width button at the bottom of the card. */
@media (max-width: 760px) {
  .actions .btn {
    flex: 1;
    min-height: 44px;
  }
}

.feedback {
  margin-top: 14px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: 3px;
  background: var(--panel-alt);
}
.feedback.ok {
  border-left-color: var(--good);
}
.feedback.ok b {
  color: var(--good);
}
.feedback.bad {
  border-left-color: var(--bad);
}
.feedback.bad b {
  color: var(--bad);
}
.verdict {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.done {
  text-align: center;
  padding: 40px 0;
}

.stats {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 12px;
  margin: 0 0 10px;
}
.stats dt {
  color: var(--muted);
}
.stats dd {
  margin: 0;
  text-align: right;
  font-weight: bold;
}

.settings summary {
  cursor: pointer;
  font-family: var(--font-display, inherit);
  font-weight: bold;
}
.settings[open] summary {
  margin-bottom: 10px;
}
.settings .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.settings .check {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.settings input[type='number'] {
  width: 4.5em;
  font: inherit;
  color: inherit;
  background: var(--panel-alt);
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  padding: 2px 4px;
}
.settings fieldset {
  margin: 4px 0 10px;
  padding: 6px 8px 0;
  border: 1px solid var(--border);
  border-radius: 3px;
}
.settings fieldset:disabled {
  opacity: 0.5;
}
.settings legend {
  padding: 0 4px;
  color: var(--muted);
}
.settings p {
  margin: 0 0 10px;
}
select:disabled {
  opacity: 0.5;
}

.hints {
  display: grid;
  gap: 4px;
  margin: 8px 0 0;
  padding: 8px 0 0;
  border-top: 1px solid var(--border);
  list-style: none;
}
.hints li {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.hints .pair {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  align-self: center;
}
select {
  font: inherit;
  color: inherit;
  background: var(--panel-alt);
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  padding: 2px 4px;
}

.weak {
  margin: 0;
  padding-left: 20px;
}
.weak li::marker {
  color: var(--muted);
}
.weak li span:last-child {
  float: right;
}

.about p {
  margin-bottom: 8px;
}
</style>
