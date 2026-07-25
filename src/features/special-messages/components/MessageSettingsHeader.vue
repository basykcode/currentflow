<script setup lang="ts">
const props = defineProps<{
  textSize: number
  volume: number
  muted: boolean
  musicAvailable: boolean
}>()

const emit = defineEmits<{
  'update:textSize': [value: number]
  'update:volume': [value: number]
  'update:muted': [value: boolean]
}>()

function readRangeValue(event: Event): number {
  return Number((event.currentTarget as HTMLInputElement).value)
}
</script>

<template>
  <header class="message-settings-header">
    <div class="message-control text-control">
      <div class="control-heading">
        <label for="message-text-size">Text Size</label>
        <output for="message-text-size">{{ textSize }} px</output>
      </div>
      <input
        id="message-text-size"
        type="range"
        min="18"
        max="56"
        step="1"
        :value="textSize"
        aria-label="Message text size"
        @input="emit('update:textSize', readRangeValue($event))"
      />
    </div>

    <div class="message-title">
      <p>Special Message · VH</p>
      <h1>A Message for my Buddy Vada</h1>
    </div>

    <div class="message-control music-control">
      <div class="control-heading">
        <label for="message-volume">Music Volume</label>
        <output for="message-volume">{{ volume }}%</output>
      </div>
      <div class="volume-row">
        <input
          id="message-volume"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="volume"
          :disabled="!musicAvailable"
          aria-label="Music volume"
          aria-describedby="music-availability"
          @input="emit('update:volume', readRangeValue($event))"
        />
        <button
          type="button"
          :disabled="!musicAvailable"
          :aria-pressed="muted"
          @click="emit('update:muted', !props.muted)"
        >
          {{ muted ? 'Unmute' : 'Mute' }}
        </button>
      </div>
      <p id="music-availability" class="music-availability" role="status">
        {{ musicAvailable ? 'Looping while this page is open' : 'Track not added yet' }}
      </p>
    </div>
  </header>
</template>

<style scoped>
.message-settings-header {
  display: grid;
  position: sticky;
  top: 0;
  z-index: 5;
  grid-template-columns: minmax(12rem, 1fr) minmax(18rem, 2fr) minmax(12rem, 1fr);
  align-items: center;
  gap: clamp(1rem, 3vw, 3rem);
  min-height: 8.25rem;
  border-bottom: 1px solid rgb(255 255 255 / 22%);
  background: rgb(2 7 16 / 78%);
  padding: 1rem clamp(1rem, 3vw, 3rem);
  color: #fff;
  backdrop-filter: blur(16px);
}

.message-title {
  text-align: center;
}

.message-title p {
  margin: 0 0 0.35rem;
  color: rgb(255 255 255 / 68%);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.message-title h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.45rem, 2.5vw, 2.45rem);
  font-weight: 500;
  letter-spacing: -0.025em;
}

.message-control {
  min-width: 0;
}

.control-heading,
.volume-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.control-heading {
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.72rem;
}

.control-heading label {
  font-weight: 700;
}

.control-heading output,
.music-availability {
  color: rgb(255 255 255 / 68%);
}

input[type='range'] {
  width: 100%;
  accent-color: #fff;
}

input[type='range']:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.music-control {
  justify-self: end;
  width: min(100%, 18rem);
}

.text-control {
  width: min(100%, 18rem);
}

.volume-row button {
  min-width: 4.25rem;
  border: 1px solid rgb(255 255 255 / 36%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  padding: 0.38rem 0.62rem;
  color: #fff;
  font-size: 0.68rem;
}

.volume-row button:hover:not(:disabled) {
  background: rgb(255 255 255 / 18%);
}

.volume-row button:disabled {
  color: rgb(255 255 255 / 45%);
}

.music-availability {
  margin: 0.28rem 0 0;
  font-size: 0.62rem;
  text-align: right;
}

@media (max-width: 760px) {
  .message-settings-header {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem 1rem;
    padding-block: 0.9rem 1rem;
  }

  .message-title {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .text-control {
    grid-column: 1;
  }

  .music-control {
    grid-column: 2;
  }

  .message-title h1 {
    font-size: clamp(1.35rem, 6vw, 1.85rem);
  }
}

@media (max-width: 440px) {
  .message-settings-header {
    position: relative;
    grid-template-columns: 1fr;
  }

  .message-title,
  .text-control,
  .music-control {
    grid-column: 1;
    width: 100%;
  }

  .music-control {
    justify-self: stretch;
  }

  .music-availability {
    text-align: left;
  }
}
</style>
