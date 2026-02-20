<script setup>
import cn from 'classnames'
import { useBlblStore } from '../blbl/store.ts'

const props = defineProps({
  tab: {
    type: Object,
    required: true,
  },
  open: Boolean,
  class: String,
})
const store = useBlblStore()
const { tab } = props

const tabClass = computed(() => {
  const isCurrentMode = store.mode === tab.mode
  const baseClass = 'tab-item flex w-full items-center h-[42px] cursor-pointer rounded-[11px] px-3 duration-150 text-$eno-text-2'
  return `${cn(baseClass, {
    'tab-active': isCurrentMode,
    'hover:bg-$eno-fill-1/65': !isCurrentMode,
  })} ${props.class}`
})

async function openInClient() {
  // 获取 bilibili 的所有 cookie
  const cookies = await chrome.cookies.getAll({ domain: '.bilibili.com' })

  // 将 cookie 转换为字符串格式
  const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

  // 使用自定义协议打开桌面客户端
  const url = `eno-m://cookie?cookie=${encodeURIComponent(cookieString)}`
  window.open(url)
}

function handleClick() {
  if (tab.mode === 'openInClient') {
    openInClient()
    return
  }
  store.mode = tab.mode
}
</script>

<template>
  <div :class="tabClass" @click.stop="handleClick">
    <div :class="tab.icon" class="tab-icon" />
    <span v-if="open && tab.title" class="tab-title">{{ tab.title }}</span>
    <slot />
  </div>
</template>

<style scoped>
.tab-item {
  gap: 0.72rem;
  transition: background-color 0.16s var(--eno-ease), color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.tab-item:active {
  transform: translateY(1px);
}

.tab-icon {
  width: 1.08rem;
  height: 1.08rem;
  font-size: 1.08rem;
  opacity: 0.9;
}

.tab-title {
  font-size: 0.98rem;
  font-weight: 530;
  letter-spacing: -0.01em;
  color: var(--eno-text-2);
  text-wrap: nowrap;
}

.tab-active {
  background: linear-gradient(90deg, rgb(255 255 255 / 6%), rgb(255 255 255 / 2%));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 5%);
}

.tab-active .tab-title,
.tab-active .tab-icon {
  color: var(--eno-text-1);
}
</style>
