<script setup lang="ts">
import {
  CalendarDate,
  getLocalTimeZone,
} from "@internationalized/date";

// same shape reka-ui uses for range selections
type CalendarRange = {
  start: CalendarDate;
  end: CalendarDate | undefined;
};

const props = defineProps({
  modelValue: {
    type: Object as PropType<{ start: Date; end: Date } | null>,
    default: null,
  },
});

const emit = defineEmits(["update:model-value", "close"]);

function toCalendarDate(date: Date) {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function toDate(date: CalendarDate) {
  return date.toDate(getLocalTimeZone());
}

const date = computed<CalendarRange | undefined>({
  get: () =>
    props.modelValue
      ? {
          start: toCalendarDate(props.modelValue.start),
          end: toCalendarDate(props.modelValue.end),
        }
      : undefined,
  set: (value) => {
    // wait until the user picked both ends of the range
    if (!value?.start || !value?.end) return;
    emit("update:model-value", {
      start: toDate(value.start),
      end: toDate(value.end),
    });
    emit("close");
  },
});
</script>

<template>
  <UCalendar
    v-model="date"
    range
    locale="en-GB"
    :number-of-months="2"
    color="info"
    variant="outline"
    v-bind="$attrs"
  />
</template>
