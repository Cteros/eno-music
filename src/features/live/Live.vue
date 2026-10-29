<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { fetchMusicAreaLives, MUSIC_LIVE_AREAS } from '~/shared/fetchLiveRooms'
import { trackMatches } from '~/shared/playerBridge'
import { usePlayerStore, useUiStore } from '~/stores'

const player = usePlayerStore()
const ui = useUiStore()
const lives = ref<any[]>([])
const areaId = ref<(typeof MUSIC_LIVE_AREAS)[number]['id']>('radio')
const page = ref(1)
const hasMore = ref(false)
const busy = ref(false)
const loaded = ref(false)
const failed = ref(false)
const total = ref(0)
const scroller = ref<HTMLElement | null>(null)

const area = computed(() => MUSIC_LIVE_AREAS.find(item => item.id === areaId.value) || MUSIC_LIVE_AREAS[0])

const listening = computed(() => {
  const play = player.play
  if (play?.eno_song_type !== 'live')
    return null
  return play
})

async function load(reset = false) {
  if (busy.value)
    return
  if (reset) {
    page.value = 1
    lives.value = []
    loaded.value = false
  }
  busy.value = true
  failed.value = false
  try {
    const result = await fetchMusicAreaLives({
      page: page.value,
      parentAreaId: area.value.parentAreaId,
      areaId: area.value.areaId,
    })
    lives.value = reset ? result.rooms : [...lives.value, ...result.rooms.filter(room => !lives.value.some(item => item.id === room.id))]
    hasMore.value = result.hasMore
    total.value = result.total
  }
  catch {
    failed.value = true
    if (reset)
      lives.value = []
    hasMore.value = false
  }
  finally {
    busy.value = false
    loaded.value = true
  }
}

function switchArea(id: (typeof MUSIC_LIVE_AREAS)[number]['id']) {
  if (areaId.value === id)
    return
  areaId.value = id
  void load(true)
}

function playLive(room: any) {
  player.startPlay(room)
}

useInfiniteScroll(
  scroller,
  async () => {
    if (!hasMore.value || busy.value)
      return
    page.value += 1
    await load()
  },
  { distance: 80 },
)

watch(() => ui.mode, (mode) => {
  if (mode !== 'live')
    return
  void load(true)
}, { immediate: true })
</script>

<template>
  <section ref="scroller" class="live-page">
    <header class="live-hero">
      <div class="live-hero-mark">
        在播
      </div>
      <div>
        <h1>直播</h1>
        <p v-if="busy && !loaded">
          正在拉取电台列表…
        </p>
        <p v-else-if="failed">
          列表拉取失败，点重试再拉一次。
        </p>
        <p v-else>
          {{ total ? `在播 ${total} 间 · 当前 ${lives.length} 间` : (loaded ? '这一区暂时没有直播' : '') }}
        </p>
        <div class="live-actions">
          <button
            v-for="item in MUSIC_LIVE_AREAS"
            :key="item.id"
            type="button"
            class="eno-chip"
            :class="{ 'eno-chip--on': areaId === item.id }"
            @click="switchArea(item.id)"
          >
            {{ item.label }}
          </button>
          <button type="button" class="ghost" :disabled="busy" @click="load(true)">
            {{ busy ? '刷新中…' : (failed ? '重试' : '刷新') }}
          </button>
        </div>
      </div>
    </header>

    <div v-if="loaded && failed && !lives.length" class="eno-empty">
      这一页没拉下来。
      <button type="button" class="ghost" :disabled="busy" @click="load(true)">
        重试
      </button>
    </div>
    <div v-else-if="loaded && !lives.length" class="eno-empty">
      这一区暂时没有直播，过一会儿再刷新。
    </div>

    <div v-else class="live-grid">
      <button
        v-for="room in lives"
        :key="room.id"
        class="live-card"
        :class="{ 'live-card--on': listening && trackMatches(listening, room) }"
        type="button"
        @click="playLive(room)"
      >
        <div class="live-thumb">
          <img v-if="room.cover" :src="room.cover" alt="">
          <span class="live-dot">LIVE</span>
        </div>
        <div class="live-name">
          {{ room.title }}
        </div>
        <div class="live-author">
          {{ room.author }}
          <template v-if="room.album">
            · {{ room.album }}
          </template>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.live-page {
  height: 100%;
  overflow: auto;
  padding-bottom: 24px;
}

.live-hero {
  display: flex;
  gap: 28px;
  align-items: center;
  padding: 32px 32px 20px;
}

/* 页首朱印方章 */
.live-hero-mark {
  display: flex;
  width: 116px;
  height: 116px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--lp-seal-bright);
  border-radius: var(--eno-radius-sm);
  color: var(--lp-seal-bright);
  background: var(--lp-ink-deep);
  font-family: var(--app-font-display);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  box-shadow:
    inset 0 0 0 2px var(--lp-ink-deep),
    inset 0 0 0 3px rgb(217 86 74 / 55%);
  transform: rotate(-4deg);
  user-select: none;
}

h1 {
  margin: 0 0 8px;
  font-family: var(--app-font-display);
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.15;
}

p {
  margin: 0;
  color: var(--eno-text-3);
  font-size: 13px;
  letter-spacing: 0.04em;
}

.live-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
}

.ghost {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.live-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 24px 40px;
}

/* 内页行：封面 + 曲名 + 小字条 */
.live-card {
  position: relative;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 14px;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s var(--eno-ease);
}

.live-card:hover {
  background: var(--eno-fill-1);
}

.live-card--on {
  background: var(--eno-fill-2);
}

.live-card--on:hover {
  background: var(--eno-fill-3);
}

/* 在听的行：行尾朱印落下 */
.live-card--on::after {
  grid-column: 3;
  grid-row: 1 / span 2;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-self: center;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  border: 1.5px solid var(--lp-seal-bright);
  border-radius: 50%;
  color: var(--lp-seal-bright);
  background: transparent;
  content: '在听';
  font-family: var(--app-font-serif);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-indent: 0.08em;
  box-shadow:
    inset 0 0 0 1.5px var(--lp-ink),
    inset 0 0 0 2.5px rgb(217 86 74 / 55%);
  animation: eno-stamp 0.34s var(--eno-ease-pop) both;
  transform: rotate(-4deg);
  user-select: none;
}

.live-thumb {
  position: relative;
  overflow: hidden;
  grid-row: 1 / span 2;
  width: 96px;
  height: 54px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--lp-ink-2);
}

.live-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-dot {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 0 5px;
  border: 1px solid var(--lp-seal-bright);
  border-radius: var(--eno-radius-sm);
  color: var(--lp-seal-bright);
  background: var(--lp-ink);
  font-family: var(--app-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 16px;
}

.live-name {
  overflow: hidden;
  grid-row: 1;
  grid-column: 2;
  align-self: end;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-author {
  overflow: hidden;
  grid-row: 2;
  grid-column: 2;
  align-self: start;
  color: var(--eno-text-3);
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .live-hero {
    gap: 20px;
    padding: 24px 16px 16px;
  }

  .live-hero-mark {
    width: 92px;
    height: 92px;
    font-size: 22px;
  }

  h1 {
    font-size: 34px;
  }

  .live-grid {
    padding: 8px 12px 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-card,
  .live-card--on::after {
    transition: none;
    animation: none;
    transform: none;
  }
}
</style>
