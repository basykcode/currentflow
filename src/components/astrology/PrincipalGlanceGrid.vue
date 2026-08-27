<script setup lang="ts">
import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import type { TemporalClockEvent } from '@/domain/time/chu-zheng-ke'

import GuidanceOutputPanel from './GuidanceOutputPanel.vue'
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
  <div class="principal-glance" aria-label="Current temporal and guidance instrument">
    <div
      class="principal-glance__temporal"
      data-glance-row="temporal-sandwich"
      data-column-ratio="1-2-1"
    >
      <div class="principal-glance__year" data-glance-item="year">
        <HexagramCard :item="snapshot.temporal.year" density="glance-compact" />
      </div>

      <div class="principal-glance__center-stack">
        <div class="principal-glance__hour" data-glance-item="hour">
          <HexagramCard
            :item="snapshot.temporal.hour"
            density="glance-featured"
            visual-layout="horizontal"
          />
        </div>

        <div class="principal-glance__day" data-glance-item="day">
          <HexagramCard
            :item="snapshot.temporal.day"
            density="glance-regular"
            visual-layout="horizontal"
          />
        </div>
      </div>

      <div class="principal-glance__month" data-glance-item="month">
        <HexagramCard :item="snapshot.temporal.month" density="glance-compact" />
      </div>
    </div>

    <div class="principal-glance__active" data-glance-row="active-guidance" data-column-ratio="1-1">
      <div class="principal-glance__organ" data-glance-item="organ">
        <OrganCard
          :organ="snapshot.organ"
          density="glance"
          :last-event="lastTemporalEvent"
          @select="emit('openOrganDetails')"
        />
      </div>

      <GuidanceOutputPanel
        class="principal-glance__guidance"
        :bundle="snapshot.guidance"
        :show-oltr="false"
        density="glance"
      />
    </div>
  </div>
</template>

<style scoped>
.principal-glance {
  display: grid;
  gap: var(--glance-gap, 0.55rem);
  min-width: 0;
}

.principal-glance__temporal,
.principal-glance__active,
.principal-glance__center-stack,
.principal-glance__temporal > *,
.principal-glance__active > * {
  display: grid;
  min-width: 0;
  min-height: 0;
}

.principal-glance__temporal {
  grid-template-areas: 'year center month';
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--glance-gap, 0.55rem);
}

.principal-glance__year {
  grid-area: year;
}

.principal-glance__center-stack {
  grid-area: center;
  grid-template-rows: repeat(2, minmax(10rem, auto));
  gap: var(--glance-gap, 0.55rem);
}

.principal-glance__month {
  grid-area: month;
}

.principal-glance__active {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--glance-gap, 0.55rem);
}

.principal-glance__organ,
.principal-glance__guidance {
  height: 100%;
}

@media (min-width: 768px) and (max-height: 900px) {
  .principal-glance__center-stack {
    grid-template-rows: repeat(2, minmax(0, auto));
  }
}
</style>
