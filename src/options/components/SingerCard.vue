<script setup>
import cn from 'classnames'
import { usePlaylistStore } from '../playlist/store'
import { useBlblStore } from '../blbl/store'

const props = defineProps({
  singerMid: String,
  canDel: {
    type: Boolean,
    default: false,
  },
  shape: {
    type: String,
    default: 'circle',
  },
  border: {
    type: Boolean,
    default: true,
  },
})
const store = useBlblStore()
const PLstore = usePlaylistStore()
const info = computed(() => PLstore.singerCardCache[props.singerMid])
const avatar = computed(() => info.value?.face || '')
const name = computed(() => info.value?.name || '')
const desc = computed(() => {
  const { name } = info.value?.nameplate || {}
  return `${name || '暂无'}`
})

function handleSingerDetail(singerMid) {
  store.mode = 'singerDetail'
  PLstore.currentSinger = singerMid
}
</script>

<template>
  <div
    :class="cn('flex flex-col flex-shrink-0 relative singerCard', {
      'items-center': shape === 'circle',
      'items-start': shape === 'square',
    })"
    @click.stop="handleSingerDetail(singerMid)"
  >
    <img
      :src="avatar" alt="singerAvatar"
      :class="cn('w-40 h-40 rounded-full border-gray-200 cursor-pointer', {
        'rounded-full': shape === 'circle',
        'rounded-md': shape === 'square',
        'border-2': border,
      })"
    >
    <div class="text-[16px] mt-2">
      {{ name }}
    </div>
    <div class="opacity-50 text-[12px]">
      {{ desc }}
    </div>
    <!-- 删除 -->
    <div
      v-if="props.canDel"
      class="del absolute right-0 top-0 bg-$eno-primary text-black text-2xl rounded-full p-1 fadeItem"
      @click.stop="PLstore.removeSinger(singerMid)"
    >
      <div class="i-mingcute:close-line w-1em h-1em" />
    </div>
  </div>
</template>

<style scoped>
.singerCard{
  & > .del{
    display: none;

  }
  &:hover > .del{
    display: block;
  }
}
</style>
