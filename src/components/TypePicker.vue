<script setup lang="ts">
import { TYPES, type TypeId } from '@/data/types'
import TypeIcon from '@/components/TypeIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: TypeId[]
    /** Maximum selected types; picking past it drops the oldest pick. */
    max?: number
    disabled?: boolean
    /** Per-type marks shown after answering (quiz feedback). */
    marks?: Partial<Record<TypeId, 'ok' | 'missed' | 'wrong'>>
  }>(),
  { max: 18, disabled: false, marks: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [TypeId[]] }>()

function toggle(t: TypeId) {
  if (props.disabled) return
  const cur = props.modelValue
  if (cur.includes(t)) {
    emit(
      'update:modelValue',
      cur.filter((x) => x !== t),
    )
  } else {
    const next = [...cur, t]
    emit('update:modelValue', next.length > props.max ? next.slice(next.length - props.max) : next)
  }
}
</script>

<template>
  <div class="picker" role="group">
    <button
      v-for="t in TYPES"
      :key="t"
      type="button"
      class="opt"
      :class="[{ on: modelValue.includes(t) }, marks?.[t]]"
      :aria-pressed="modelValue.includes(t)"
      :disabled="disabled"
      @click="toggle(t)"
    >
      <TypeIcon :type="t" :scale="2" />
    </button>
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 4px;
}

.opt {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.6;
}
.opt:hover:not(:disabled) {
  background: var(--hover);
  opacity: 1;
}
.opt.on {
  background: var(--sel);
  border-color: var(--accent);
  opacity: 1;
}
.opt:disabled {
  cursor: default;
}
.opt.ok {
  border-color: var(--good);
  box-shadow: inset 0 0 0 1px var(--good);
  opacity: 1;
}
.opt.missed {
  border-color: var(--bad);
  border-style: dashed;
  box-shadow: inset 0 0 0 1px var(--bad);
  opacity: 1;
}
.opt.wrong {
  border-color: var(--bad);
  box-shadow: inset 0 0 0 1px var(--bad);
  opacity: 1;
  background: var(--m05-bg);
}
</style>
