<script setup lang="ts">
import { DatePicker as VCalendarDatePicker } from 'v-calendar'
import type { DatePickerDate, DatePickerRangeObject } from 'v-calendar/dist/types/src/use/datePicker.js';
import 'v-calendar/dist/style.css'

const props = defineProps({
  modelValue: {
    type: [Date, Object] as PropType<DatePickerDate | DatePickerRangeObject | null>,
    default: null
  }
})

const emit = defineEmits(['update:model-value', 'close'])

const date = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:model-value', value)
    emit('close')
  }
})

const attrs = {
  variant: 'outline',
  color: 'blue',
  'is-dark': { selector: 'html', darkClass: 'dark' },
  'first-day-of-week': 2,
}
</script>

<template>
  <VCalendarDatePicker
    v-if="date && (typeof date === 'object')"
    v-model.range="date"
    :is24hr="true"
    :columns="2"
    v-bind="{ ...attrs, ...$attrs }"
  />
  <VCalendarDatePicker
    v-else
    v-model="date"
    :is24hr="true"
    v-bind="{ ...attrs, ...$attrs }"
  />
</template>
