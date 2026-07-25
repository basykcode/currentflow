<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import MessageSettingsHeader from '@/features/special-messages/components/MessageSettingsHeader.vue'
import SpecialMessageBody from '@/features/special-messages/components/SpecialMessageBody.vue'
import SpecialMessageGate from '@/features/special-messages/components/SpecialMessageGate.vue'
import type { SpecialMessageContent } from '@/features/special-messages/security'

const message = ref<SpecialMessageContent | null>(null)
const textSize = ref(24)
const volume = ref(55)
const muted = ref(false)
const audioElement = ref<HTMLAudioElement | null>(null)

// Add the licensed local track here when it is supplied. Keeping this null prevents a hidden request.
const trackSource: string | null = null
const musicAvailable = trackSource !== null
const pageStyle = computed(() => ({
  '--message-font-size': `${textSize.value}px`,
}))

function syncAudioSettings() {
  if (!audioElement.value) {
    return
  }

  audioElement.value.volume = volume.value / 100
  audioElement.value.muted = muted.value
}

async function startMusic() {
  if (!trackSource || !audioElement.value) {
    return
  }

  try {
    await audioElement.value.play()
  } catch {
    muted.value = true
  }
}

async function handleUnlock(unlockedMessage: SpecialMessageContent) {
  message.value = unlockedMessage
  await nextTick()
  syncAudioSettings()
  await startMusic()
}

watch([volume, muted], syncAudioSettings)

onBeforeUnmount(() => {
  audioElement.value?.pause()
})
</script>

<template>
  <div class="special-message-page" :style="pageStyle">
    <div class="message-background" aria-hidden="true"></div>

    <MessageSettingsHeader
      v-model:text-size="textSize"
      v-model:volume="volume"
      v-model:muted="muted"
      :music-available="musicAvailable"
    />

    <SpecialMessageGate v-if="!message" @unlocked="handleUnlock" />
    <SpecialMessageBody v-else :message="message" />

    <audio
      v-if="trackSource"
      ref="audioElement"
      :src="trackSource"
      loop
      preload="metadata"
      aria-hidden="true"
    ></audio>
  </div>
</template>

<style scoped>
.special-message-page {
  position: relative;
  z-index: 0;
  min-height: 100svh;
  overflow: clip;
  color: #fff;
}

.message-background {
  position: fixed;
  inset: 0;
  z-index: -2;
  background-image: url('/media/vada-drive.gif');
  background-position: center;
  background-size: cover;
}

.message-background::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgb(2 5 15 / 38%), rgb(2 5 15 / 58%)),
    radial-gradient(circle at 50% 25%, transparent 0 20%, rgb(0 3 10 / 32%) 78%);
  content: '';
}

@media (max-width: 620px) {
  .message-background {
    background-position: 50% center;
  }

  .message-background::after {
    background: linear-gradient(180deg, rgb(2 5 15 / 52%), rgb(2 5 15 / 68%));
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-background {
    background-image: url('/media/vada-drive-still.png');
  }
}
</style>
