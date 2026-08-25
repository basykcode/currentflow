<script setup lang="ts">
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import type { TemporalClockEvent } from '@/domain/time/chu-zheng-ke'

import HexagramCard from './HexagramCard.vue'
import OrganCard from './OrganCard.vue'

withDefaults(
  defineProps<{
    snapshot: CurrentFlowSnapshot
    lastTemporalEvent?: TemporalClockEvent
  }>(),
  { lastTemporalEvent: 'minute-passage' },
)

const emit = defineEmits<{
  openOrganDetails: []
}>()
</script>

<template>
  <div class="five-elements" aria-label="Current temporal signature">
    <div class="temporal-row" data-glance-row="temporal">
      <div class="cell cell-year" data-glance-item="year">
        <HexagramCard :item="snapshot.temporal.year" density="glance-compact" />
      </div>
      <div class="cell cell-day" data-glance-item="day">
        <HexagramCard :item="snapshot.temporal.day" density="glance-featured" />
      </div>
      <div class="cell cell-month" data-glance-item="month">
        <HexagramCard :item="snapshot.temporal.month" density="glance-compact" />
      </div>
    </div>

    <div class="active-row" data-glance-row="active">
      <div class="cell cell-organ" data-glance-item="organ">
        <OrganCard
          :organ="snapshot.organ"
          density="glance"
          :last-event="lastTemporalEvent"
          @select="emit('openOrganDetails')"
        />
      </div>
      <div class="cell cell-hour" data-glance-item="hour">
        <HexagramCard :item="snapshot.temporal.hour" density="glance-regular" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.five-elements {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--glance-gap, 0.55rem);
  min-width: 0;
  min-height: 0;
}

.temporal-row,
.active-row {
  display: grid;
  gap: var(--glance-gap, 0.55rem);
  min-width: 0;
  min-height: 0;
}

.temporal-row {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
}

.active-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cell {
  display: grid;
  min-width: 0;
  min-height: 0;
}

@media (min-width: 768px) {
  .five-elements {
    grid-template-rows: repeat(2, minmax(14rem, 1fr));
  }
}
</style>
