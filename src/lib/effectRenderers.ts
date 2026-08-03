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
  | 'astronaut'
  | 'websling'
  | 'galaxy'

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

/** Rounded rectangle as a path, centred wherever x/y put it. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * A helmeted astronaut, drawn around its centre with `s` as roughly the
 * half-height of the torso. Limbs are stroked capsules rather than filled
 * outlines — at background scale the difference is invisible and it costs a
 * fraction of the path work.
 */
function drawAstronaut(
  ctx: CanvasRenderingContext2D,
  s: number,
  accent: string,
) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Arms are thinner and longer than the legs, which is most of what stops
  // four identical capsules reading as a starfish.
  const arms = new Path2D()
  arms.moveTo(-s * 0.4, -s * 0.15)
  arms.lineTo(-s * 1.2, s * 0.25)
  arms.moveTo(s * 0.4, -s * 0.15)
  arms.lineTo(s * 1.25, -s * 0.5)

  const legs = new Path2D()
  legs.moveTo(-s * 0.26, s * 0.55)
  legs.lineTo(-s * 0.44, s * 1.35)
  legs.moveTo(s * 0.26, s * 0.55)
  legs.lineTo(s * 0.6, s * 1.25)

  // Limbs before the torso, so the torso covers the joints. Each is stroked
  // twice: a slightly fatter darker pass underneath is what keeps a near-white
  // suit from disappearing on the light theme.
  ctx.strokeStyle = SUIT.shade
  ctx.lineWidth = s * 0.36
  ctx.stroke(arms)
  ctx.lineWidth = s * 0.46
  ctx.stroke(legs)

  ctx.strokeStyle = SUIT.shell
  ctx.lineWidth = s * 0.26
  ctx.stroke(arms)
  ctx.lineWidth = s * 0.36
  ctx.stroke(legs)

  ctx.fillStyle = SUIT.shade
  roundRect(ctx, -s * 0.8, -s * 0.35, s * 0.42, s * 0.95, s * 0.14)
  ctx.fill()

  ctx.fillStyle = SUIT.shell
  ctx.strokeStyle = SUIT.shade
  ctx.lineWidth = s * 0.1
  roundRect(ctx, -s * 0.5, -s * 0.4, s, s * 1.15, s * 0.3)
  ctx.fill()
  ctx.stroke()

  // Chest panel in the accent, so the suit picks up the site colour.
  ctx.fillStyle = accent
  roundRect(ctx, -s * 0.22, -s * 0.12, s * 0.44, s * 0.3, s * 0.08)
  ctx.fill()

  // A rim a shade darker than the suit is what keeps the helmet from melting
  // into the torso it overlaps.
  ctx.fillStyle = SUIT.shade
  ctx.beginPath()
  ctx.arc(0, -s * 0.95, s * 0.68, 0, TAU)
  ctx.fill()

  ctx.fillStyle = SUIT.shell
  ctx.beginPath()
  ctx.arc(0, -s * 0.95, s * 0.6, 0, TAU)
  ctx.fill()

  ctx.fillStyle = SUIT.visor
  ctx.beginPath()
  ctx.ellipse(s * 0.05, -s * 0.95, s * 0.44, s * 0.36, 0, 0, TAU)
  ctx.fill()

  // A single glint is what stops the visor reading as a hole.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.beginPath()
  ctx.ellipse(-s * 0.1, -s * 1.06, s * 0.15, s * 0.08, -0.5, 0, TAU)
  ctx.fill()
}

/**
 * A figure hanging from a web. Local -y points at the anchor, so the caller
 * only has to rotate by the swing angle and the gripping hand lands on the
 * strand automatically.
 */
function drawSwinger(ctx: CanvasRenderingContext2D, s: number) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Legs, trailing behind the body.
  ctx.strokeStyle = SPIDEY.panel
  ctx.lineWidth = s * 0.24
  ctx.beginPath()
  ctx.moveTo(s * 0.05, s * 0.45)
  ctx.quadraticCurveTo(s * 0.5, s * 0.75, s * 0.75, s * 1.15)
  ctx.moveTo(-s * 0.1, s * 0.45)
  ctx.quadraticCurveTo(s * 0.15, s * 0.95, -s * 0.2, s * 1.3)
  ctx.stroke()

  // Gripping arm up the strand, free arm flung back.
  ctx.strokeStyle = SPIDEY.suit
  ctx.lineWidth = s * 0.22
  ctx.beginPath()
  ctx.moveTo(0, -s * 0.15)
  ctx.lineTo(s * 0.04, -s * 1.05)
  ctx.moveTo(-s * 0.15, -s * 0.05)
  ctx.quadraticCurveTo(-s * 0.6, s * 0.15, -s * 0.95, s * 0.5)
  ctx.stroke()

  ctx.fillStyle = SPIDEY.suit
  roundRect(ctx, -s * 0.3, -s * 0.25, s * 0.6, s * 0.85, s * 0.22)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(0, -s * 0.5, s * 0.3, 0, TAU)
  ctx.fill()

  // Two teardrop eyes — the whole silhouette hangs on these reading right.
  ctx.fillStyle = SPIDEY.eye
  ctx.beginPath()
  ctx.ellipse(-s * 0.13, -s * 0.55, s * 0.12, s * 0.08, -0.35, 0, TAU)
  ctx.ellipse(s * 0.13, -s * 0.55, s * 0.12, s * 0.08, 0.35, 0, TAU)
  ctx.fill()
}

/**
 * A quarter spiderweb anchored in a corner: straight spokes plus rings that
 * sag inward between them, which is what separates a web from a dartboard.
 */
function cornerWeb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  from: number,
  to: number,
) {
  const spokes = 7
  const rings = 5
  const angle = (i: number) => from + ((to - from) * i) / (spokes - 1)

  ctx.beginPath()
  for (let i = 0; i < spokes; i++) {
    const a = angle(i)
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
  }

  for (let r = 1; r <= rings; r++) {
    const rr = (radius * r) / rings
    for (let i = 0; i < spokes - 1; i++) {
      const a1 = angle(i)
      const a2 = angle(i + 1)
      const mid = (a1 + a2) / 2
      ctx.moveTo(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr)
      ctx.quadraticCurveTo(
        cx + Math.cos(mid) * rr * 0.82,
        cy + Math.sin(mid) * rr * 0.82,
        cx + Math.cos(a2) * rr,
        cy + Math.sin(a2) * rr,
      )
    }
  }
  ctx.stroke()
}

/* -- Fixed palettes -------------------------------------------------------- */

const CONFETTI = ['#f2643f', '#4c8dff', '#3ecf8e', '#f5c451', '#9b7cf6']
const AUTUMN = ['#c2541f', '#d98324', '#a8471a', '#e0a33e', '#7d3b12']
const BLOSSOM = ['#f7c5d4', '#efa9bf', '#f9dbe4', '#e88ca8']
const SPARKS = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#f78c6b']

function rgbOf(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** '#rrggbb' at an alpha, for gradient stops that have to fade to nothing. */
function alpha(hex: string, a: number): string {
  const [r, g, b] = rgbOf(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Both of these are drawn in their own colours rather than the theme ink: a
// white astronaut and a red suit are the whole point, and they stay readable
// on the light canvas as well as the dark one.
const SUIT = { shell: '#dfe2ea', shade: '#98a0b4', visor: '#1b2030' }
const SPIDEY = { suit: '#d1262f', panel: '#2b47c8', eye: '#f4f6ff' }

/** Craters are a fixed table so the moon does not boil between frames. */
const CRATERS = [
  { x: -0.34, y: -0.22, r: 0.17 },
  { x: 0.22, y: -0.38, r: 0.11 },
  { x: 0.36, y: 0.18, r: 0.2 },
  { x: -0.12, y: 0.42, r: 0.13 },
  { x: -0.5, y: 0.26, r: 0.08 },
  { x: 0.02, y: -0.02, r: 0.09 },
]

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

const astronaut: FxFactory = (c) => {
  // Far fewer bodies than any particle effect: this one is read as a scene,
  // and a crowd of astronauts stops looking like a spacewalk.
  const n = count(c, 1.6, 4)
  const starCount = count(c, 110, 340)

  const moon = {
    x: c.width * 0.82,
    y: c.height * 0.24,
    r: Math.max(58, Math.min(c.width, c.height) * 0.13),
  }

  const field = Array.from({ length: starCount }, () => ({
    x: rand() * c.width,
    y: rand() * c.height,
    r: 0.4 + rand() * 1.2,
    phase: rand() * TAU,
  }))

  const crew = Array.from({ length: n }, () => {
    const dir = rand() < 0.5 ? 1 : -1
    return {
      x: rand() * c.width,
      y: c.height * (0.15 + rand() * 0.7),
      s: 12 + rand() * 16,
      vx: dir * (11 + rand() * 17),
      vy: (rand() - 0.5) * 9,
      spin: rand() * TAU,
      // Slow enough that the tumble reads as weightless drift, not spinning.
      spinRate: (rand() - 0.5) * 0.4,
      phase: rand() * TAU,
    }
  })

  return {
    draw(dt) {
      // Moon, behind everything.
      const glow = c.ctx.createRadialGradient(
        moon.x,
        moon.y,
        moon.r * 0.7,
        moon.x,
        moon.y,
        moon.r * 2.4,
      )
      glow.addColorStop(0, 'rgba(226, 230, 240, 0.28)')
      glow.addColorStop(1, 'rgba(226, 230, 240, 0)')
      c.ctx.globalAlpha = c.opacity * 0.7
      c.ctx.fillStyle = glow
      c.ctx.beginPath()
      c.ctx.arc(moon.x, moon.y, moon.r * 2.4, 0, TAU)
      c.ctx.fill()

      c.ctx.globalAlpha = c.opacity * 0.5
      c.ctx.fillStyle = '#d9dbe2'
      c.ctx.beginPath()
      c.ctx.arc(moon.x, moon.y, moon.r, 0, TAU)
      c.ctx.fill()

      c.ctx.fillStyle = 'rgba(120, 126, 142, 0.45)'
      for (const crater of CRATERS) {
        c.ctx.beginPath()
        c.ctx.arc(
          moon.x + crater.x * moon.r,
          moon.y + crater.y * moon.r,
          crater.r * moon.r,
          0,
          TAU,
        )
        c.ctx.fill()
      }

      // Starfield.
      c.ctx.fillStyle = c.colors.ink
      for (const s of field) {
        s.phase += dt * 1.2
        c.ctx.globalAlpha =
          c.opacity * 0.45 * (0.3 + Math.abs(Math.sin(s.phase)) * 0.7)
        c.ctx.beginPath()
        c.ctx.arc(s.x, s.y, s.r, 0, TAU)
        c.ctx.fill()
      }

      // Crew.
      for (const a of crew) {
        a.phase += dt * 0.7
        a.spin += a.spinRate * dt
        a.x += a.vx * dt
        a.y += (a.vy + Math.sin(a.phase) * 6) * dt

        const margin = a.s * 4
        if (a.vx > 0 && a.x - margin > c.width) {
          a.x = -margin
          a.y = c.height * (0.15 + rand() * 0.7)
        }
        if (a.vx < 0 && a.x + margin < 0) {
          a.x = c.width + margin
          a.y = c.height * (0.15 + rand() * 0.7)
        }
        if (a.y < -margin) a.y = c.height + margin
        if (a.y > c.height + margin) a.y = -margin

        // Tether, trailing back the way they came.
        const back = a.vx > 0 ? -1 : 1
        const tipX = a.x + back * a.s * 6
        const tipY = a.y + Math.sin(a.phase * 1.3) * a.s * 1.2
        c.ctx.globalAlpha = c.opacity * 0.3
        c.ctx.strokeStyle = c.colors.ink
        c.ctx.lineWidth = 1.2
        c.ctx.beginPath()
        c.ctx.moveTo(a.x, a.y)
        c.ctx.quadraticCurveTo(
          a.x + back * a.s * 3,
          a.y + Math.sin(a.phase) * a.s * 1.6,
          tipX,
          tipY,
        )
        c.ctx.stroke()

        c.ctx.save()
        c.ctx.translate(a.x, a.y)
        c.ctx.rotate(a.spin)
        c.ctx.globalAlpha = c.opacity * 0.9
        drawAstronaut(c.ctx, a.s, c.colors.accent)
        c.ctx.restore()
      }

      c.ctx.globalAlpha = 1
    },
  }
}

const websling: FxFactory = (c) => {
  const n = count(c, 1.2, 3)
  // Pixels per second squared. Because it plays against the strand length,
  // which is a fraction of the viewport, the arc takes about the same time on
  // a phone as on a monitor.
  const GRAVITY = 420
  const MAX_ANGLE = 0.95

  type Swinger = {
    ax: number
    ay: number
    length: number
    angle: number
    omega: number
    s: number
  }

  /** Anchors sit above the viewport, so the strand arrives from off-screen. */
  const anchorY = () => -c.height * (0.2 + rand() * 0.15)

  /**
   * One step of the pendulum, integrated semi-implicitly so the amplitude
   * holds instead of bleeding away.
   *
   * At the forward extreme the web is released and re-shot ahead. The new
   * anchor is placed so the body does not jump: the next swing starts from
   * exactly where the last one ended, which is also the moment they are
   * slowest — the same beat a real swing has.
   */
  function advance(p: Swinger, dt: number) {
    p.omega -= (GRAVITY / p.length) * Math.sin(p.angle) * dt
    p.angle += p.omega * dt

    if (p.omega <= 0 && p.angle > 0) {
      p.ax += 2 * p.length * Math.sin(p.angle)
      p.ay = anchorY()
      p.angle = -MAX_ANGLE
      p.omega = 0
    }
  }

  const swingers = Array.from({ length: n }, (_, i) => {
    const length = c.height * (0.62 + rand() * 0.22)
    const p: Swinger = {
      ax: 0,
      ay: anchorY(),
      length,
      angle: -MAX_ANGLE,
      omega: 0,
      s: 15 + rand() * 10,
    }
    // Warm each one up by a random slice of its own arc, so they are not all
    // released in unison. Seeding a resting body at a random angle instead
    // would rob it of the energy to complete the swing.
    const warm = Math.floor(rand() * 220)
    for (let k = 0; k < warm; k++) advance(p, 1 / 60)
    // Only now is the anchor placed, spreading the bodies across the viewport.
    p.ax = c.width * ((i + rand()) / n) - Math.sin(p.angle) * p.length
    return p
  })

  return {
    draw(dt) {
      // Corner webs — static, and the cheapest way to say "Spider-Man".
      const web = Math.min(c.width, c.height) * 0.3
      c.ctx.globalAlpha = c.opacity * 0.14
      c.ctx.strokeStyle = c.colors.ink
      c.ctx.lineWidth = 1
      cornerWeb(c.ctx, 0, 0, web, 0, Math.PI / 2)
      cornerWeb(c.ctx, c.width, 0, web, Math.PI / 2, Math.PI)

      for (const p of swingers) {
        advance(p, dt)

        const x = p.ax + Math.sin(p.angle) * p.length
        const y = p.ay + Math.cos(p.angle) * p.length

        const margin = p.s * 6
        if (x - margin > c.width) {
          p.ax -= c.width + margin * 2
          p.s = 15 + rand() * 10
        }

        c.ctx.globalAlpha = c.opacity * 0.4
        c.ctx.strokeStyle = c.colors.ink
        c.ctx.lineWidth = 1.4
        c.ctx.beginPath()
        c.ctx.moveTo(p.ax, p.ay)
        c.ctx.lineTo(x, y)
        c.ctx.stroke()

        c.ctx.save()
        c.ctx.translate(x, y)
        // Negated because the body's local -y has to point back up the
        // strand, which puts the gripping hand on it for free. The extra lean
        // comes from how fast they are moving through the arc.
        c.ctx.rotate(-(p.angle + p.omega * 0.12))
        c.ctx.globalAlpha = c.opacity * 0.9
        drawSwinger(c.ctx, p.s)
        c.ctx.restore()
      }

      c.ctx.globalAlpha = 1
    },
  }
}

/* -- Milky Way -------------------------------------------------------------

   Structurally unlike the other renderers. Star haze, nebulae and dust are
   tens of thousands of paint operations, and none of it moves relative to the
   rest of the band — so the band is baked once into an offscreen strip that
   afterwards scrolls as a single image. Per frame that costs two blits plus
   the near stars drawn live on top, which is less than the gradient-per-frame
   version it replaces, and buys detail that could not be painted at 60fps.

   Everything baked is periodic along the strip, so the two blits meet without
   a seam.
   -------------------------------------------------------------------------- */

/**
 * Bright ink means the canvas behind it is dark. The galaxy is the one effect
 * that has to know: a luminous band belongs on a night sky, and on paper the
 * same structure has to be drawn the way a print does it — dark on light, with
 * the dust lanes coming out pale.
 */
function inkIsLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5
}

/** Star colours by spectral class, hottest first. */
const STAR_TINTS = [
  '#bcd2ff',
  '#dbe6ff',
  '#f6f7ff',
  '#fff7e8',
  '#ffdfb8',
  '#ffc79b',
]

const galaxy: FxFactory = (c) => {
  const night = inkIsLight(c.colors.ink)
  const TILT = -0.34
  const cosT = Math.cos(TILT)
  const sinT = Math.sin(TILT)
  // The strip repeats every `span`, so it has to outrun the diagonal.
  const span = Math.hypot(c.width, c.height) * 1.25
  const half = span / 2
  const reach = Math.max(200, Math.min(c.width, c.height) * 0.45)
  const cx = c.width / 2
  const cy = c.height / 2

  const worldX = (u: number, v: number) => cx + u * cosT - v * sinT
  const worldY = (u: number, v: number) => cy + u * sinT + v * cosT
  const wrap = (u: number) => (u > half ? u - span : u < -half ? u + span : u)

  /** Roughly normal, in -1..1. Three uniforms is plenty at this scale. */
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5

  // On paper every mark is high contrast, so the whole build goes down lighter
  // than it does on a night sky.
  const wash = night ? 1 : 0.5
  const CLOUD = night ? '#c6c2e6' : '#4b4468'
  const CORE = night ? '#f2e4c6' : '#5c4c52'
  const GRAIN = night ? '#f8f4ec' : '#2f2942'
  const EMISSION = night
    ? ['#e05070', '#cf4a86', '#c85a52']
    : ['#8d3f56', '#7c3a5f', '#7a4038']
  const REFLECT = night ? ['#4a6fd0', '#3f8ec2'] : ['#3a4a7c', '#2f5570']

  /* -- Bake ---------------------------------------------------------------- */

  const layer = document.createElement('canvas')
  // Big screens would otherwise ask for a strip well past 10M pixels. The bake
  // is a single blocking burst on mount, and it is dominated by the area of
  // the soft fills, so the resolution is capped and the blit scales it back
  // up. Nebulae are soft enough that nobody can tell; it only ever costs the
  // star haze a little crispness.
  const bakeScale = Math.min(1, Math.sqrt(3e6 / (span * reach * 2)))
  layer.width = Math.max(1, Math.round(span * bakeScale))
  layer.height = Math.max(1, Math.round(reach * 2 * bakeScale))

  const lc = layer.getContext('2d')
  if (lc) {
    lc.scale(bakeScale, bakeScale)
    // Strip space: u runs across it from the left, v down from the middle.
    const X = (u: number) => u + half
    const Y = (v: number) => v + reach

    /**
     * Anything with a radius needs a second copy across the seam — but only if
     * it actually reaches it. Testing against the feature's own size rather
     * than a blanket margin is the difference between painting a handful of
     * things twice and painting everything three times.
     */
    const seam = (u: number, radius: number, paint: (at: number) => void) => {
      paint(u)
      if (u + radius > half) paint(u - span)
      if (u - radius < -half) paint(u + span)
    }

    /**
     * Clumping noise. The frequencies along u are whole multiples of the
     * strip, which is what keeps the mottling periodic and the seam invisible;
     * across v they can be anything. Returns roughly -1..1.
     */
    const k = TAU / span
    const clump = (u: number, v: number) =>
      Math.sin(u * k * 3 + v * 0.004) * 0.42 +
      Math.sin(u * k * 7 - v * 0.011 + 1.7) * 0.27 +
      Math.sin(u * k * 17 + v * 0.021 + 4.1) * 0.17 +
      Math.sin(u * k * 41 - v * 0.052 + 2.3) * 0.14

    /** Soft ellipse, as a radial gradient squashed and turned. */
    const blob = (
      u: number,
      v: number,
      r: number,
      squash: number,
      angle: number,
      stops: [number, string][],
    ) => {
      seam(u, r, (at) => {
        lc.save()
        lc.translate(X(at), Y(v))
        lc.rotate(angle)
        lc.scale(1, squash)
        const g = lc.createRadialGradient(0, 0, 0, 0, 0, r)
        for (const [stop, color] of stops) g.addColorStop(stop, color)
        lc.fillStyle = g
        lc.beginPath()
        lc.arc(0, 0, r, 0, TAU)
        lc.fill()
        lc.restore()
      })
    }

    // 1. The band itself. The profile is deliberately lopsided — a symmetric
    //    falloff reads as an airbrushed stripe.
    const profile: [number, number][] = [
      [0, 0],
      [0.18, 0.02],
      [0.32, 0.09],
      [0.42, 0.18],
      [0.5, 0.24],
      [0.57, 0.2],
      [0.68, 0.1],
      [0.84, 0.02],
      [1, 0],
    ]
    const base = lc.createLinearGradient(0, 0, 0, reach * 2)
    for (const [stop, a] of profile) base.addColorStop(stop, alpha(CLOUD, a * wash))
    lc.fillStyle = base
    lc.fillRect(0, 0, span, reach * 2)

    // 2. The bulge: warmer and brighter, offset from centre so the band is not
    //    symmetrical about the middle of the screen.
    const coreU = -span * 0.13
    blob(coreU, 0, reach * 1.7, 0.4, 0, [
      [0, alpha(CORE, 0.4 * wash)],
      [0.4, alpha(CORE, 0.18 * wash)],
      [1, alpha(CORE, 0)],
    ])
    blob(coreU + reach * 0.2, 0, reach * 0.75, 0.5, 0, [
      [0, alpha(CORE, 0.3 * wash)],
      [1, alpha(CORE, 0)],
    ])

    // 3. Star clouds — the bright knots the band breaks up into.
    // Kept deliberately few and not too large: each one is a soft fill the
    // size of a small country, and they are the most expensive thing baked.
    const clouds = 15 + Math.round(rand() * 7)
    for (let i = 0; i < clouds; i++) {
      const u = (rand() - 0.5) * span
      const v = gauss() * reach * 0.4
      const r = reach * (0.2 + rand() * 0.45)
      blob(u, v, r, 0.35 + rand() * 0.4, (rand() - 0.5) * 0.5, [
        [0, alpha(CLOUD, (0.07 + rand() * 0.1) * wash)],
        [0.5, alpha(CLOUD, 0.035 * wash)],
        [1, alpha(CLOUD, 0)],
      ])
    }

    // 4. Nebulae. The emission regions are the only saturated colour in the
    //    whole effect, so there are few of them and they stay small.
    for (let i = 0; i < 5; i++) {
      const tint = EMISSION[Math.floor(rand() * EMISSION.length)]
      const u = (rand() - 0.5) * span
      const v = gauss() * reach * 0.3
      const r = reach * (0.07 + rand() * 0.13)
      blob(u, v, r, 0.55 + rand() * 0.35, rand() * TAU, [
        [0, alpha(tint, 0.4 * wash)],
        [0.35, alpha(tint, 0.2 * wash)],
        [1, alpha(tint, 0)],
      ])
      // A hot core inside the cloud, which is what the eye reads as a nebula
      // rather than a smudge.
      blob(u, v, r * 0.32, 0.8, 0, [
        [0, alpha(night ? '#fff0f2' : tint, 0.5 * wash)],
        [1, alpha(tint, 0)],
      ])
    }
    for (let i = 0; i < 3; i++) {
      const tint = REFLECT[Math.floor(rand() * REFLECT.length)]
      blob(
        (rand() - 0.5) * span,
        gauss() * reach * 0.35,
        reach * (0.08 + rand() * 0.14),
        0.6 + rand() * 0.3,
        rand() * TAU,
        [
          [0, alpha(tint, 0.26 * wash)],
          [1, alpha(tint, 0)],
        ],
      )
    }

    /* 5 + 6. The star field, written as raw pixels.

       This is the layer that does the real work — the band's texture is
       thousands of stars too faint to separate, and nothing painted with
       gradients imitates it — but it is also forty thousand marks. Asked of
       the canvas API one fillRect at a time, the per-call overhead alone runs
       to a fifth of a second on a large screen, while the actual pixels
       touched would fit in a postage stamp. Written straight into a buffer
       and composited in one drawImage, the same field costs almost nothing.

       Coordinates are device pixels here, not strip units, so the bake scale
       is applied by hand and every mark lands on the pixel grid. */

    const gw = layer.width
    const gh = layer.height
    const field = new Uint8ClampedArray(gw * gh * 4)

    const [hazeR, hazeG, hazeB] = rgbOf(GRAIN)
    /** Source-over of one grain. Same colour both sides, so no divide. */
    const grain = (px: number, py: number, a: number) => {
      if (px < 0 || py < 0 || px >= gw || py >= gh) return
      const i = (py * gw + px) * 4
      field[i] = hazeR
      field[i + 1] = hazeG
      field[i + 2] = hazeB
      field[i + 3] = a + field[i + 3] * (1 - a / 255)
    }

    const grains = Math.min(
      40_000,
      Math.round(span * reach * 0.016 * c.density),
    )
    // Weighted so the faintest tier is much the most numerous, the way a real
    // luminosity function runs.
    const tiers: [number, number, number][] = [
      [0.44, 0.06, 1],
      [0.25, 0.12, 1],
      [0.16, 0.2, 1],
      [0.1, 0.3, 1.4],
      [0.05, 0.45, 1.8],
    ]
    for (const [share, level, size] of tiers) {
      const a = Math.round(level * wash * 255)
      const dot = Math.max(1, Math.round(size * bakeScale))
      const n = Math.round(grains * share)
      for (let i = 0; i < n; i++) {
        const u = (rand() - 0.5) * span
        const v = gauss() * reach * 0.55
        // Rejection sampling against the noise, so the haze gathers into
        // clouds instead of spraying evenly. The floor is low on purpose: most
        // of the band's structure should come from where the grain is dense,
        // not from the smooth gradients under it.
        if (rand() > 0.12 + 0.88 * (0.5 + 0.5 * clump(u, v))) continue
        const px = Math.round(X(u) * bakeScale)
        const py = Math.round(Y(v) * bakeScale)
        for (let dy = 0; dy < dot; dy++) {
          for (let dx = 0; dx < dot; dx++) grain(px + dx, py + dy, a)
        }
      }
    }

    // Resolved background stars, tinted by spectral class. Sparse enough that
    // overlaps are not worth blending for — the later star simply wins.
    const faint = Math.min(5000, Math.round(span * reach * 0.0018 * c.density))
    const shades = (night ? STAR_TINTS : [GRAIN]).map(rgbOf)
    for (let i = 0; i < faint; i++) {
      const u = (rand() - 0.5) * span
      const v = rand() < 0.7 ? gauss() * reach * 0.6 : (rand() - 0.5) * reach * 2
      const px = Math.round(X(u) * bakeScale)
      const py = Math.round(Y(v) * bakeScale)
      if (px < 0 || py < 0 || px >= gw || py >= gh) continue
      const [r, g, b] = shades[Math.floor(rand() * shades.length)]
      const a = Math.round((0.3 + rand() * 0.5) * wash * 255)
      const size = rand() < 0.75 ? 1 : 2
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const x = px + dx
          const y = py + dy
          if (x >= gw || y >= gh) continue
          const j = (y * gw + x) * 4
          field[j] = r
          field[j + 1] = g
          field[j + 2] = b
          field[j + 3] = Math.max(field[j + 3], a)
        }
      }
    }

    // putImageData would overwrite the nebulae underneath instead of settling
    // on top of them, so the field goes through a scratch canvas and a normal
    // composite.
    const scratch = document.createElement('canvas')
    scratch.width = gw
    scratch.height = gh
    const sc = scratch.getContext('2d')
    if (sc) {
      sc.putImageData(new ImageData(field, gw, gh), 0, 0)
      lc.save()
      lc.setTransform(1, 0, 0, 1, 0, 0)
      lc.drawImage(scratch, 0, 0)
      lc.restore()
      // Zeroing the size hands the backing store back now rather than at the
      // next collection. On a large screen that is a dozen megabytes.
      scratch.width = 0
      scratch.height = 0
    }

    // 7. Dust. Last, so it occludes the stars behind it the way real dust does,
    //    and cut rather than painted: erasing lets the page show through, which
    //    is correct in both themes without knowing the background colour.
    lc.globalCompositeOperation = 'destination-out'
    const lanes = 7
    for (let i = 0; i < lanes; i++) {
      let u = (rand() - 0.5) * span
      let v = gauss() * reach * 0.22
      let heading = (rand() - 0.5) * 0.34
      const steps = 14 + Math.floor(rand() * 16)
      const stride = reach * (0.1 + rand() * 0.1)
      const thickness = reach * (0.05 + rand() * 0.11)
      const strength = 0.26 + rand() * 0.3
      for (let s = 0; s < steps; s++) {
        // Taper both ends, or a lane starts and stops as a blunt blob. The
        // per-step jitter on top matters as much: a lane of evenly sized
        // ellipses merges into one smooth brush stroke, and dust never looks
        // brushed on.
        const taper = Math.sin((Math.PI * (s + 0.5)) / steps)
        const fat = thickness * taper * (0.6 + rand() * 0.8)
        const long = stride * (1.1 + rand() * 0.8)
        blob(u, v + (rand() - 0.5) * thickness * 0.5, long, fat / long, heading, [
          [0, `rgba(0, 0, 0, ${strength * taper * (0.7 + rand() * 0.5)})`],
          [0.55, `rgba(0, 0, 0, ${strength * taper * 0.35})`],
          [1, 'rgba(0, 0, 0, 0)'],
        ])
        // Wander, so lanes curve and fork instead of running straight.
        heading += (rand() - 0.5) * 0.22
        u = wrap(u + Math.cos(heading) * stride)
        v += Math.sin(heading) * stride
      }
    }
    // Bok globules: small knots of denser dust. They have to stay faint —
    // pushed any harder they stop reading as dust and start reading as holes
    // punched in the picture.
    for (let i = 0; i < 14; i++) {
      const a = 0.12 + rand() * 0.14
      blob(
        (rand() - 0.5) * span,
        gauss() * reach * 0.4,
        reach * (0.02 + rand() * 0.05),
        0.4 + rand() * 0.5,
        rand() * TAU,
        [
          [0, `rgba(0, 0, 0, ${a})`],
          [0.5, `rgba(0, 0, 0, ${a * 0.45})`],
          [1, 'rgba(0, 0, 0, 0)'],
        ],
      )
    }
    lc.globalCompositeOperation = 'source-over'
  }

  /* -- Near stars, drawn live ---------------------------------------------- */

  const stars = Array.from({ length: count(c, 150, 380) }, () => {
    const inBand = rand() < 0.55
    let u: number
    let v: number
    if (inBand) {
      u = (rand() - 0.5) * span
      v = gauss() * reach * 0.7
    } else {
      // Seeded in screen space and converted back, so the foreground sky is
      // not mostly parked outside the viewport.
      const dx = rand() * c.width - cx
      const dy = rand() * c.height - cy
      u = dx * cosT + dy * sinT
      v = -dx * sinT + dy * cosT
    }
    // Brightness runs steeply: a few standouts, a long tail of faint ones.
    const mag = rand() ** 2.4
    return {
      u,
      v,
      r: 0.45 + mag * 1.5,
      glare: mag > 0.62,
      spike: mag > 0.86,
      // Nearer stars drift faster than the band behind them.
      drift: 7 + mag * 9,
      phase: rand() * TAU,
      rate: 0.4 + rand() * 1.1,
      color: night
        ? STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)]
        : c.colors.ink,
    }
  })

  let offset = 0

  return {
    draw(dt) {
      offset = (offset + 3.5 * dt) % span

      c.ctx.save()
      c.ctx.translate(cx, cy)
      c.ctx.rotate(TILT)
      c.ctx.globalAlpha = c.opacity * (night ? 0.95 : 0.8)
      // Two blits: the strip repeats, so one copy always covers the gap the
      // other leaves behind as it scrolls.
      c.ctx.drawImage(layer, -half + offset - span, -reach, span, reach * 2)
      c.ctx.drawImage(layer, -half + offset, -reach, span, reach * 2)
      c.ctx.restore()

      for (const s of stars) {
        s.u = wrap(s.u + s.drift * dt)
        s.phase += dt * s.rate
        const x = worldX(s.u, s.v)
        const y = worldY(s.u, s.v)
        // Wrapping only handles u, so anything off to the side is skipped
        // rather than painted where nobody can see it.
        if (x < -12 || x > c.width + 12 || y < -12 || y > c.height + 12) continue

        // Shallow, slow twinkle. Anything stronger looks like a fault.
        const twinkle = 0.78 + Math.sin(s.phase) * 0.22

        // Bloom is a property of light, not of ink: on paper the same halo
        // just reads as a dirty smudge around the star.
        if (s.glare && night) {
          const halo = c.ctx.createRadialGradient(x, y, 0, x, y, s.r * 7)
          halo.addColorStop(0, alpha(s.color, 0.5))
          halo.addColorStop(1, alpha(s.color, 0))
          c.ctx.globalAlpha = c.opacity * 0.5 * twinkle
          c.ctx.fillStyle = halo
          c.ctx.beginPath()
          c.ctx.arc(x, y, s.r * 7, 0, TAU)
          c.ctx.fill()
        }

        c.ctx.globalAlpha = c.opacity * 0.9 * twinkle
        c.ctx.fillStyle = s.color
        c.ctx.beginPath()
        c.ctx.arc(x, y, s.r, 0, TAU)
        c.ctx.fill()

        if (!s.spike) continue
        const len = s.r * 9
        c.ctx.globalAlpha = c.opacity * 0.3 * twinkle
        c.ctx.strokeStyle = s.color
        c.ctx.lineWidth = 0.7
        c.ctx.beginPath()
        c.ctx.moveTo(x - len, y)
        c.ctx.lineTo(x + len, y)
        c.ctx.moveTo(x, y - len)
        c.ctx.lineTo(x, y + len)
        c.ctx.stroke()
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
  astronaut,
  websling,
  galaxy,
}

export const CANVAS_EFFECTS = Object.keys(FX) as CanvasEffect[]

export function isCanvasEffect(id: string): id is CanvasEffect {
  return id in FX
}
