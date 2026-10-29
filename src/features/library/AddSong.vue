<script setup lang="ts">
import { Dialog, MessageAPI } from '@cloudfly/eno-ui'
import { addToBiliFavorite, createBiliFavoriteFolder, getFavorites, useApiClient } from '~/api'
import { zhError } from '~/shared/zhError'
import { useLibraryStore } from '~/stores'

interface BiliFolder {
  id: number
  fid?: number
  media_id?: number
  title: string
  media_count?: number
  fav_state?: number
}

const PLStore = useLibraryStore()
const api = useApiClient()
const userInfo = inject('userInfo', ref<Record<string, any>>({}))
const biliFolders = ref<BiliFolder[]>([])
const loadingFolders = ref(false)
const submittingId = ref<string | number | null>(null)
const newFolderName = ref('')
const creatingFolder = ref(false)

const mid = computed(() => Number((userInfo.value as any)?.mid) || 0)
const canFavBili = computed(() => {
  const song = PLStore.songToAdd
  if (!song)
    return false
  if (song.aid || song.avid || song.bvid)
    return true
  return String(song.id || '').startsWith('BV')
})

function handleAddSong({ id }: { id: string | number }) {
  PLStore.addSong(id)
  PLStore.addSongDialog = false
}

function biliMediaId(folder: BiliFolder) {
  return folder.id || folder.media_id || folder.fid
}

async function resolveAid() {
  const song = PLStore.songToAdd
  if (!song)
    throw new Error('没有要收藏的歌曲')

  const known = Number(song.aid || song.avid)
  if (Number.isFinite(known) && known > 0)
    return known

  const bvid = String(song.bvid || (String(song.id).startsWith('BV') ? song.id : ''))
  if (!bvid)
    throw new Error('这首没有 B 站稿件，无法收藏')

  const res = await api.blbl.getVideoInfo({ bvid })
  const aid = Number(res?.data?.aid)
  if (!Number.isFinite(aid) || aid <= 0)
    throw new Error('无法解析稿件')
  song.aid = aid
  return aid
}

async function loadBiliFolders() {
  if (!mid.value) {
    biliFolders.value = []
    return
  }
  loadingFolders.value = true
  try {
    let rid: number | undefined
    try {
      rid = await resolveAid()
    }
    catch {
      rid = undefined
    }
    const res: any = await getFavorites({ mid: mid.value, rid })
    biliFolders.value = res?.data?.list || []
  }
  catch {
    biliFolders.value = []
  }
  finally {
    loadingFolders.value = false
  }
}

function biliFavMessage(code: number, fallback = '收藏失败') {
  const map: Record<number, string> = {
    0: '已收藏到 B 站',
    [-101]: '未登录 B 站',
    [-111]: '登录已失效，请重新登录 B 站',
    11201: '已经在这个收藏夹里',
    11203: '收藏夹已满',
    10003: '稿件不存在',
  }
  return map[code] || fallback
}

async function handleAddToBili(folder: BiliFolder) {
  const mediaId = biliMediaId(folder)
  if (!mediaId || submittingId.value != null)
    return
  submittingId.value = mediaId
  try {
    const aid = await resolveAid()
    const res: any = await addToBiliFavorite({ aid, mediaId })
    const code = Number(res?.code)
    if (code === 0 || code === 11201) {
      folder.fav_state = 1
      folder.media_count = (folder.media_count || 0) + (code === 0 ? 1 : 0)
      MessageAPI.show({
        type: code === 0 ? 'success' : 'info',
        message: biliFavMessage(code),
      })
      PLStore.addSongDialog = false
      return
    }
    MessageAPI.show({
      type: 'error',
      message: biliFavMessage(code, res?.message || '收藏失败'),
    })
  }
  catch (error) {
    MessageAPI.show({
      type: 'error',
      message: zhError(error, '收藏失败'),
    })
  }
  finally {
    submittingId.value = null
  }
}

async function handleCreateBiliFolder() {
  const title = newFolderName.value.trim()
  if (!title || creatingFolder.value)
    return
  creatingFolder.value = true
  try {
    const res: any = await createBiliFavoriteFolder(title)
    const code = Number(res?.code)
    const folder = res?.data as BiliFolder | undefined
    const mediaId = folder ? biliMediaId(folder) : 0
    if (code !== 0 || !mediaId) {
      MessageAPI.show({
        type: 'error',
        message: res?.message || '新建收藏夹失败',
      })
      return
    }
    newFolderName.value = ''
    biliFolders.value = [folder, ...biliFolders.value.filter(item => biliMediaId(item) !== mediaId)]
    await handleAddToBili(folder)
  }
  catch (error) {
    MessageAPI.show({
      type: 'error',
      message: zhError(error, '新建收藏夹失败'),
    })
  }
  finally {
    creatingFolder.value = false
  }
}

watch(() => PLStore.addSongDialog, (open) => {
  if (open && canFavBili.value)
    void loadBiliFolders()
  if (!open)
    newFolderName.value = ''
})
</script>

<template>
  <Dialog :open="PLStore.addSongDialog" title="添加到" @visible-change="vis => PLStore.addSongDialog = vis">
    <div class="flex flex-col text-left gap-1">
      <section class="add-row eno-row" @click.stop="PLStore.addSongToListenLater">
        <h2 class="add-row-name">
          <div class="i-tabler:clock-play add-row-icon" />
          稍后播放
        </h2>
      </section>

      <div v-if="PLStore.list.length" class="add-label">
        ENO 歌单
      </div>
      <section
        v-for="playlist in PLStore.list" :key="playlist.name"
        class="add-row eno-row"
        @click.stop="handleAddSong(playlist)"
      >
        <h2 class="add-row-name">
          <div class="i-tabler:folder add-row-icon" />
          <span class="add-row-text" v-html="playlist.name" />
        </h2>
      </section>

      <div class="add-label">
        Bilibili 收藏夹
      </div>
      <div v-if="mid && canFavBili" class="add-create" @click.stop>
        <input
          v-model="newFolderName"
          class="eno-input add-create-input"
          type="text"
          maxlength="20"
          placeholder="新建收藏夹名称"
          @keydown.enter.prevent="handleCreateBiliFolder"
        >
        <button
          type="button"
          class="btn-primary add-create-btn"
          :disabled="creatingFolder || !newFolderName.trim()"
          @click="handleCreateBiliFolder"
        >
          {{ creatingFolder ? '创建中' : '新建并收藏' }}
        </button>
      </div>
      <div v-if="!canFavBili" class="add-hint">
        这首没有 B 站稿件，无法收藏到 B 站
      </div>
      <div v-else-if="!mid" class="add-hint">
        登录 B 站后可以收藏到 B 站歌单
      </div>
      <div v-else-if="loadingFolders" class="add-hint">
        正在读取收藏夹…
      </div>
      <div v-else-if="!biliFolders.length" class="add-hint">
        没有可用的 B 站收藏夹
      </div>
      <template v-else>
        <section
          v-for="folder in biliFolders"
          :key="biliMediaId(folder)"
          class="add-row eno-row"
          :class="{ 'add-row--busy': submittingId === biliMediaId(folder) }"
          @click.stop="handleAddToBili(folder)"
        >
          <h2 class="add-row-name">
            <div class="i-tabler:star add-row-icon" />
            <span class="add-row-text">{{ folder.title }}</span>
          </h2>
          <span class="add-meta">
            {{ folder.fav_state ? '已收藏' : `${folder.media_count || 0} 首` }}
          </span>
        </section>
      </template>
    </div>
  </Dialog>
</template>

<style scoped>
/* 「添加到」目录行：方角内页行 */
.add-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--eno-border);
  cursor: pointer;
}

.add-row-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.add-row-icon {
  flex-shrink: 0;
  color: var(--eno-text-3);
  font-size: 16px;
}

.add-row-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-row--busy {
  opacity: 0.55;
  pointer-events: none;
}

.add-label {
  margin: 14px 12px 6px;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.add-hint {
  padding: 8px 12px;
  color: var(--eno-text-3);
  font-size: 13px;
}

.add-meta {
  flex-shrink: 0;
  color: var(--eno-text-3);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.add-create {
  display: flex;
  gap: 8px;
  padding: 6px 12px 10px;
}

.add-create-input {
  height: 36px;
  min-width: 0;
  flex: 1;
  padding: 0 10px;
}

.add-create-btn {
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .add-row {
    transition: none;
  }
}
</style>
