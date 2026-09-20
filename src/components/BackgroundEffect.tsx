import { useEffect, useRef } from 'react'
import { FX, isCanvasEffect, type FxInstance } from '../lib/effectRenderers'
import { INTENSITY_SCALE, resolveEffect, resolveIntensity } from '../lib/theme'

/* ==========================================================================
   Ambient background effects

   The drawing lives in lib/effectRenderers.ts; this component owns the canvas
   lifecycle and the rules that apply to every effect:

   - prefers-reduced-motion turns it off entirely. Drifting particles are
     exactly the kind of thing that triggers vestibular discomfort.
   - Animation stops when the tab is hidden, so a backgrounded portfolio
     isn't quietly burning someone's battery.
   - Device pixel ratio is capped at 2; past that the cost buys no visible
     sharpness on soft particles.
   - Colours are read from the live CSS custom properties, so effects follow
     the accent and theme rather than being hardcoded.
   ========================================================================== */

function readVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value || fallback
}

type Props = {
  effect?: string
  intensity?: string
  /** Included so colours are re-read when the light/dark toggle flips. */
  theme?: 'dark' | 'light'
}

export default function BackgroundEffect({ effect, intensity, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mode = resolveEffect(effect)
  const level = resolveIntensity(intensity)

  useEffect(() => {
    if (!isCanvasEffect(mode)) return
    // Captured so the narrowing survives into the nested build() closure.
    const canvasMode = mode

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const { density, opacity } = INTENSITY_SCALE[level]
    const colors = {
      ink: readVar('--ink', '#f2f2f4'),
      accent: readVar('--accent', '#e9a94b'),
    }

    let instance: FxInstance | null = null
    let frame = 0
    let running = true
    let last = performance.now()

    function build() {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const width = window.innerWidth
      const height = window.innerHeight
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Renderers seed against a fixed size, so a resize rebuilds them.
      instance = FX[canvasMode]({
        ctx: ctx!,
        width,
        height,
        opacity,
        density,
        colors,
      })
    }

    function draw(now: number) {
      if (!running) return
      // Clamp dt so a backgrounded tab doesn't teleport everything on its
      // first frame back.
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      instance?.draw(dt)
      frame = requestAnimationFrame(draw)
    }

    function onVisibility() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        last = performance.now()
        frame = requestAnimationFrame(draw)
      }
    }

    let resizeTimer = 0
    function onResize() {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(build, 150)
    }

    build()
    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [mode, level, theme])

  if (mode === 'none') return null

  // Aurora is a soft colour wash rather than particles, so it is cheaper and
  // smoother as animated CSS gradients than as canvas paint.
  if (mode === 'aurora') {
    return (
      <div className="fx fx--aurora" data-intensity={level} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fx fx--canvas fx--${mode}`}
      aria-hidden="true"
    />
  )
}
