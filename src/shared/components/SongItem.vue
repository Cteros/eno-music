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
      <span v-if="!isPlaying" class="index-num">{{ index || '' }}</span>
      <div v-else class="i-svg-spinners:bars-scale playing-bars" />
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
    <div class="song-actions">
      <div v-if="later" class="i-mingcute:time-fill action-icon" @click.stop="addToLater" />
      <div v-if="star" class="i-mingcute:star-fill action-icon" @click.stop="PLstore.startAddSong(props.song)" />
      <div v-if="del" class="i-mingcute:delete-3-fill action-icon" @click.stop="emit('deleteSong', props.song)" />
    </div>
  </div>
</template>

<style scoped>
.song-item {
  display: grid;
  grid-template-columns: 44px 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  height: 60px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--eno-radius-lg);
  color: var(--eno-text-2);
  cursor: pointer;
  transition:
    transform 0.18s var(--eno-ease-pop),
    background-color 0.18s var(--eno-ease),
    color 0.18s var(--eno-ease),
    border-color 0.18s var(--eno-ease),
    box-shadow 0.18s var(--eno-ease);
}

.song-item:hover {
  z-index: 1;
  transform: translateY(-2px);
  border-color: rgb(255 255 255 / 8%);
  background: var(--eno-fill-1);
  color: var(--eno-text-1);
  box-shadow: var(--eno-shadow-sm);
}

.song-item:hover .action-icon,
.song-item:hover .index-num {
  opacity: 1;
}

/* 选中/播放中：只用一层极浅的绿色渐变底 + 绿色歌名,排名列换成跳动条 */
.song-item--playing {
  background: linear-gradient(90deg, rgb(30 215 96 / 12%), rgb(30 215 96 / 3%) 55%, transparent);
}

.song-item--playing:hover {
  background: linear-gradient(90deg, rgb(30 215 96 / 18%), rgb(30 215 96 / 5%) 55%, transparent);
}

.song-item--mini {
  height: 52px;
  grid-template-columns: 0 40px minmax(0, 1fr) auto;
  padding: 0 8px;
}

.song-index {
  display: flex;
  width: 44px;
  justify-content: flex-start;
  font-family: var(--app-font-display);
  font-size: 22px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
}

.index-num {
  opacity: 0.55;
  transition: opacity 0.18s var(--eno-ease), color 0.18s var(--eno-ease), text-shadow 0.18s var(--eno-ease);
}

.song-item--playing .index-num {
  opacity: 1;
}

.playing-bars {
  width: 16px;
  height: 16px;
  color: #1ed760;
  filter: drop-shadow(0 0 6px rgb(30 215 96 / 50%));
}

.song-cover {
  width: 44px;
  height: 44px;
  border: 1px solid rgb(255 255 255 / 6%);
  border-radius: var(--eno-radius-md);
  object-fit: cover;
  transition: transform 0.18s var(--eno-ease-pop), box-shadow 0.18s var(--eno-ease);
}

.song-item:hover .song-cover {
  transform: scale(1.05);
  box-shadow: var(--eno-shadow-sm);
}

.song-meta {
  min-width: 0;
}

.song-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--eno-text-1);
  line-height: 1.3;
}

.song-item--playing .song-title {
  color: #1ed760;
}

.song-author {
  display: flex;
  gap: 8px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.4;
}

.author-link:hover {
  text-decoration: underline;
  color: #fff;
}

.song-tag--live {
  color: #e91429;
}

.song-actions {
  display: flex;
  gap: 12px;
  font-size: 16px;
}

.action-icon {
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.16s var(--eno-ease), color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.action-icon:hover {
  color: #fff;
  transform: scale(1.14);
}

.action-icon:active {
  transform: scale(0.9);
}

.song-item--mini .action-icon,
.song-item:focus-within .action-icon {
  opacity: 0.85;
}
</style>
