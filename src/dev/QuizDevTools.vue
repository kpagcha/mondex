<script setup lang="ts">
// Dev-only quiz controls: answer the current card without picking, or fast-forward progress.
// Loaded by TypeQuizView only when import.meta.env.DEV is true. Not translated.
import type { Deck } from '@/lib/srs'
import { graduate, simulateAnswers, skipDay } from '@/dev/quizSim'

const props = defineProps<{
  deck: Deck
  /** Whether the current card can still be answered. */
  canAnswer: boolean
  simulate: (correct: boolean, slow?: boolean) => void
  /** The card the quiz would show next, ignoring the daily limit. */
  pick: (avoid?: string) => string | null
  basicIds: readonly string[]
  /** Graduated basic cards, and how many unlock dual types. */
  graduated: number
  unlockAt: number
  /** Save the deck and show the next card. */
  done: () => void
}>()

function answer(n: number) {
  simulateAnswers(props.deck, n, 0.8, props.pick)
  props.done()
}
function toUnlock() {
  graduate(props.deck, props.basicIds, props.unlockAt - props.graduated)
  props.done()
}
function nextDay() {
  skipDay(props.deck)
  props.done()
}
</script>

<template>
  <div class="panel dev small">
    <h2>Dev</h2>
    <div class="row">
      <span class="muted">This card</span>
      <button type="button" class="btn" :disabled="!canAnswer" @click="simulate(true)">Correct</button>
      <button type="button" class="btn" :disabled="!canAnswer" @click="simulate(true, true)">Slow</button>
      <button type="button" class="btn" :disabled="!canAnswer" @click="simulate(false)">Wrong</button>
    </div>
    <div class="row">
      <span class="muted">Progress</span>
      <button type="button" class="btn" @click="answer(20)">+20 answers</button>
      <button type="button" class="btn" @click="answer(100)">+100 answers</button>
      <button type="button" class="btn" :disabled="graduated >= unlockAt" @click="toUnlock">Unlock duals</button>
      <button type="button" class="btn" @click="nextDay">+1 day</button>
    </div>
    <p class="muted">Answers are 80% correct. Keys: C correct, X wrong.</p>
  </div>
</template>

<style scoped>
.dev {
  border-style: dashed;
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}
.row .muted {
  width: 70px;
}
p {
  margin: 0;
}
</style>
