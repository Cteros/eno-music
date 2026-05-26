<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { Dialog } from '@cloudfly/eno-ui'
import SongItem from '~/options/components/SongItem.vue'
import { usePlaylistStore } from '~/options/playlist/store'
import { getSeasonInfo } from '~/options/api/index'

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const PLStore = usePlaylistStore()

function getSid(url) {
// https://space.bilibili.com/3493093607213343/channel/collectiondetail?sid=1657149
  return url.match(/sid=(\d+)/)[1]
}

const season = reactive({
  open: false,
  url: '',
  mediaInfo: {},
  mediaSong: [],
})

async function handleSearchSeason() {
  if (!season.url)
    return
  const season_id = getSid(season.url)
  const res = await getSeasonInfo({ season_id, page_size: 100 })
  const { meta, archives } = res.data

  season.mediaInfo = {
    title: meta.name,
  }
  season.mediaSong = archives.map((element) => {
    return {
      title: element.title,
      description: element.desc,
      eno_song_type: 'bvid',
      cover: element.pic,
      duration: element.duration,
      id: element.bvid || element.bv_id,
      bvid: element.bvid || element.bv_id,
    }
  })
}

watch(() => season.open, () => {
  if (!season.open) {
    season.url = ''
    // reset
    season.mediaSong = []
    season.mediaInfo = {}
  }
})

function addNewSeasonPlayList() {
  if (!season.mediaSong.length)
    return
  PLStore.createPlaylist(season.mediaInfo.title, cloneDeep(season.mediaSong))
  season.open = false
}
</script>

<template>
  <div>
    <button
      :class="props.compact ? 'media-action-btn' : 'media-action-btn media-action-btn-lg'"
      @click.stop="season.open = true"
    >
      <div class="i-tabler:download w-1em h-1em" />
      导入合集
    </button>
    <Dialog :open="season.open" title="解析合集列表" @visible-change="v => season.open = v">
      <div class="flex flex-col gap-3">
        <div class="flex gap-3">
          <input
            v-model="season.url" type="text" bg="$eno-fill-dark-1 focus:$eno-content-hover"
            class="w-full px-4 py-2 rounded-4" focus:outline-none focus:shadow-outline placeholder="合集链接"
            @keyup.enter="handleSearchSeason"
          >
          <button class="btn-primary w-20" @click="handleSearchSeason">
            解析
          </button>
        </div>
        <!-- 歌曲列表 -->
        <div class="flex-1 overflow-auto">
          <SongItem
            v-for="song in season.mediaSong" :key="song.id" :song="song" del size="mini" :later="false" :star="false"
            @delete-song="season.mediaSong = season.mediaSong.filter(s => s.id !== song.id)"
          />
        </div>
      </div>
      <template #footer>
        <button class="w-full btn-primary" @click="addNewSeasonPlayList">
          添加为歌单
        </button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.media-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 2.35rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 12%);
  border-radius: 11px;
  padding: 0 0.86rem;
  font-size: 0.88rem;
  font-weight: 620;
  color: var(--eno-text-1);
  background: linear-gradient(180deg, rgb(255 255 255 / 8%), rgb(255 255 255 / 2%));
  cursor: pointer;
  transition: border-color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.media-action-btn:hover {
  border-color: color-mix(in oklab, var(--eno-border), white 24%);
  background: linear-gradient(180deg, rgb(255 255 255 / 11%), rgb(255 255 255 / 3%));
}

.media-action-btn:active {
  transform: translateY(1px);
}

.media-action-btn-lg {
  height: 2.55rem;
  padding: 0 1rem;
  font-size: 0.95rem;
}
</style>
