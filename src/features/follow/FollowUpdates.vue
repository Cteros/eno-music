<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchFollowUpdates } from '~/shared/fetchFollowUpdates'
import { songKey } from '~/shared/playerBridge'
import { usePlayerStore, useSingerStore, useUiStore } from '~/stores'

const player = usePlayerStore()
const singers = useSingerStore()
const ui = useUiStore()
const tracks = ref<any[]>([])
const busy = ref(false)
const loaded = ref(false)
const failed = ref(false)

const count = computed(() => tracks.value.length)

async function load() {
  if (busy.value)
    return
  if (!singers.singers.length) {
    tracks.value = []
    loaded.value = true
    failed.value = false
    return
  }
  busy.value = true
  failed.value = false
  try {
    tracks.value = await fetchFollowUpdates(singers.singers)
  }
  catch {
    failed.value = true
    tracks.value = []
  }
  finally {
    busy.value = false
    loaded.value = true
  }
}

function playAll() {
  if (!tracks.value.length)
    return
  player.playAlbum(tracks.value)
}

function playOne(song: any) {
  player.playAlbum(tracks.value, song.id)
}

function openSinger(mid: string) {
  if (!mid)
    return
  singers.currentSinger = mid
  ui.go('singerDetail')
}

watch(() => ui.mode, (mode) => {
  if (mode !== 'followUpdates')
    return
  singers.fetchSingerInfoList()
  void load()
}, { immediate: true })
</script>

<template>
  <section class="updates-page">
    <header class="updates-hero">
      <div class="updates-mark">
        NEW
      </div>
      <div>
        <div class="kicker">
          关注的音乐人
        </div>
        <h1>关注人更新</h1>
        <p v-if="busy && !loaded">
          正在拉取最近投稿…
        </p>
        <p v-else-if="failed">
          这一页没拉下来，点重试再试一次。
        </p>
        <p v-else-if="loaded && !singers.singers.length">
          还没有关注的音乐人。
        </p>
        <p v-else>
          {{ count ? `最近 ${count} 条投稿` : (loaded ? '这些人最近没有新稿' : '') }}
        </p>
        <div class="updates-actions">
          <button type="button" class="ghost ghost--on" :disabled="!count" @click="playAll">
            播放全部
          </button>
          <button type="button" class="ghost" :disabled="busy" @click="load">
            {{ busy ? '刷新中…' : (failed ? '重试' : '刷新') }}
          </button>
          <button type="button" class="ghost" @click="ui.go('singerList')">
            管理关注
          </button>
        </div>
      </div>
    </header>

    <div class="updates-list">
      <button
        v-for="song in tracks"
        :key="song.bvid || song.id"
        type="button"
        class="update-row"
        :class="{ 'update-row--on': songKey(player.play) === songKey(song) }"
        @click="playOne(song)"
      >
        <span class="ago">{{ song.pubAgo }}</span>
        <img v-if="song.cover" class="cover" :src="song.cover" alt="">
        <div v-else class="cover cover--empty" />
        <div class="meta">
          <div class="title" v-html="song.title" />
          <div class="author">
            <span class="author-link" @click.stop="openSinger(song.mid)">
              {{ song.author }}
            </span>
          </div>
        </div>
      </button>
      <div v-if="loaded && !count && !busy" class="empty">
        {{ singers.singers.length ? '关注的人最近没有新投稿。' : '去关注几个音乐人，这里会列出他们的新稿。' }}
      </div>
    </div>
  </section>
</template>

<style scoped>
.updates-page {
  height: 100%;
  overflow: auto;
  padding-bottom: 24px;
}

.updates-hero {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 32px;
}

.updates-mark {
  display: flex;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #1ed760;
  color: #000;
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

.updates-actions {
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
  background: #1ed760;
}

.ghost:disabled {
  opacity: 0.6;
  cursor: default;
}

.updates-list {
  display: flex;
  flex-direction: column;
  padding: 0 16px 40px;
}

.update-row {
  display: grid;
  width: 100%;
  grid-template-columns: 88px 48px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 16px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #b3b3b3;
  text-align: left;
  cursor: pointer;
}

.update-row:hover {
  background: rgb(255 255 255 / 10%);
  color: #fff;
}

.update-row--on,
.update-row--on .title {
  color: #1ed760;
}

.ago {
  color: #7a7a7a;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.cover {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.cover--empty {
  background: #282828;
}

.meta {
  min-width: 0;
}

.title,
.author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.author {
  margin-top: 4px;
  font-size: 13px;
}

.author-link:hover {
  color: #fff;
  text-decoration: underline;
}

.empty {
  padding: 24px 16px;
  color: #b3b3b3;
}
</style>
