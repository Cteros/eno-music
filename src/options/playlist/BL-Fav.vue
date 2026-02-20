<script lang="ts" setup>
import type { song } from '~/options/playlist/store'
import { useApiClient } from '~/composables/api'
import SongItem from '~/options/components/SongItem.vue'
import { usePlaylistStore } from '~/options/playlist/store'
import Message from '~/components/message'

import { useBlblStore } from '~/options/blbl/store'

const props = defineProps<{
  fav: fav
  tag?: 'collected'
}>()

const store = useBlblStore()
const PLStore = usePlaylistStore()
const api = useApiClient()
const pn = ref(1)
const mediaSong = ref<song[]>([])
const status = reactive({
  loading: false,
  error: false,
  open: false,
  loaded: false,
})

interface fav {
  attr?: number
  fav_state?: number
  fid?: number
  id?: number
  media_id?: number
  mid?: number
  title?: string
  name?: string
  intro?: string
  media_count?: number
  season_id?: number
  series_id?: number
  type?: string | number
}
const mediaId = computed(() => props.fav.id || props.fav.media_id || props.fav.fid)
const isCollected = computed(() => props.tag === 'collected')
const collectionId = computed(() => props.fav.series_id || props.fav.season_id || mediaId.value)
const collectionType = computed<'collection' | 'series'>(() => {
  if (props.fav.series_id)
    return 'series'
  const rawType = String(props.fav.type || '').toLowerCase()
  if (rawType.includes('series') || rawType === '2')
    return 'series'
  return 'collection'
})

async function handleClick() {
  if (status.loading)
    return

  if (status.open) {
    status.open = false
    return
  }

  if (status.loaded && mediaSong.value.length > 0) {
    status.open = !status.open
    return
  }

  status.loading = true
  status.error = false
  status.open = true
  mediaSong.value = []
  pn.value = 1
  try {
    if (isCollected.value)
      await getCollectedDataLoop()
    else
      await getFavDataLoop()
    status.loaded = true
  }
  finally {
    status.loading = false
  }
}

async function getFavDataLoop() {
  try {
    const res = await api.blbl.getFavInfo({
      media_id: mediaId.value,
      pn: pn.value,
    })
    const { info, medias } = res.data || {}

    if (!Array.isArray(medias)) {
      status.error = true
      return
    }

    medias.forEach((element) => {
      mediaSong.value.push({
        title: element.title,
        description: element.intro || element.desc || '',
        eno_song_type: 'bvid',
        cover: (element.cover || '').replace(/^http:\/\//, 'https://'),
        author: element.upper?.name || element.owner?.name || '未知',
        duration: element.duration || 0,
        id: element.bvid || element.bv_id || element.id,
        bvid: element.bvid || element.bv_id,
        mid: element.upper?.mid || element.upper?.id,
        pages: element.pages,
      })
    })

    if (mediaSong.value.length < (info?.media_count || 0)) {
      pn.value++
      await getFavDataLoop()
    }
  }
  catch (e) {
    status.error = true
    Message.show({
      type: 'error',
      message: '加载收藏夹失败',
      error: e,
    })
    return
  }
}
function handleReplacePlaylist() {
  if (!mediaSong.value.length)
    return
  store.play = mediaSong.value[0]
  store.playList = mediaSong.value
}
function handleSavePlaylist() {
  if (!mediaSong.value.length)
    return
  PLStore.createPlaylist(props.fav.title || props.fav.name || 'BLBL 收藏', JSON.parse(JSON.stringify(mediaSong.value)))
  Message.show({
    type: 'info',
    message: '已保存为 ENO 歌单',
  })
}

async function getCollectedDataLoop() {
  if (!props.fav.mid || !collectionId.value) {
    status.error = true
    return
  }

  let pageNum = 1
  const pageSize = collectionType.value === 'series' ? 20 : 30
  let total = Number.POSITIVE_INFINITY

  while (mediaSong.value.length < total) {
    let res: any

    if (collectionType.value === 'series') {
      res = await api.blbl.getSeriesInfo({
        mid: props.fav.mid,
        series_id: collectionId.value,
        pn: pageNum,
        ps: pageSize,
        sort: 'desc',
      })
    }
    else {
      res = await api.blbl.getCollectionInfo({
        mid: props.fav.mid,
        season_id: collectionId.value,
        page_num: pageNum,
        page_size: pageSize,
      })
    }

    const data = res?.data || {}
    const archives = Array.isArray(data.archives) ? data.archives : []
    const page = data.page || {}
    total = page.total || mediaSong.value.length + archives.length

    archives.forEach((element: any) => {
      mediaSong.value.push({
        title: element.title,
        description: element.intro || element.desc || '',
        eno_song_type: 'bvid',
        cover: (element.pic || element.cover || '').replace(/^http:\/\//, 'https://'),
        author: element.upper?.name || element.owner?.name || '未知',
        duration: element.duration || 0,
        id: element.bvid || element.bv_id || element.id,
        bvid: element.bvid || element.bv_id,
        mid: element.upper?.mid || element.mid || props.fav.mid,
      })
    })

    if (!archives.length || archives.length < pageSize || mediaSong.value.length >= total)
      break

    pageNum++
  }
}
</script>

<template>
  <div
    class="mb-5 has-border"
    rounded-lg
    transition-200
    bg="$eno-content hover:$eno-content-hover"
  >
    <div
      class="w-full flex justify-between"
      p="x-4 y-3"
      @click="handleClick"
    >
      <div class="flex items-center gap-3 text-[22px]">
        <div :class="`w-1em h-1em ${status.open ? 'i-mingcute:folder-open-2-fill' : 'i-mingcute:folder-fill'}`" />
        <h2 class="max-w-[50vw] truncate" text-lg v-html="props.fav.title || props.fav.name || '未命名收藏夹'" />
      </div>
      <div class="flex gap-3" all:transition-200>
        <div
          class="i-mingcute:star-fill" text-xl cursor-pointer
          color="gray hover:gray-50"
          @click.stop="handleSavePlaylist"
        />
        <div
          class="i-mingcute:play-circle-line" text-xl cursor-pointer
          color="gray hover:gray-50"
          @click.stop="handleReplacePlaylist"
        />
      </div>
    </div>
    <div v-if="status.loading" class="px-4 pb-3 text-sm text-$eno-text-3">
      加载中...
    </div>
    <div v-if="status.error" class="px-4 pb-3 text-sm text-red-400">
      加载失败，请稍后重试
    </div>
    <div v-if="status.loaded && !mediaSong.length && status.open" class="px-4 pb-3 text-sm text-$eno-text-3">
      暂无可用内容
    </div>
    <div v-if="mediaSong.length > 0 && status.open" class="flex flex-col gap-2 max-h-[500px] overflow-auto" p="x-4 y-3">
      <SongItem v-for="song in mediaSong" :key="song.id" :song="song" />
    </div>
  </div>
</template>
