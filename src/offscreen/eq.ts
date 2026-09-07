import { Howler } from 'howler'

const FREQUENCIES = [60, 170, 350, 1000, 3500, 10000]

export class OffscreenEq {
  private filters: BiquadFilterNode[] = []
  private initialized = false

  ensure() {
    if (this.initialized || !Howler.ctx || !Howler.masterGain)
      return this.initialized

    const ctx = Howler.ctx
    this.filters = FREQUENCIES.map((freq) => {
      const filter = ctx.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = freq
      filter.Q.value = 1
      filter.gain.value = 0
      return filter
    })

    this.filters.reduce((prev, curr) => {
      prev.connect(curr)
      return curr
    })

    Howler.masterGain.disconnect()
    Howler.masterGain.connect(this.filters[0])
    this.filters[this.filters.length - 1].connect(ctx.destination)
    this.initialized = true
    return true
  }

  update(values: number[] = []) {
    if (!this.ensure())
      return
    this.filters.forEach((filter, index) => {
      if (typeof values[index] === 'number')
        filter.gain.value = values[index]
    })
  }
}
