declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    background?: string
    repeat?: number // 0 = loop forever, -1 = no loop, positive = number of loops
    transparent?: string | null
    dither?: boolean | string
    debug?: boolean
  }

  interface AddFrameOptions {
    delay?: number // Frame delay in ms
    copy?: boolean
    dispose?: number
  }

  class GIF {
    constructor(options?: GIFOptions)
    addFrame(
      image: CanvasRenderingContext2D | HTMLCanvasElement | HTMLImageElement | ImageData,
      options?: AddFrameOptions
    ): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'start' | 'abort', callback: () => void): void
    render(): void
    abort(): void
    running: boolean
  }

  export = GIF
}
