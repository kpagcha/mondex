<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, triggerRef } from 'vue'
import { TYPES, TYPE_NAMES, type Multiplier, type TypeId } from '@/data/types'
import { MULTIPLIERS, formatMult, multClass } from '@/lib/typecalc'
import {
  deckStats,
  emptyDeck,
  grade,
  loadDeck,
  pickNext,
  rollDay,
  saveDeck,
} from '@/lib/srs'
import {
  cardLabel,
  checkMulti,
  explain,
  getCard,
  getCurriculum,
  multiPrompt,
  type Card,
} from '@/lib/quiz'
import TypeIcon from '@/components/TypeIcon.vue'
import TypePicker from '@/components/TypePicker.vue'

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

function* newIds() {
  for (const c of basic) yield c.id
  if (dualsOn.value) for (const c of dual) yield c.id
}

// ---- Current card ----
const current = ref<Card | null>(null)
const picked = ref<TypeId[]>([])
const result = ref<{ correct: boolean; choice?: Multiplier; missed: TypeId[]; wrong: TypeId[] } | null>(null)
let shownAt = 0

const session = ref({ seen: 0, correct: 0 })

function next(ignoreLimit = false) {
  const id = pickNext(deck.value, { newIds: newIds(), avoid: current.value?.id, ignoreLimit })
  current.value = id ? (getCard(id) ?? null) : null
  picked.value = []
  result.value = null
  shownAt = performance.now()
}

function record(correct: boolean) {
  const c = current.value!
  const slow = performance.now() - shownAt > SLOW_MS[c.kind]
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

const marks = computed(() => {
  const c = current.value
  if (!result.value || !c || c.kind !== 'multi') return undefined
  const m: Partial<Record<TypeId, 'ok' | 'missed' | 'wrong'>> = {}
  for (const t of c.answer) m[t] = picked.value.includes(t) ? 'ok' : 'missed'
  for (const t of result.value.wrong) m[t] = 'wrong'
  return m
})

function names(ts: TypeId[]) {
  return ts.map((t) => TYPE_NAMES[t]).join(', ')
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
  if (c.kind === 'mult') {
    const i = Number(e.key) - 1
    if (i >= 0 && i < MULTIPLIERS.length) answerMult(MULTIPLIERS[i]!)
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
  return deckStats(deck.value)
})
const total = computed(() => basic.length + (dualsOn.value ? dual.length : 0))
const accuracy = computed(() =>
  session.value.seen ? Math.round((100 * session.value.correct) / session.value.seen) : 0,
)
const weakSpots = computed(() => {
  void deck.value.tick
  return Object.entries(deck.value.cards)
    .filter(([, s]) => s.lapses > 0)
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
  if (!current.value) next()
}

function reset() {
  if (!confirm('Reset all quiz progress?')) return
  deck.value = emptyDeck()
  saveDeck(deck.value)
  session.value = { seen: 0, correct: 0 }
  current.value = null
  next()
}

const KEYS = ['1', '2', '3', '4', '5', '6']
</script>

<template>
  <div class="layout">
    <section class="panel card">
      <template v-if="current?.kind === 'mult'">
        <p class="muted q">How effective is this attack?</p>
        <div class="matchup">
          <TypeIcon :type="current.atk" :scale="2" />
          <span class="arrow">→</span>
          <span class="defs">
            <TypeIcon v-for="t in current.def" :key="t" :type="t" :scale="2" />
          </span>
        </div>
        <div class="answers">
          <button
            v-for="(m, i) in MULTIPLIERS"
            :key="m"
            type="button"
            class="btn ans"
            :class="{
              right: result && m === current.answer,
              miss: result && m === result.choice && !result.correct,
            }"
            :disabled="!!result"
            @click="answerMult(m)"
          >
            <kbd>{{ KEYS[i] }}</kbd>{{ formatMult(m) }}
          </button>
        </div>
      </template>

      <template v-else-if="current?.kind === 'multi'">
        <p class="q prompt">
          <span v-if="multiPrompt(current)[0]">{{ multiPrompt(current)[0] }}</span>
          <TypeIcon :type="current.type" :scale="2" />
          <span>{{ multiPrompt(current)[1] }}</span>
        </p>
        <p class="muted small">Tick all that apply.</p>
        <TypePicker v-model="picked" :disabled="!!result" :marks="marks" />
        <div v-if="!result" class="actions">
          <button type="button" class="btn primary" @click="submitMulti">Submit <kbd>Enter</kbd></button>
        </div>
      </template>

      <div v-else class="done">
        <h2>All caught up</h2>
        <p class="muted">
          No cards are due and today's {{ deck.newLimit }} new cards are done. Come back later for
          reviews, or keep going.
        </p>
        <button type="button" class="btn primary" @click="learnMore">Learn 10 more</button>
      </div>

      <div v-if="result && current" class="feedback" :class="result.correct ? 'ok' : 'bad'">
        <div class="verdict">
          <b>{{ result.correct ? 'Correct' : 'Wrong' }}</b>
          <template v-if="current.kind === 'mult'">
            <span class="mult-tag" :class="multClass(current.answer)">{{ formatMult(current.answer) }}</span>
            <span class="muted">{{ explain(current) }}</span>
          </template>
          <template v-else-if="!result.correct">
            <span v-if="result.missed.length">Missed: {{ names(result.missed) }}.</span>
            <span v-if="result.wrong.length">Shouldn't include: {{ names(result.wrong) }}.</span>
          </template>
        </div>
        <button type="button" class="btn primary" @click="next()">Next <kbd>Enter</kbd></button>
      </div>
    </section>

    <aside>
      <div class="panel">
        <h2>Progress</h2>
        <dl class="stats">
          <dt>Session</dt>
          <dd>{{ session.correct }}/{{ session.seen }} <span class="muted">({{ accuracy }}%)</span></dd>
          <dt>New today</dt>
          <dd>{{ Math.min(deck.newToday, deck.newLimit) }}/{{ deck.newLimit }}</dd>
          <dt>Learning</dt>
          <dd>{{ stats.learning }}</dd>
          <dt>Due</dt>
          <dd>{{ stats.due }}</dd>
          <dt>Seen</dt>
          <dd>{{ stats.seen }}/{{ total }}</dd>
          <dt>Mature</dt>
          <dd>{{ stats.mature }}</dd>
        </dl>
        <label class="setting">
          Dual types
          <select :value="deck.duals === undefined ? 'auto' : deck.duals ? 'on' : 'off'" @change="setDuals">
            <option value="auto">Auto ({{ dualsAuto ? 'unlocked' : `${graduated}/${Math.ceil(basic.length * DUAL_UNLOCK)}` }})</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>

      <div class="panel">
        <h2>Weak spots</h2>
        <p v-if="!weakSpots.length" class="muted small">Matchups you miss show up here.</p>
        <ol class="weak">
          <li v-for="w in weakSpots" :key="w.id">
            <span>{{ cardLabel(w.card!) }}</span>
            <span class="muted">×{{ w.lapses }}</span>
          </li>
        </ol>
      </div>

      <div class="panel about small muted">
        <p>
          Scheduling uses <b>SM-2</b> spaced repetition. A miss is re-asked after
          3 and then 8 more cards; correct answers come back after 1 day, 6 days, and then
          increasingly longer gaps. Hesitant answers grow the gaps more slowly.
        </p>
        <p>{{ TYPES.length }}×{{ TYPES.length }} single-type matchups and tick-all questions come first; dual types unlock after that.</p>
        <button type="button" class="btn" @click="reset">Reset progress</button>
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
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
}
.small {
  font-size: 11px;
}

.matchup {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0 24px;
}
.arrow {
  font-size: 20px;
  color: var(--muted);
}
.defs {
  display: inline-flex;
  gap: 4px;
}

.answers {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}
@media (max-width: 480px) {
  .answers {
    grid-template-columns: repeat(3, 1fr);
  }
}
.ans {
  min-height: 40px;
  font-size: 15px;
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
  font: 10px/1 Verdana, sans-serif;
  padding: 2px 3px;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--muted);
  margin-right: 4px;
}
.btn.primary kbd {
  color: inherit;
  border-color: currentColor;
  margin: 0 0 0 4px;
  opacity: 0.8;
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
