<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { fetchMusicAreaLives, MUSIC_LIVE_AREAS } from '~/shared/fetchLiveRooms'
import { songKey } from '~/shared/playerBridge'
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
        LIVE
      </div>
      <div>
        <div class="kicker">
          音乐区
        </div>
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
            class="ghost"
            :class="{ 'ghost--on': areaId === item.id }"
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

    <div v-if="loaded && failed && !lives.length" class="empty">
      这一页没拉下来。
      <button type="button" class="ghost" :disabled="busy" @click="load(true)">
        重试
      </button>
    </div>
    <div v-else-if="loaded && !lives.length" class="empty">
      这一区暂时没有直播，过一会儿再刷新。
    </div>

    <div v-else class="live-grid">
      <button
        v-for="room in lives"
        :key="room.id"
        class="live-card"
        :class="{ 'live-card--on': listening && songKey(listening) === songKey(room) }"
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
  align-items: flex-end;
  gap: 24px;
  padding: 32px;
}

.live-hero-mark {
  display: flex;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #e91429;
  color: #fff;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.kicker {
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 8px 0 8px;
  font-size: 48px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

p {
  margin: 0;
  color: #b3b3b3;
}

.live-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.ghost {
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: #282828;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.ghost--on {
  color: #000;
  background: #fff;
}

.ghost:disabled {
  opacity: 0.6;
  cursor: wait;
}

.empty {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  color: #b3b3b3;
}

.live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 8px 32px 40px;
}

.live-card {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.live-card--on .live-name {
  color: #e91429;
}

.live-thumb {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #282828;
  aspect-ratio: 16 / 9;
}

.live-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-dot {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 1px 6px;
  border-radius: 2px;
  background: #e91429;
  font-size: 10px;
  font-weight: 800;
}

.live-name {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-author {
  margin-top: 4px;
  font-size: 13px;
  color: #b3b3b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
