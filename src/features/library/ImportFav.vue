<script setup lang="ts">
import { Dialog } from '@cloudfly/eno-ui'
import { cloneDeep } from 'lodash'
import { getSeasonInfo } from '~/api'
import SongItem from '~/shared/components/SongItem.vue'
import { useLibraryStore } from '~/stores'

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const PLStore = useLibraryStore()

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
      :class="props.compact ? 'btn' : 'btn import-btn--lg'"
      @click.stop="season.open = true"
    >
      <div class="i-tabler:download" />
      导入合集
    </button>
    <Dialog :open="season.open" title="解析合集列表" @visible-change="v => season.open = v">
      <div class="flex flex-col gap-3">
        <div class="flex gap-3">
          <input
            v-model="season.url" type="text"
            class="eno-input import-input"
            placeholder="合集链接"
            @keyup.enter="handleSearchSeason"
          >
          <button class="btn import-parse" @click="handleSearchSeason">
            解析
          </button>
        </div>
        <!-- 歌曲列表 -->
        <div class="flex-1 overflow-auto import-list">
          <SongItem
            v-for="song in season.mediaSong" :key="song.id" :song="song" del size="mini" :later="false" :star="false"
            @delete-song="season.mediaSong = season.mediaSong.filter(s => s.id !== song.id)"
          />
          <div v-if="!season.mediaSong.length && !season.url" class="import-hint">
            粘贴合集链接，点「解析」读取
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-primary import-submit" @click="addNewSeasonPlayList">
          添加为歌单
        </button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.import-btn--lg {
  height: 40px;
  padding: 0 20px;
}

.import-input {
  height: 36px;
  min-width: 0;
  flex: 1;
  padding: 0 12px;
}

.import-parse {
  flex-shrink: 0;
}

.import-submit {
  width: 100%;
}

.import-hint {
  padding: 8px 12px;
  color: var(--eno-text-3);
  font-size: 13px;
}

.import-list :deep(.song-item) {
  border-bottom: 1px solid var(--eno-border);
}
</style>
