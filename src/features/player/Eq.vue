<script setup lang="ts">
import { MessageAPI } from '@cloudfly/eno-ui'
import { ref, watch } from 'vue'
import { useEqStore } from '~/stores'

const eqStore = useEqStore()

const frequencies = ['60Hz', '170Hz', '350Hz', '1kHz', '3.5kHz', '10kHz']

const customPresets = ref(eqStore.customPresets)
const newPresetName = ref('')

function savePreset() {
  if (!newPresetName.value) {
    return MessageAPI.show({
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
    <div class="eq-toolbar">
      <select v-model="eqStore.currentPreset" class="eno-input eq-select">
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
      <div class="eq-save">
        <input
          v-model="newPresetName"
          placeholder="预设名称"
          class="eno-input eq-name"
        >
        <button
          type="button"
          class="eq-btn"
          @click="savePreset"
        >
          保存预设
        </button>
      </div>
    </div>

    <!-- EQ 滑块 -->
    <div class="eq-sliders">
      <div v-for="(freq, index) in frequencies" :key="freq" class="eq-cell">
        <div class="eq-slot">
          <input
            v-model.number="eqStore.values[index]"
            type="range"
            min="-12"
            max="12"
            step="1"
            class="eq-range"
            :aria-label="freq"
          >
        </div>
        <div class="eq-freq">
          {{ freq }}
        </div>
        <div class="eq-value">
          {{ eqStore.values[index] }}dB
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="eq-foot">
      <button
        type="button"
        class="eq-btn"
        @click="reset"
      >
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
/* —— 均衡器：铅字仪表盘，细栏线 + 朱红滑钮 —— */
.eq-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.eq-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.eq-select {
  height: 34px;
  min-width: 132px;
  padding: 0 10px;
  color: var(--eno-text-1);
  font-family: var(--app-font-sans);
  font-size: 13px;
  cursor: pointer;
}

.eq-save {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eq-name {
  width: 150px;
  height: 34px;
  padding: 0 10px;
  color: var(--eno-text-1);
  font-family: var(--app-font-sans);
  font-size: 13px;
}

.eq-btn {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-1);
  color: var(--eno-text-2);
  font-family: var(--app-font-sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), color 0.16s var(--eno-ease), transform 0.12s var(--eno-ease);
}

.eq-btn:hover {
  background: var(--eno-fill-2);
  color: var(--eno-text-1);
}

.eq-btn:active {
  transform: translateY(1px);
}

.eq-foot {
  display: flex;
  justify-content: center;
}

/* 滑块面板：细栏线 + 中线刻度 */
.eq-sliders {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 20px 16px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-lg);
  background: var(--eno-fill-1);
  box-shadow: none;
}

/* 中线：与 160px 滑轨的中点对齐（20px 上留白 + 半个滑轨） */
.eq-sliders::before {
  content: '';
  position: absolute;
  right: 16px;
  left: 16px;
  top: 100px;
  height: 1px;
  background: var(--eno-border);
  pointer-events: none;
}

.eq-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: var(--eno-radius-md);
  transition: background-color 0.18s var(--eno-ease);
}

.eq-cell:hover {
  background: var(--eno-fill-2);
}

.eq-cell:hover .eq-freq,
.eq-cell:hover .eq-value {
  color: var(--eno-text-1);
}

.eq-slot {
  display: flex;
  width: 100%;
  height: 160px;
  align-items: center;
  justify-content: center;
}

.eq-freq {
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  transition: color 0.18s var(--eno-ease);
}

.eq-value {
  color: var(--eno-text-2);
  font-family: var(--app-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  transition: color 0.18s var(--eno-ease);
}

/* 垂直滑块 */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  background: transparent;
  transform: rotate(90deg);
  cursor: pointer;
}

input[type='range']::-webkit-slider-runnable-track {
  height: 3px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-3);
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5.5px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
  transition: transform 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  background: var(--lp-seal-bright);
}

input[type='range']::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

input[type='range']::-moz-range-track {
  height: 3px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-3);
}

input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
}

@media (prefers-reduced-motion: reduce) {
  .eq-cell,
  .eq-btn,
  .eq-freq,
  .eq-value,
  input[type='range']::-webkit-slider-thumb {
    transition: none;
    transform: none;
  }

  input[type='range'] {
    transform: rotate(90deg);
  }
}
</style>
