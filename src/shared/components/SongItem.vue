<script setup lang="ts">
import { MessageAPI } from '@cloudfly/eno-ui'
import cn from 'classnames'
import { computed } from 'vue'
import { useApiClient } from '~/api'
import { trackMatches } from '~/shared/playerBridge'
import { expandVideoPages, pageCount } from '~/shared/videoPages'
import { useLibraryStore, usePlayerStore, useSingerStore, useUiStore } from '~/stores'

const props = defineProps({
  song: {
    type: Object,
    default: null,
  },
  size: {
    type: String,
    default: 'default',
  },
  star: {
    type: Boolean,
    default: true,
  },
  del: {
    type: Boolean,
    default: false,
  },
  checkPages: {
    type: Boolean,
    default: false,
  },
  later: {
    type: Boolean,
    default: true,
  },
  showActive: {
    type: Boolean,
    default: true,
  },
  index: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['deleteSong'])

const api = useApiClient()

const store = usePlayerStore()
const PLstore = useLibraryStore()
const ui = useUiStore()
const singerStore = useSingerStore()

const { later, del, star, checkPages } = props
const { cover, title, author, pages, mid, page, album } = props.song
const parts = computed(() => pageCount(pages))

const isPlaying = computed(() => {
  if (!props.showActive)
    return false
  return trackMatches(store.play, props.song)
})

const isMini = computed(() => props.size === 'mini')

const durationText = computed(() => {
  const input = props.song?.duration
  if (typeof input === 'string' && input.includes(':')) {
    const [m, s] = input.split(':')
    return `${m}:${String(Math.floor(Number(s) || 0)).padStart(2, '0')}`
  }
  const d = Number(input)
  if (!Number.isFinite(d) || d <= 0)
    return ''
  const m = Math.floor(d / 60)
  const s = Math.floor(d % 60)
  return `${m}:${String(s).padStart(2, '0')}`
})

async function handleClick() {
  const song = props.song
  if (song?.eno_song_type === 'live') {
    store.startPlay(song)
    return
  }
  if (song?.eno_song_type === 'cid' && song?.cid) {
    store.startPlay(song)
    return
  }
  if (!checkPages && parts.value <= 1) {
    store.startPlay(song)
    return
  }
  try {
    const item = await api.blbl.getVideoInfo({
      bvid: song.bvid,
    }).then(res => res.data)
    const tracks = expandVideoPages({
      ...song,
      bvid: item.bvid || song.bvid,
      title: item.title || song.title,
      author: item.owner?.name || song.author,
      cover: item.pic || song.cover,
      mid: item.owner?.mid || song.mid,
      aid: item.aid,
    }, item.pages || [])
    if (tracks.length > 1)
      store.playAlbum(tracks)
    else
      store.startPlay(tracks[0] || song)
  }
  catch {
    store.startPlay(song)
  }
}

function addToLater() {
  const isInLater = PLstore.listenLater.some(i => i.id === props.song.id)
  if (isInLater) {
    MessageAPI.show({
      type: 'error',
      message: '已存在',
    })
    return
  }
  PLstore.addToListenLater(props.song)
  MessageAPI.show({
    type: 'info',
    message: '已添加到稍后再听',
  })
}

function handleSingerDetail(singerMid) {
  if (!singerMid)
    return
  singerStore.currentSinger = singerMid
  ui.go('singerDetail')
}
</script>

<template>
  <div
    :class="cn('song-item', { 'song-item--playing': isPlaying, 'song-item--mini': isMini })"
    @click="handleClick"
  >
    <div class="song-index">
      <span class="index-num">{{ index || '' }}</span>
    </div>
    <img :src="cover" class="song-cover" alt="">
    <div class="song-meta">
      <div class="song-title" :title="title" v-html="title" />
      <div class="song-author">
        <span v-if="song.eno_song_type === 'live'" class="song-tag song-tag--live">LIVE</span>
        <span v-else-if="parts > 1" class="song-tag">{{ parts }}P</span>
        <span v-else-if="page && album" class="song-tag">P{{ page }}</span>
        <span class="author-link" @click.stop="handleSingerDetail(mid)">
          {{ author }}
        </span>
      </div>
    </div>
    <span v-if="durationText" class="song-dur">{{ durationText }}</span>
    <div class="song-actions">
      <span v-if="isPlaying" class="eno-seal eno-seal--sm eno-seal--round">在听</span>
      <div v-if="later" class="i-tabler:clock action-icon" title="稍后再听" @click.stop="addToLater" />
      <div v-if="star" class="i-tabler:star action-icon" title="加入歌单" @click.stop="PLstore.startAddSong(props.song)" />
      <div v-if="del" class="i-tabler:trash action-icon" title="删除" @click.stop="emit('deleteSong', props.song)" />
    </div>
  </div>
</template>

<style scoped>
.song-item {
  display: grid;
  grid-template-columns: 48px 44px minmax(0, 1fr) 56px auto;
  align-items: center;
  gap: 14px;
  height: 64px;
  padding: 0 12px;
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  cursor: pointer;
  transition: background-color 0.18s var(--eno-ease), color 0.18s var(--eno-ease);
}

.song-item:hover {
  background: var(--eno-fill-1);
  color: var(--eno-text-1);
}

.song-item:hover .action-icon,
.song-item:hover .index-num {
  opacity: 1;
}

/* 播放中：纸色印块 + 行尾朱印 */
.song-item--playing {
  background: var(--eno-fill-2);
  color: var(--eno-text-1);
}

.song-item--playing:hover {
  background: var(--eno-fill-3);
}

.song-item--mini {
  height: 52px;
  grid-template-columns: 0 40px minmax(0, 1fr) 56px auto;
  padding: 0 8px;
}

.song-dur {
  color: var(--eno-text-3);
  font-family: var(--app-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.song-index {
  display: flex;
  width: 48px;
  justify-content: flex-start;
  font-family: var(--app-font-display);
  font-size: 21px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.index-num {
  color: var(--eno-text-3);
  transition: opacity 0.18s var(--eno-ease), color 0.18s var(--eno-ease);
}

.song-item--playing .index-num {
  color: #ef8477;
  opacity: 1;
}

.song-item--playing .eno-seal {
  border-color: #ef8477;
  color: #ef8477;
  box-shadow: inset 0 0 0 2px var(--lp-ink), inset 0 0 0 3px rgb(239 132 119 / 55%);
}

.song-cover {
  width: 44px;
  height: 44px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
}

.song-meta {
  min-width: 0;
}

.song-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.35;
}

.song-title :deep(em) {
  color: var(--lp-seal-bright);
  font-style: normal;
}

.song-author {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  color: var(--eno-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.author-link:hover {
  color: var(--eno-text-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.song-tag {
  flex-shrink: 0;
  padding: 0 5px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-3);
  font-family: var(--app-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  line-height: 16px;
}

.song-tag--live {
  border-color: var(--lp-seal-bright);
  color: var(--lp-seal-bright);
}

.song-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.action-icon {
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.16s var(--eno-ease), color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.action-icon:hover {
  color: var(--eno-text-1);
  transform: scale(1.1);
}

.action-icon:active {
  transform: scale(0.92);
}

.song-item--mini .action-icon,
.song-item:focus-within .action-icon {
  opacity: 0.85;
}
</style>
