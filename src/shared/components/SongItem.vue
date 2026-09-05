<script setup lang="ts">
import { computed } from 'vue'
import cn from 'classnames'
import { MessageAPI } from '@cloudfly/eno-ui'
import { useLibraryStore, usePlayerStore, useSingerStore, useUiStore } from '~/stores'
import { useApiClient } from '~/api'

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
const { cover, title, author, pages, mid } = props.song

const isPlaying = computed(() => {
  if (!props.showActive)
    return false
  const current = store.play
  const type = current.eno_song_type || current.enu_song_type

  if (type && current[type] === props?.song[type])
    return true
  return false
})

const isMini = computed(() => props.size === 'mini')

async function handleClick() {
  if (!checkPages) {
    store.startPlay(props.song)
    return
  }
  const item = await api.blbl.getVideoInfo({
    bvid: props.song.bvid,
  }).then(res => res.data)

  if (item.pages.length > 1 && props.song) {
    PLstore.openCollection = true
    PLstore.collectionInfo = {
      ...props.song,
      pages: item.pages,
    }
  }
  else {
    store.startPlay(props.song)
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
  ui.mode = 'singerDetail'
  singerStore.currentSinger = singerMid
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
        <span v-if="pages" class="song-tag">合集</span>
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
  grid-template-columns: 16px 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  border-radius: 4px;
  color: #b3b3b3;
  cursor: pointer;
}

.song-item--mini {
  height: 48px;
  grid-template-columns: 0 40px minmax(0, 1fr) auto;
  padding: 0 8px;
}

.song-item:hover {
  background: rgb(255 255 255 / 10%);
  color: #fff;
}

.song-item:hover .action-icon,
.song-item:hover .index-num {
  opacity: 1;
}

.song-index {
  display: flex;
  width: 16px;
  justify-content: center;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.index-num {
  opacity: 0.9;
}

.playing-bars {
  width: 14px;
  height: 14px;
  color: #1ed760;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.song-meta {
  min-width: 0;
}

.song-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  color: #fff;
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

.song-tag {
  color: #1ed760;
}

.song-actions {
  display: flex;
  gap: 12px;
  font-size: 16px;
}

.action-icon {
  opacity: 0;
  cursor: pointer;
}

.action-icon:hover {
  color: #fff;
}

.song-item--mini .action-icon,
.song-item:focus-within .action-icon {
  opacity: 0.85;
}
</style>
