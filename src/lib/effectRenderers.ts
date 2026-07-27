/* ==========================================================================
   Canvas effect renderers

   Each effect is a factory that seeds its own state and exposes draw(dt).
   Holding state per effect rather than sharing one particle array is what
   lets fireworks manage bursts and matrix manage columns without the others
   carrying fields they never use.

   Every renderer must:
   - scale its particle count with viewport area, and respect the cap
   - treat `dt` as seconds, so speed is frame-rate independent
   - leave ctx.globalAlpha at 1 when it returns
   ========================================================================== */

export type FxColors = { ink: string; accent: string }

export type FxContext = {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  /** 0-1, from the chosen intensity. */
  opacity: number
  /** Multiplier on particle count, from the chosen intensity. */
  density: number
  colors: FxColors
}

export type FxInstance = { draw(dt: number): void }
export type FxFactory = (c: FxContext) => FxInstance

export type CanvasEffect =
  | 'snow'
  | 'stars'
  | 'constellation'
  | 'confetti'
  | 'hearts'
  | 'bats'
  | 'fireworks'
  | 'leaves'
  | 'petals'
  | 'fireflies'
  | 'matrix'

const rand = Math.random
const TAU = Math.PI * 2

/** Particle count from viewport area, scaled by density and hard-capped. */
function count(c: FxContext, perMillionPx: number, cap: number): number {
  return Math.max(
    1,
    Math.min(
      cap,
      Math.round(((c.width * c.height) / 1_000_000) * perMillionPx * c.density),
    ),
  )
}

/* -- Shape helpers --------------------------------------------------------- */

function heartPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.3)
  ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.35)
  ctx.bezierCurveTo(x - s, y + s * 0.8, x, y + s * 1.1, x, y + s * 1.45)
  ctx.bezierCurveTo(x, y + s * 1.1, x + s, y + s * 0.8, x + s, y + s * 0.35)
  ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3)
  ctx.closePath()
}

/** A bat silhouette, drawn around its centre. `flap` is 0-1. */
function batPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  flap: number,
) {
  const lift = s * 0.55 * flap
  ctx.beginPath()
  ctx.moveTo(x, y)
  // Left wing
  ctx.quadraticCurveTo(x - s * 0.5, y - lift - s * 0.3, x - s, y - lift * 0.2)
  ctx.quadraticCurveTo(x - s * 0.7, y + s * 0.25, x - s * 0.45, y + s * 0.1)
  ctx.quadraticCurveTo(x - s * 0.25, y + s * 0.4, x, y + s * 0.28)
  // Right wing
  ctx.quadraticCurveTo(x + s * 0.25, y + s * 0.4, x + s * 0.45, y + s * 0.1)
  ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.25, x + s, y - lift * 0.2)
  ctx.quadraticCurveTo(x + s * 0.5, y - lift - s * 0.3, x, y)
  ctx.closePath()
}

/** A simple leaf: a pointed ellipse. */
function leafPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.quadraticCurveTo(s * 0.75, -s * 0.1, 0, s)
  ctx.quadraticCurveTo(-s * 0.75, -s * 0.1, 0, -s)
  ctx.closePath()
}

/* -- Fixed palettes -------------------------------------------------------- */

const CONFETTI = ['#f2643f', '#4c8dff', '#3ecf8e', '#f5c451', '#9b7cf6']
const AUTUMN = ['#c2541f', '#d98324', '#a8471a', '#e0a33e', '#7d3b12']
const BLOSSOM = ['#f7c5d4', '#efa9bf', '#f9dbe4', '#e88ca8']
const SPARKS = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#f78c6b']

/* -- Renderers ------------------------------------------------------------- */

const snow: FxFactory = (c) => {
  const n = count(c, 90, 320)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 0.8 + rand() * 2.2,
    vy: 12 + rand() * 34,
    phase: rand() * TAU,
  }))

  return {
    draw(dt) {
      c.ctx.fillStyle = c.colors.ink
      for (const s of p) {
        s.phase += dt * 0.8
        s.y += s.vy * dt
        s.x += Math.sin(s.phase) * 10 * dt
        if (s.y - s.r > c.height) {
          s.y = -s.r
          s.x = rand() * c.width
        }
        if (s.x < -10) s.x = c.width + 10
        if (s.x > c.width + 10) s.x = -10

        c.ctx.globalAlpha = c.opacity * (0.25 + (s.r / 3) * 0.45)
        c.ctx.beginPath()
        c.ctx.arc(s.x, s.y, s.r, 0, TAU)
        c.ctx.fill()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const stars: FxFactory = (c) => {
  const n = count(c, 130, 420)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 0.5 + rand() * 1.3,
    phase: rand() * TAU,
  }))

  return {
    draw(dt) {
      c.ctx.fillStyle = c.colors.ink
      for (const s of p) {
        s.phase += dt * 1.4
        c.ctx.globalAlpha =
          c.opacity * 0.5 * (0.35 + Math.abs(Math.sin(s.phase)) * 0.65)
        c.ctx.beginPath()
        c.ctx.arc(s.x, s.y, s.r, 0, TAU)
        c.ctx.fill()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const constellation: FxFactory = (c) => {
  const n = count(c, 42, 120)
  const link = 130
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 1 + rand() * 1.6,
    vx: (rand() - 0.5) * 16,
    vy: (rand() - 0.5) * 16,
  }))

  return {
    draw(dt) {
      for (const s of p) {
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.x < 0 || s.x > c.width) s.vx *= -1
        if (s.y < 0 || s.y > c.height) s.vy *= -1
        s.x = Math.max(0, Math.min(c.width, s.x))
        s.y = Math.max(0, Math.min(c.height, s.y))
      }

      c.ctx.strokeStyle = c.colors.accent
      c.ctx.lineWidth = 1
      for (let i = 0; i < p.length; i++) {
        for (let j = i + 1; j < p.length; j++) {
          const dist = Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y)
          if (dist > link) continue
          c.ctx.globalAlpha = c.opacity * 0.22 * (1 - dist / link)
          c.ctx.beginPath()
          c.ctx.moveTo(p[i].x, p[i].y)
          c.ctx.lineTo(p[j].x, p[j].y)
          c.ctx.stroke()
        }
      }

      c.ctx.fillStyle = c.colors.accent
      c.ctx.globalAlpha = c.opacity * 0.55
      for (const s of p) {
        c.ctx.beginPath()
        c.ctx.arc(s.x, s.y, s.r, 0, TAU)
        c.ctx.fill()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const confetti: FxFactory = (c) => {
  const n = count(c, 70, 260)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 3 + rand() * 4,
    vx: (rand() - 0.5) * 30,
    vy: 55 + rand() * 85,
    phase: rand() * TAU,
    spin: rand() * TAU,
    spinRate: (rand() - 0.5) * 7,
    color: CONFETTI[Math.floor(rand() * CONFETTI.length)],
  }))

  return {
    draw(dt) {
      for (const s of p) {
        s.phase += dt * 1.6
        s.spin += s.spinRate * dt
        s.y += s.vy * dt
        s.x += (s.vx + Math.sin(s.phase) * 22) * dt
        if (s.y - s.r > c.height) {
          s.y = -s.r * 2
          s.x = rand() * c.width
        }
        if (s.x < -20) s.x = c.width + 20
        if (s.x > c.width + 20) s.x = -20

        c.ctx.save()
        c.ctx.translate(s.x, s.y)
        c.ctx.rotate(s.spin)
        // Squashing height by the spin phase fakes a 3D tumble cheaply.
        const squash = Math.abs(Math.cos(s.spin))
        c.ctx.globalAlpha = c.opacity * 0.85
        c.ctx.fillStyle = s.color
        c.ctx.fillRect(-s.r / 2, -s.r * 0.35 * squash, s.r, s.r * 0.7 * squash + 0.6)
        c.ctx.restore()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const hearts: FxFactory = (c) => {
  const n = count(c, 34, 110)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 5 + rand() * 8,
    vy: -(14 + rand() * 26),
    phase: rand() * TAU,
  }))

  return {
    draw(dt) {
      c.ctx.fillStyle = c.colors.accent
      for (const s of p) {
        s.phase += dt * 1.1
        s.y += s.vy * dt
        s.x += Math.sin(s.phase) * 16 * dt
        if (s.y + s.r * 2 < 0) {
          s.y = c.height + s.r * 2
          s.x = rand() * c.width
        }
        c.ctx.globalAlpha = c.opacity * 0.4
        heartPath(c.ctx, s.x, s.y, s.r * 0.5)
        c.ctx.fill()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const bats: FxFactory = (c) => {
  const n = count(c, 14, 44)
  const p = Array.from({ length: n }, () => {
    const dir = rand() < 0.5 ? 1 : -1
    return {
      x: rand() * c.width,
      y: rand() * c.height * 0.75,
      s: 7 + rand() * 12,
      vx: dir * (35 + rand() * 55),
      phase: rand() * TAU,
      // Bob amplitude, so the flight path is not a flat line.
      bob: 10 + rand() * 22,
      baseY: 0,
      flapRate: 7 + rand() * 5,
    }
  })
  for (const s of p) s.baseY = s.y

  return {
    draw(dt) {
      c.ctx.fillStyle = c.colors.ink
      for (const s of p) {
        s.phase += dt * s.flapRate
        s.x += s.vx * dt
        s.y = s.baseY + Math.sin(s.phase * 0.35) * s.bob

        if (s.vx > 0 && s.x - s.s > c.width) {
          s.x = -s.s * 2
          s.baseY = rand() * c.height * 0.75
        }
        if (s.vx < 0 && s.x + s.s < 0) {
          s.x = c.width + s.s * 2
          s.baseY = rand() * c.height * 0.75
        }

        c.ctx.globalAlpha = c.opacity * 0.55
        batPath(c.ctx, s.x, s.y, s.s, (Math.sin(s.phase) + 1) / 2)
        c.ctx.fill()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const fireworks: FxFactory = (c) => {
  type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string }
  const bursts = Math.max(1, Math.round(3 * c.density))
  const sparksPerBurst = 26
  const gravity = 90
  let sparks: Spark[] = []
  let timer = 0

  function launch() {
    const ox = c.width * (0.15 + rand() * 0.7)
    const oy = c.height * (0.12 + rand() * 0.45)
    const color = SPARKS[Math.floor(rand() * SPARKS.length)]
    const speed = 70 + rand() * 90
    for (let i = 0; i < sparksPerBurst; i++) {
      const angle = (i / sparksPerBurst) * TAU + rand() * 0.2
      const v = speed * (0.65 + rand() * 0.5)
      const max = 1.1 + rand() * 0.9
      sparks.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: max,
        max,
        color,
      })
    }
  }

  // Start with a couple already in the air rather than an empty screen.
  launch()

  return {
    draw(dt) {
      timer -= dt
      if (timer <= 0) {
        launch()
        timer = 1.6 / bursts + rand() * 0.9
      }

      for (const s of sparks) {
        s.life -= dt
        s.vy += gravity * dt
        s.x += s.vx * dt
        s.y += s.vy * dt

        const fade = Math.max(0, s.life / s.max)
        c.ctx.globalAlpha = c.opacity * fade * 0.9
        c.ctx.fillStyle = s.color
        c.ctx.beginPath()
        c.ctx.arc(s.x, s.y, 1.6 + fade * 1.4, 0, TAU)
        c.ctx.fill()
      }

      sparks = sparks.filter((s) => s.life > 0)
      c.ctx.globalAlpha = 1
    },
  }
}

const leaves: FxFactory = (c) => {
  const n = count(c, 30, 110)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    s: 5 + rand() * 7,
    vy: 22 + rand() * 38,
    phase: rand() * TAU,
    spin: rand() * TAU,
    spinRate: (rand() - 0.5) * 3,
    color: AUTUMN[Math.floor(rand() * AUTUMN.length)],
  }))

  return {
    draw(dt) {
      for (const s of p) {
        s.phase += dt * 0.9
        s.spin += s.spinRate * dt
        s.y += s.vy * dt
        // Leaves fall in a wide swing rather than straight down.
        s.x += Math.sin(s.phase) * 34 * dt
        if (s.y - s.s > c.height) {
          s.y = -s.s * 2
          s.x = rand() * c.width
        }

        c.ctx.save()
        c.ctx.translate(s.x, s.y)
        c.ctx.rotate(s.spin)
        c.ctx.globalAlpha = c.opacity * 0.7
        c.ctx.fillStyle = s.color
        leafPath(c.ctx, s.s)
        c.ctx.fill()
        c.ctx.restore()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const petals: FxFactory = (c) => {
  const n = count(c, 46, 170)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    s: 3 + rand() * 4,
    vy: 16 + rand() * 26,
    phase: rand() * TAU,
    spin: rand() * TAU,
    spinRate: (rand() - 0.5) * 2.2,
    color: BLOSSOM[Math.floor(rand() * BLOSSOM.length)],
  }))

  return {
    draw(dt) {
      for (const s of p) {
        s.phase += dt * 1.1
        s.spin += s.spinRate * dt
        s.y += s.vy * dt
        s.x += Math.sin(s.phase) * 26 * dt
        if (s.y - s.s > c.height) {
          s.y = -s.s * 2
          s.x = rand() * c.width
        }

        c.ctx.save()
        c.ctx.translate(s.x, s.y)
        c.ctx.rotate(s.spin)
        c.ctx.globalAlpha = c.opacity * 0.75
        c.ctx.fillStyle = s.color
        c.ctx.beginPath()
        c.ctx.ellipse(0, 0, s.s, s.s * 0.55, 0, 0, TAU)
        c.ctx.fill()
        c.ctx.restore()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const fireflies: FxFactory = (c) => {
  const n = count(c, 26, 90)
  const p = Array.from({ length: n }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 1.4 + rand() * 1.8,
    vx: (rand() - 0.5) * 22,
    vy: (rand() - 0.5) * 22,
    phase: rand() * TAU,
    pulse: 0.6 + rand() * 1.1,
  }))

  return {
    draw(dt) {
      for (const s of p) {
        s.phase += dt * s.pulse
        // Wander: nudge velocity rather than setting it, for a lazy drift.
        s.vx += (rand() - 0.5) * 26 * dt
        s.vy += (rand() - 0.5) * 26 * dt
        s.vx = Math.max(-30, Math.min(30, s.vx))
        s.vy = Math.max(-30, Math.min(30, s.vy))
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.x < 0 || s.x > c.width) s.vx *= -1
        if (s.y < 0 || s.y > c.height) s.vy *= -1
        s.x = Math.max(0, Math.min(c.width, s.x))
        s.y = Math.max(0, Math.min(c.height, s.y))

        const glow = 0.25 + Math.abs(Math.sin(s.phase)) * 0.75
        const halo = c.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6)
        halo.addColorStop(0, 'rgba(255, 226, 130, 0.9)')
        halo.addColorStop(1, 'rgba(255, 226, 130, 0)')
        c.ctx.globalAlpha = c.opacity * glow * 0.75
        c.ctx.fillStyle = halo
        c.ctx.beginPath()
        c.ctx.arc(s.x, s.y, s.r * 6, 0, TAU)
        c.ctx.fill()
      }
      c.ctx.globalAlpha = 1
    },
  }
}

const matrix: FxFactory = (c) => {
  const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789<>/\\{}[]=+*'
  const fontSize = 15
  const columns = Math.max(1, Math.floor(c.width / fontSize))
  const heads = Array.from({ length: columns }, () => ({
    y: rand() * c.height,
    speed: 90 + rand() * 190,
    // Trail length in glyphs.
    trail: 6 + Math.floor(rand() * 12),
  }))

  return {
    draw(dt) {
      c.ctx.font = `${fontSize}px ui-monospace, monospace`
      c.ctx.textBaseline = 'top'

      for (let i = 0; i < columns; i++) {
        const h = heads[i]
        h.y += h.speed * dt
        if (h.y - h.trail * fontSize > c.height) {
          h.y = -fontSize * (rand() * 8)
          h.speed = 90 + rand() * 190
          h.trail = 6 + Math.floor(rand() * 12)
        }

        const x = i * fontSize
        for (let t = 0; t < h.trail; t++) {
          const y = h.y - t * fontSize
          if (y < -fontSize || y > c.height) continue
          const fade = 1 - t / h.trail
          // Glyphs are re-rolled per frame, which is what makes it shimmer.
          const glyph = GLYPHS[Math.floor(rand() * GLYPHS.length)]
          c.ctx.globalAlpha = c.opacity * fade * 0.55
          c.ctx.fillStyle = t === 0 ? '#c9ffe0' : '#3ecf8e'
          c.ctx.fillText(glyph, x, y)
        }
      }
      c.ctx.globalAlpha = 1
    },
  }
}

export const FX: Record<CanvasEffect, FxFactory> = {
  snow,
  stars,
  constellation,
  confetti,
  hearts,
  bats,
  fireworks,
  leaves,
  petals,
  fireflies,
  matrix,
}

export const CANVAS_EFFECTS = Object.keys(FX) as CanvasEffect[]

export function isCanvasEffect(id: string): id is CanvasEffect {
  return id in FX
}
