<script setup lang="ts">
import { ref } from 'vue'

import CelestialCurrentDetails from '@/components/astrology/CelestialCurrentDetails.vue'
import CelestialCurrentHeader from '@/components/astrology/CelestialCurrentHeader.vue'
import LunarCurrentInstrument from '@/components/astrology/LunarCurrentInstrument.vue'
import SolarCurrentInstrument from '@/components/astrology/SolarCurrentInstrument.vue'
import {
  createCelestialDevelopmentFixture,
  presentLunarHomeInstrument,
  presentSolarHomeInstrument,
  resolveBranchMonthFromSolarLongitude,
  resolveChineseSolarSeason,
  type AnnualYinYangMovement,
  type CantongQiNodeId,
  type CelestialDetailsTarget,
  type LunarHomeInstrumentViewModel,
  type SolarHomeInstrumentViewModel,
} from '@/domain/current-flow/celestial-instruments'

const cantongNodes: readonly CantongQiNodeId[] = [
  'zhen-emergence',
  'dui-accumulation',
  'qian-culmination',
  'xun-distribution',
  'gen-consolidation',
  'kun-concealment',
]

const lunarAngles = [0, 45, 90, 135, 180, 225, 270, 315] as const
const lunarStates = lunarAngles.map((angle, index) => {
  const cantongQiNodeId = angle === 45 ? 'kun-concealment' : cantongNodes[index % 6]
  if (!cantongQiNodeId) throw new Error('Missing development Cantong qi fixture.')
  return {
    label:
      angle === 45 ? `${angle}° · intentional astronomy/calendar mismatch` : `${angle}° elongation`,
    viewModel: presentLunarHomeInstrument(
      createCelestialDevelopmentFixture({
        lunarElongationDegrees: angle,
        cantongQiNodeId,
      }).lunar,
    ),
  }
})

const solarDefinitions = [
  ['Winter Solstice', 'dongzhi', 270, 'Yang Returning'],
  ['Spring Equinox', 'chunfen', 0, 'Yang Growing'],
  ['Summer Solstice', 'xiazhi', 90, 'Yang Full'],
  ['Autumn Equinox', 'qiufen', 180, 'Yin Growing'],
  ['Lichun', 'lichun', 315, 'Yang Emerging'],
  ['Lixia', 'lixia', 45, 'Yang Growing'],
  ['Liqiu', 'liqiu', 135, 'Yin Emerging'],
  ['Lidong', 'lidong', 225, 'Yin Full'],
  ['Chushu', 'chushu', 150, 'Yang Descending'],
] as const satisfies readonly (readonly [string, string, number, AnnualYinYangMovement])[]

const solarStates = solarDefinitions.map(([label, solarTermId, longitude, movement]) => {
  const base = createCelestialDevelopmentFixture().seasonal
  return {
    label,
    viewModel: presentSolarHomeInstrument({
      ...base,
      solarLongitudeDegrees: longitude,
      solarTermId,
      season: resolveChineseSolarSeason(longitude),
      branchMonth: resolveBranchMonthFromSolarLongitude(longitude),
      yinYangMovement: movement,
    }),
  }
})

const unavailableLunar = presentLunarHomeInstrument(null)
const unavailableSolar = presentSolarHomeInstrument(null)
const featuredLunar = lunarStates[5]?.viewModel ?? unavailableLunar
const featuredSolar = solarStates[8]?.viewModel ?? unavailableSolar
const selectedLunar = ref<LunarHomeInstrumentViewModel>(featuredLunar)
const selectedSolar = ref<SolarHomeInstrumentViewModel>(featuredSolar)
const details = ref<{ open: (target: CelestialDetailsTarget) => Promise<void> } | null>(null)

const openLunar = (viewModel: LunarHomeInstrumentViewModel) => {
  selectedLunar.value = viewModel
  void details.value?.open(viewModel.detailsTarget)
}

const openSolar = (viewModel: SolarHomeInstrumentViewModel) => {
  selectedSolar.value = viewModel
  void details.value?.open(viewModel.detailsTarget)
}
</script>

<template>
  <main class="page-shell celestial-gallery">
    <header class="gallery-intro">
      <p class="eyebrow">Development fixture · never production astronomy</p>
      <h1>Celestial Current instrument gallery</h1>
      <p>
        Visual, interaction, and responsive states for the proposed Moon and Sun instruments. All
        values on this route are explicit fixtures.
      </p>
    </header>

    <section class="gallery-section" aria-labelledby="regular-heading">
      <h2 id="regular-heading">Desktop regular composition</h2>
      <div class="gallery-surface">
        <CelestialCurrentHeader
          :lunar="featuredLunar"
          :solar="featuredSolar"
          timezone="UTC"
          @open-lunar-details="openLunar(featuredLunar)"
          @open-solar-details="openSolar(featuredSolar)"
        />
      </div>
    </section>

    <section class="gallery-section" aria-labelledby="compact-heading">
      <h2 id="compact-heading">Mobile compact composition</h2>
      <p class="gallery-note">
        This bounded frame exercises the three-column composition; viewport QA verifies its
        responsive rules.
      </p>
      <div class="gallery-surface gallery-mobile-frame">
        <CelestialCurrentHeader
          :lunar="lunarStates[1]!.viewModel"
          :solar="solarStates[4]!.viewModel"
          timezone="America/Los_Angeles"
          selected-time-jump
          compact
          @open-lunar-details="openLunar(lunarStates[1]!.viewModel)"
          @open-solar-details="openSolar(solarStates[4]!.viewModel)"
        />
      </div>
    </section>

    <section class="gallery-section" aria-labelledby="theme-heading">
      <h2 id="theme-heading">Theme and motion representations</h2>
      <div class="theme-grid">
        <div class="gallery-surface theme-preview theme-preview--dark">
          <h3>Dark</h3>
          <LunarCurrentInstrument
            :view-model="featuredLunar"
            @open-details="openLunar(featuredLunar)"
          />
        </div>
        <div class="gallery-surface theme-preview theme-preview--light">
          <h3>Light</h3>
          <SolarCurrentInstrument
            :view-model="featuredSolar"
            @open-details="openSolar(featuredSolar)"
          />
        </div>
        <div class="gallery-surface theme-preview theme-preview--reduced">
          <h3>Reduced motion</h3>
          <LunarCurrentInstrument
            :view-model="lunarStates[6]!.viewModel"
            :interpolate-marker="false"
            reduce-motion
            @open-details="openLunar(lunarStates[6]!.viewModel)"
          />
        </div>
      </div>
    </section>

    <section class="gallery-section" aria-labelledby="moon-heading">
      <h2 id="moon-heading">Moon angles and six Cantong qi nodes</h2>
      <div class="fixture-grid">
        <article v-for="fixture in lunarStates" :key="fixture.label" class="fixture-card">
          <h3>{{ fixture.label }}</h3>
          <LunarCurrentInstrument
            :view-model="fixture.viewModel"
            @open-details="openLunar(fixture.viewModel)"
          />
        </article>
      </div>
    </section>

    <section class="gallery-section" aria-labelledby="sun-heading">
      <h2 id="sun-heading">Solar Terms and seasonal boundaries</h2>
      <div class="fixture-grid">
        <article v-for="fixture in solarStates" :key="fixture.label" class="fixture-card">
          <h3>{{ fixture.label }}</h3>
          <SolarCurrentInstrument
            :view-model="fixture.viewModel"
            alignment="left"
            @open-details="openSolar(fixture.viewModel)"
          />
        </article>
      </div>
    </section>

    <section class="gallery-section" aria-labelledby="unavailable-heading">
      <h2 id="unavailable-heading">Explicit unavailable states</h2>
      <div class="fixture-grid">
        <article class="fixture-card">
          <LunarCurrentInstrument
            :view-model="unavailableLunar"
            @open-details="openLunar(unavailableLunar)"
          />
        </article>
        <article class="fixture-card">
          <SolarCurrentInstrument
            :view-model="unavailableSolar"
            alignment="left"
            @open-details="openSolar(unavailableSolar)"
          />
        </article>
      </div>
    </section>

    <CelestialCurrentDetails
      ref="details"
      :lunar="selectedLunar"
      :solar="selectedSolar"
      @retry="() => undefined"
    />
  </main>
</template>

<style scoped>
.celestial-gallery {
  --celestial-instrument-size: clamp(5.5rem, 10vw, 7.25rem);

  display: grid;
  gap: 2.5rem;
}

.gallery-intro {
  max-width: 55rem;
}

.gallery-intro h1 {
  margin-bottom: 0.75rem;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 500;
}

.gallery-intro p:last-child,
.gallery-note {
  margin-bottom: 0;
  color: var(--ink-soft);
}

.gallery-section {
  display: grid;
  gap: 1rem;
}

.gallery-section > h2,
.fixture-card h3,
.theme-preview h3 {
  margin-bottom: 0;
}

.gallery-surface,
.fixture-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--paper-raised) 90%, transparent);
  padding: clamp(0.75rem, 2.5vw, 1.5rem);
}

.gallery-mobile-frame {
  width: min(100%, 24.375rem);
  overflow-x: auto;
}

.theme-grid,
.fixture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  gap: 1rem;
}

.theme-preview {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-width: 0;
}

.theme-preview--dark {
  color-scheme: dark;
  --paper: #07162d;
  --paper-raised: #0b2443;
  --ink: #e8f2ff;
  --ink-soft: #bfd5f4;
  --ink-faint: #8da8d2;
  --line: #214b78;
  --jade: #79b4ff;
  --jade-deep: #c0dcff;
  --jade-wash: #123662;
}

.theme-preview--light {
  color-scheme: light;
  --paper: #edf4ff;
  --paper-raised: #fbfdff;
  --ink: #102b4d;
  --ink-soft: #3d5f88;
  --ink-faint: #4d6d98;
  --line: #c3d5ec;
  --jade: #2468ac;
  --jade-deep: #174b85;
  --jade-wash: #d5e6fb;
}

.theme-preview--dark,
.theme-preview--light {
  background: var(--paper);
  color: var(--ink);
}

.theme-preview--reduced {
  border-style: dashed;
}

.fixture-card {
  display: grid;
  align-content: start;
  gap: 0.75rem;
  min-width: 0;
}

.fixture-card h3 {
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 700;
}

@media (max-width: 767px) {
  .celestial-gallery {
    gap: 1.75rem;
    padding-top: 1rem;
  }

  .gallery-surface,
  .fixture-card {
    padding: 0.65rem;
  }
}
</style>
