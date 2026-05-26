<script setup>
import { computed, defineProps } from 'vue'
import cn from 'classnames'
import { MessageAPI } from '@cloudfly/eno-ui'
import { useBlblStore } from '../blbl/store.ts'
import { usePlaylistStore } from '../playlist/store.ts'
import { useApiClient } from '~/composables/api'

const props = defineProps({
  song: {
    type: Object,
    default: null,
  },
  size: {
    // default, mini
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
})

const emit = defineEmits(['deleteSong'])

const api = useApiClient()

const store = useBlblStore()
const PLstore = usePlaylistStore()

const { later, del, star, checkPages } = props
const { cover, title, author, pages, mid } = props.song

const isPlaying = computed(() => {
  if (!props.showActive)
    return false
  const current = store.play
  // 兼容原本的错别字
  const type = current.eno_song_type || current.enu_song_type

  if (type && current[type] === props?.song[type]) {
    return true
  }
  return false
})

const styleBySize = computed(() => {
  if (props.size === 'mini') {
    return {
      wrapper: `grid-cols-[5.5rem_1fr_90px]`,
      title: 'text-[12px] font-600 w-full truncate leading-4',
      img: 'h-10 rounded-2 object-cover',
    }
  }
  else {
    return {
      wrapper: `grid-cols-[5.5rem_1fr_90px]`,
      title: 'text-[14px] font-600 truncate leading-5',
      img: 'h-10 rounded-2 object-cover',
    }
  }
})

async function handleClick() {
  if (!checkPages) {
    store.startPlay(props.song)
    return
  }
  // 计算分P数据
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
  store.mode = 'singerDetail'
  PLstore.currentSinger = singerMid
}
</script>

<template>
  <div :class="cn('song-item text-lg h-13 hov-item pr-4', styleBySize.wrapper)" @click="handleClick">
    <img :src="cover" :class="styleBySize.img">
    <div class="w-full overflow-auto" :title="title">
      <div class="h-13 pt-1">
        <div :class="styleBySize.title" v-html="title" />
        <div :class="styleBySize.author" class="flex gap-2">
          <span v-if="pages">是合集</span>
          <span v-if="isPlaying">
            <div class="i-svg-spinners:bars-scale w-1em h-1em text-$eno-primary" />
          </span>
          <!-- {{ JSON.stringify(song) }} -->
          <span class="text-xs opacity-60 hover:opacity-100 hover:border-b border-$eno-border" @click.stop="handleSingerDetail(mid)">
            {{ author }}
          </span>
        </div>
      </div>
    </div>
    <!-- 操作, 收藏到播放列表, 删除 -->
    <div class="flex gap-2 text-base justify-end">
      <div v-if="later" hover:opacity-70 class="i-mingcute:time-fill w-1em h-1em" @click.stop="addToLater" />
      <div v-if="star" hover:opacity-70 class="i-mingcute:star-fill w-1em h-1em" @click.stop="PLstore.startAddSong(props.song)" />
      <div v-if="del" hover:opacity-70 class="i-mingcute:delete-3-fill w-1em h-1em" @click.stop="emit('deleteSong', props.song)" />
    </div>
  </div>
</template>

<style scoped>
.song-item {
  display: grid;
  /* 左右固定, 中间展开 */
  /* grid-template-columns: 100px 1fr 60px; */
  overflow: hidden;
  /* 子元素上下居中 */
  align-items: center;
  flex-shrink: 0;
  transition: all 0.3s;
}
</style>
