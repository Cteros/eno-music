<script setup>
import { computed, ref, watch } from 'vue'
import { useEqStore } from './store'
import Message from '~/components/message'

const eqStore = useEqStore()

const frequencies = ['60Hz', '170Hz', '350Hz', '1kHz', '3.5kHz', '10kHz']

const customPresets = ref(eqStore.customPresets)
const newPresetName = ref('')

function savePreset() {
  if (!newPresetName.value) {
    return Message.show({
      message: '请输入预设名称',
      type: 'error',
    })
  }
  eqStore.saveCustomPreset(newPresetName.value)
  newPresetName.value = ''
}

function reset() {
  eqStore.values = [0, 0, 0, 0, 0, 0]
}
// 切换eq设置的时候修改values
watch(() => eqStore.currentPreset, () => {
  const { presets, customPresets } = eqStore
  const origin = presets[eqStore.currentPreset] || customPresets[eqStore.currentPreset]
  eqStore.values = [...origin]
})
</script>

<template>
  <div class="eq-container">
    <!-- 预设选择 -->
    <div class="mb-4 flex gap-3">
      <select v-model="eqStore.currentPreset" class="bg-$eno-fill-4 p-2 rounded-2 pr-3">
        <option value="flat">
          平衡
        </option>
        <option value="pop">
          流行
        </option>
        <option value="rock">
          摇滚
        </option>
        <option value="jazz">
          爵士
        </option>
        <option value="classical">
          古典
        </option>
        <optgroup v-if="Object.keys(customPresets).length" label="自定义预设">
          <option v-for="(_, name) in customPresets" :key="name" :value="name">
            {{ name }}
          </option>
        </optgroup>
      </select>

      <!-- 保存预设 -->
      <div class="flex gap-2 mt-2">
        <input
          v-model="newPresetName"
          placeholder="预设名称"
          class="bg-$eno-fill-4 p-2 rounded-2"
        >
        <button
          class="bg-$eno-fill-4 p-2 rounded-2 hover:bg-$eno-fill-2"
          @click="savePreset"
        >
          保存预设
        </button>
      </div>
    </div>

    <!-- EQ 滑块 -->
    <div class="eq-sliders grid grid-cols-6 gap-4">
      <div v-for="(freq, index) in frequencies" :key="freq" class="flex flex-col items-center">
        <div class="w-40 h-40 flex items-center justify-center">
          <input
            v-model.number="eqStore.values[index]"
            type="range"
            min="-12"
            max="12"
            step="1"
            class=""
          >
        </div>
        <div class="text-sm mt-2">
          {{ freq }}
        </div>
        <div class="text-sm">
          {{ eqStore.values[index] }}dB
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="mt-4 flex justify-center">
      <button
        class="bg-$eno-fill-4 p-2 rounded-2 hover:bg-$eno-fill-2"
        @click="reset"
      >
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
.eq-container {
  padding: 24px;
  background: var(--eno-content);
  border-radius: var(--eno-radius-lg);
  border: 1px solid var(--eno-border);
  box-shadow: var(--eno-shadow-sm);
}

/* 滑块容器 */
.eq-sliders {
  background: var(--eno-fill-4);
  padding: 24px;
  border-radius: var(--eno-radius-md);
  border: 1px solid var(--eno-border);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 垂直滑块基础样式 */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
  transform: rotate(90deg);
  cursor: pointer;
}

/* 滑块轨道 */
input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--eno-fill-2);
  border-radius: 2px;
  border: none;
}

/* 滑块手柄 */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  background: var(--eno-primary);
  border-radius: 50%;
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 滑块手柄悬停效果 */
input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 滑块手柄激活效果 */
input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

/* 频率和数值标签 */
.text-sm {
  color: var(--eno-text-2);
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

/* 中心线指示 */
.eq-sliders {
  position: relative;
}

.eq-sliders::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--eno-fill-2);
  opacity: 0.3;
  pointer-events: none;
}

/* 滑块容器样式 */
.flex.flex-col.items-center {
  position: relative;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.flex.flex-col.items-center:hover {
  background: var(--eno-fill-3);
}

.flex.flex-col.items-center:hover .text-sm {
  color: var(--eno-text-1);
}

/* 选择框和输入框通用样式 */
select,
input[type="text"] {
  border: 1px solid var(--eno-fill-2);
  outline: none;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-width: 120px;
}

select:hover,
input[type="text"]:hover {
  border-color: var(--eno-fill-1);
}

select:focus,
input[type="text"]:focus {
  border-color: var(--eno-primary);
  box-shadow: 0 0 0 2px var(--eno-primary-light);
}

/* 按钮样式 */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 80px;
  border: 1px solid var(--eno-fill-2);
}

button:hover {
  transform: translateY(-1px);
  box-shadow: var(--eno-shadow-sm);
  background: var(--eno-fill-2) !important;
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
