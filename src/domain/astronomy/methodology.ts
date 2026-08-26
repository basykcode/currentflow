export const ASTRONOMY_ENGINE_VERSION = '2.1.19' as const

export const CELESTIAL_ASTRONOMY_METHODOLOGY = Object.freeze({
  ephemeris: 'celestial-ephemeris:astronomy-engine-v1',
  lunarElongation: 'lunar-elongation:moonphase-v1',
  lunarIllumination: 'lunar-illumination:astronomy-engine-v1',
  lunarEvents: 'lunar-events:search-moon-phase-v1',
  lunarPhasePolicy: 'astronomical-lunar-phase-eight-sector:v1',
  solarLongitude: 'solar-longitude:sun-position-true-ecliptic-date-v1',
  solarTermEvents: 'solar-term-events:search-sun-longitude-v1',
} as const)
