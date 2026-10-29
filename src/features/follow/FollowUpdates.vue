<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchFollowUpdates } from '~/shared/fetchFollowUpdates'
import { trackMatches } from '~/shared/playerBridge'
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
        新稿
      </div>
      <div>
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
        :class="{ 'update-row--on': trackMatches(player.play, song) }"
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
      <div v-if="loaded && !count && !busy" class="eno-empty">
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
  gap: 28px;
  align-items: center;
  padding: 32px 32px 20px;
}

/* 页首朱印方章 */
.updates-mark {
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

.updates-actions {
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

.ghost--on {
  border-color: transparent;
  color: var(--lp-paper);
  background: var(--eno-primary);
}

.ghost--on:hover {
  color: var(--lp-paper);
  background: var(--eno-primary-hover);
}

.updates-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 24px 40px;
}

/* 内页行：来稿时间 + 封面 + 曲名 */
.update-row {
  display: grid;
  grid-template-columns: 72px 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  height: 64px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  background: transparent;
  color: var(--eno-text-2);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s var(--eno-ease);
}

.update-row:hover {
  background: var(--eno-fill-1);
  color: var(--eno-text-1);
}

.update-row--on {
  background: var(--eno-fill-2);
  color: var(--eno-text-1);
}

.update-row--on:hover {
  background: var(--eno-fill-3);
}

/* 在听的行：行尾朱印落下 */
.update-row--on::after {
  grid-column: 4;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
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

.ago {
  color: var(--eno-text-3);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cover {
  width: 44px;
  height: 44px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
}

.cover--empty {
  background: var(--lp-ink-2);
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
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.35;
}

.title :deep(em) {
  color: var(--lp-seal-bright);
  font-style: normal;
}

.author {
  margin-top: 2px;
  color: var(--eno-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.author-link:hover {
  color: var(--eno-text-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 860px) {
  .updates-hero {
    gap: 20px;
    padding: 24px 16px 16px;
  }

  .updates-mark {
    width: 92px;
    height: 92px;
    font-size: 22px;
  }

  h1 {
    font-size: 34px;
  }

  .updates-list {
    padding: 8px 12px 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .update-row,
  .update-row--on::after {
    transition: none;
    animation: none;
    transform: none;
  }
}
</style>
