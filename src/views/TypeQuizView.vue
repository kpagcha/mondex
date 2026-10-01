<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, triggerRef } from 'vue'
import { TYPES, type Multiplier, type TypeId } from '@/data/types'
import { t, typeName } from '@/i18n'
import { MULTIPLIERS, formatMult, multClass } from '@/lib/typecalc'
import { deckStats, emptyDeck, grade, loadDeck, pickNext, rollDay, saveDeck } from '@/lib/srs'
import { AnimatePresence, motion } from 'motion-v'
import { FADE, PRESS } from '@/lib/motion'
import {
  cardLabel,
  checkMulti,
  explain,
  getCard,
  getCurriculum,
  multiPrompt,
  newCardOrder,
  type Card,
} from '@/lib/quiz'
import TypeIcon from '@/components/TypeIcon.vue'
import TypePicker from '@/components/TypePicker.vue'

// Dev-only controls to fast-forward the quiz; left out of production builds.
const QuizDevTools = import.meta.env.DEV ? defineAsyncComponent(() => import('@/dev/QuizDevTools.vue')) : null

/** Dual-type cards unlock once this share of the basic cards has graduated. */
const DUAL_UNLOCK = 0.6
/** Answers slower than this (ms) count as a hesitant correct answer. */
const SLOW_MS = { mult: 8_000, multi: 20_000 }

const deck = shallowRef(loadDeck())
rollDay(deck.value)
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
const dualsAuto = computed(() => graduated.value >= basic.length * DUAL_UNLOCK)
const dualsOn = computed(() => {
  void deck.value.tick
  return deck.value.duals ?? dualsAuto.value
})

/** With duals on, every this-many-plus-one-th new card is a dual, so they show up right away. */
const DUAL_EVERY = 3
const DUAL_IDS = new Set(dual.map((c) => c.id))
/** Duals switched off (or not unlocked yet) are left out entirely, reviews included; they resume when on. */
const skip = (id: string) => !dualsOn.value && DUAL_IDS.has(id)

function* newIds() {
  const order = newCardOrder(deck.value.seed!)
  if (dualsOn.value && Object.keys(deck.value.cards).length % (DUAL_EVERY + 1) === DUAL_EVERY) yield* order.dual
  yield* order.basic
  if (dualsOn.value) yield* order.dual
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
  slow ??= performance.now() - shownAt > SLOW_MS[c.kind]
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
const devBasicIds = computed(() => newCardOrder(deck.value.seed!).basic)
function devDone() {
  saveDeck(deck.value)
  triggerRef(deck)
  next()
}

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
const total = computed(() => basic.length + (dualsOn.value ? dual.length : 0))
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
  deck.value.newLimit += 10
  saveDeck(deck.value)
  triggerRef(deck)
  next()
}

function setDuals(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  deck.value.duals = v === 'auto' ? undefined : v === 'on'
  saveDeck(deck.value)
  triggerRef(deck)
  // Replace an unanswered dual card when duals go off.
  if (!current.value || (!result.value && skip(current.value.id))) next()
}

function reset() {
  if (!confirm(t('quiz.resetConfirm'))) return
  deck.value = emptyDeck()
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
            <div v-if="!result" class="actions">
              <button type="button" class="btn primary" @click="submitMulti">
                {{ t('quiz.submit') }} <kbd>Enter</kbd>
              </button>
            </div>
          </template>

          <div v-else class="done">
            <h2>{{ t('quiz.caughtUp') }}</h2>
            <p class="muted">{{ t('quiz.caughtUpText', { n: deck.newLimit }) }}</p>
            <button type="button" class="btn primary" @click="learnMore">{{ t('quiz.learnMore') }}</button>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        v-if="result && current"
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
        <button type="button" class="btn primary" @click="next()">{{ t('quiz.next') }} <kbd>Enter</kbd></button>
      </motion.div>
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
        :unlock-at="Math.ceil(basic.length * DUAL_UNLOCK)"
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
        <label class="setting">
          {{ t('quiz.dualTypes') }}
          <select :value="deck.duals === undefined ? 'auto' : deck.duals ? 'on' : 'off'" @change="setDuals">
            <option value="auto">
              {{
                t('quiz.auto', {
                  s: dualsAuto ? t('quiz.unlocked') : `${graduated}/${Math.ceil(basic.length * DUAL_UNLOCK)}`,
                })
              }}
            </option>
            <option value="on">{{ t('quiz.on') }}</option>
            <option value="off">{{ t('quiz.off') }}</option>
          </select>
        </label>
      </div>

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

.feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
