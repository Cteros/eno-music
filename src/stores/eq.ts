import { defineStore } from 'pinia'
import { Howler } from 'howler'

type PresetName = 'flat' | 'pop' | 'rock' | 'jazz' | 'classical' | string

interface Presets {
  flat: number[]
  pop: number[]
  rock: number[]
  jazz: number[]
  classical: number[]
}

interface CustomPresets {
  [key: string]: number[]
}

interface EqState {
  presets: Presets
  currentPreset: PresetName
  values: number[]
  customPresets: CustomPresets
}

export const useEqStore = defineStore('eq', {
  state: (): EqState => ({
    presets: {
      flat: [0, 0, 0, 0, 0, 0],
      pop: [4, 2, 0, -2, 2, 4],
      rock: [4, 2, -2, -2, 2, 4],
      jazz: [3, 2, -1, -2, 1, 3],
      classical: [3, 2, 0, -1, 2, 4],
    },
    currentPreset: 'flat',
    values: [0, 0, 0, 0, 0, 0],
    customPresets: {},
  }),

  actions: {
    setPreset(name: PresetName): void {
      this.currentPreset = name
      if (this.presets[name as keyof Presets]) {
        this.values = [...this.presets[name as keyof Presets]]
      }
      else if (this.customPresets[name]) {
        this.values = [...this.customPresets[name]]
      }
    },

    updateValue(index: number, value: number): void {
      this.values[index] = value
      this.currentPreset = 'custom'
    },

    saveCustomPreset(name: string): void {
      this.customPresets[name] = [...this.values]
      this.currentPreset = name
    },

    deleteCustomPreset(name: string): void {
      delete this.customPresets[name]
      if (this.currentPreset === name)
        this.setPreset('flat')
    },

    reset(): void {
      this.setPreset('flat')
    },
  },
})

export class EQService {
  private ctx: AudioContext | null = null
  private filters: BiquadFilterNode[] = []
  private initialized = false

  constructor() {
    this.initializeWhenReady()
  }

  private initializeWhenReady(): void {
    if (!Howler.ctx) {
      setTimeout(() => this.initializeWhenReady(), 100)
      return
    }

    if (this.initialized)
      return

    this.ctx = Howler.ctx
    const ctx = this.ctx
    if (!ctx)
      return

    const frequencies = [60, 170, 350, 1000, 3500, 10000]

    frequencies.forEach((freq) => {
      const filter = ctx.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = freq
      filter.Q.value = 1
      filter.gain.value = 0
      this.filters.push(filter)
    })

    this.filters.reduce((prev, curr) => {
      prev.connect(curr)
      return curr
    })

    Howler.masterGain.disconnect()
    Howler.masterGain.connect(this.filters[0])
    this.filters[this.filters.length - 1].connect(ctx.destination)

    this.initialized = true
  }

  updateFilters(values: number[]): void {
    if (!this.initialized)
      return
    this.filters.forEach((filter, index) => {
      filter.gain.value = values[index]
    })
  }
}
