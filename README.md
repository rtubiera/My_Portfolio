# Portfolio + CMS

A minimalist developer portfolio with a built-in content management system, so
every word, project, and image on the site can be edited from a browser — no
code, no redeploy.

- **Public site** — `/`
- **CMS** — `/admin` (email + password login)
- **Stack** — React 19, TypeScript, Vite, React Router, Supabase, Netlify

---

## How it works

| Layer    | What it does                                                              |
| -------- | ------------------------------------------------------------------------- |
| Supabase | Postgres holds the content, Auth guards the CMS, Storage holds the images  |
| React    | Reads content at page load and renders it                                  |
| Netlify  | Builds and hosts the static site                                           |

Editing content in `/admin` writes to Postgres. Visitors read from the same
tables, so **changes are live the moment you hit Save** — Netlify never has to
rebuild.

If Supabase is unreachable or not yet configured, the site falls back to the
bundled content in [`src/lib/seed.ts`](src/lib/seed.ts). It never renders blank.

---

## Setup

### 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a free project.
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.

   That creates every table, the row-level security policies, the `media`
   storage bucket, and seeds your résumé content. It's safe to re-run — the
   seed block only fires when a table is empty, so it will never overwrite
   edits you make later.

### 2. Create your login

**Authentication → Users → Add user.** Enter an email and password and tick
**Auto Confirm User**. That account is the only thing that can write to the
site.

There is no public sign-up — a new admin can only be created from this
dashboard.

### 3. Point the app at your project

**Project Settings → API** has the two values you need. Create a `.env` file
next to `package.json`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Use the **anon public** key, never the `service_role` key. The anon key is
designed to ship in the browser; row-level security is what actually protects
your data, and it only grants writes to a signed-in user.

### 4. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:5173` for the site and `http://localhost:5173/admin` to
sign in and start editing.

---

## Deploying to Netlify

1. Push this folder to a GitHub repository.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Netlify reads [`netlify.toml`](netlify.toml), so the build command
   (`npm run build`) and publish directory (`dist`) are already set.
4. **Site configuration → Environment variables** — add the same two variables
   from step 3 above.
5. Deploy.

> **The environment variables are required for the CMS to exist in the build.**
> Vite inlines them at build time; without them the admin code is tree-shaken
> out and `/admin` shows a setup screen instead of a login form. If you deploy
> and `/admin` looks like instructions rather than a login box, the variables
> are missing — add them and trigger a redeploy.

The `netlify.toml` redirect rule makes `/admin` and `/work/<slug>` survive a
hard refresh. Without it those paths 404 on a static host.

Netlify sets the `URL` environment variable automatically, which is all the
SEO build step needs. To build with a custom domain elsewhere, set `SITE_URL`.

---

## SEO and link previews

Social unfurlers — LinkedIn, Slack, X, Discord, iMessage — fetch your page and
read the HTML **without executing JavaScript**. Anything the app sets at
runtime is invisible to them.

So [`plugins/seo.ts`](plugins/seo.ts) runs during `npm run build`: it reads
your live content from Supabase and bakes into `index.html`

- `<title>` and `<meta name="description">`
- `og:title`, `og:description`, `og:image`, `og:url`
- `twitter:card` (`summary_large_image` when an image exists, `summary` when
  it doesn't — a large card with no image renders as an empty grey box)
- `<link rel="canonical">` and your uploaded favicon

then emits `sitemap.xml` covering `/` plus every **published** project, and a
`robots.txt` pointing at it.

**The share image** resolves in order: the one you upload under *Profile →
SEO → Share image*, then your hero photo, then your portrait. 1200×630 JPG or
PNG — most platforms reject SVG.

> **The one thing in this CMS that isn't instant.** Everything else goes live
> the moment you save. The SEO card is read at build time, so **redeploy after
> changing it**. The admin panel says so on the card itself.

The build never fails on this: if Supabase is unreachable or the env vars are
missing, it warns and falls back to the static tags already in `index.html`.

---

## Using the CMS

| Tab              | What you control                                                     |
| ---------------- | -------------------------------------------------------------------- |
| **Profile**      | Name, role, hero intro, about text, contact details, social links, the metrics strip, portrait, résumé PDF, and SEO tags including the social share image |
| **Projects**     | Add, reorder, publish, or unpublish projects. Each gets its own page at `/work/<slug>` |
| **Experience**   | Your work history timeline                                           |
| **Skills**       | Skill groups and their tags                                          |
| **Awards**       | Certifications and awards                                            |
| **Theme**        | Hero layout, background preset, accent colour, and font pairing — all previewed live |
| **Applications** | A private job application tracker — company, setup, salary range, interview stage, outcome |
| **Documents**    | A private file bank — COEs, certificates, clearances and contracts, with expiry tracking |
| **Inbox**        | Messages sent through the contact form, with reply and delete        |

### The Theme tab

| Setting | Options |
| --- | --- |
| **Brand** | Logo image, wordmark fallback, and favicon — with a live nav preview |
| **Hero layout** | **Editorial** (type only), **Portrait** (full-bleed photo with your name over it), **Split** (copy left, ring-framed photo right) |
| **Projects section** | **List** (numbered rows), **Grid** (image tiles with caption bars), **Cards** (screenshot + title + stack + buttons) |
| **Skills section** | **Grouped** (label beside tags), **Icon wall** (flat grid of tech logos), **Tiles** (bordered logo cards, still grouped) |
| **Experience section** | **Rows** (dates in a left column), **Timeline** (vertical rail with date chips), **Cards** (panels with an accent edge) |
| **About section** | **Sidebar** (prose + fact card), **Portrait** (tall photo beside prose), **Centered** (round avatar, centred prose) |
| **Certifications** | **Grid** (bordered cards), **List** (hairline rows), **Badges** (pills with an accent seal) |
| **Contact section** | **Split** (pitch left, form right), **Centered** (narrow column), **Cards** (detail tiles above a panelled form) |
| **Background effect** | Fifteen effects — plus intensity, automatic **rotation**, and date **schedules** with one-click holiday presets |
| **Background** | Obsidian, Midnight, Slate, Espresso — each ships a matched dark *and* light palette — **plus any palettes you build yourself** |
| **Accent** | Eight swatches plus a custom hex picker. The light theme automatically gets a darkened version so it stays readable on a pale background |
| **Typography** | Inter, Sora, Space Grotesk, Outfit, or Instrument Serif — loaded from Google Fonts on demand |

Both photo layouts have their own **Hero photo** upload. If you haven't set
one, they fall back to your About portrait, and if that's missing too they fall
back to the Editorial layout — the site never renders an empty frame.

**Brand.** Theme → Brand holds the three identity pieces:

- **Logo** — shown in the nav at 24px tall. There is one logo for both themes,
  so pick an SVG or transparent PNG that reads on a light *and* dark canvas.
- **Wordmark** — the text fallback when no logo image is set (currently `DJT`),
  with a dot in your accent colour appended automatically.
- **Favicon** — the browser tab icon. Square SVG or 512×512 PNG. Tabs are tiny,
  so a single letter beats a full logo.

A nav-sized preview sits above the fields, and uploading a favicon swaps the
CMS tab's own icon immediately so you can judge it at real size. Note that the
favicon is applied after content loads, so a hard refresh briefly shows the
bundled default before yours appears — unavoidable without server rendering,
and invisible on subsequent visits once cached.

**Background effects.** Theme → Background effect adds ambient animation.
Intensity scales both particle count and opacity.

| Effect | Reads as |
| --- | --- |
| **Snow** | Christmas, winter |
| **Hearts** | Valentine's |
| **Bats** | Halloween |
| **Fireworks** | New Year, celebrations |
| **Confetti** | Birthdays, launches |
| **Falling leaves** | Autumn |
| **Petals** | Spring |
| **Fireflies** | Summer evenings |
| **Code rain** | Developer flavour |
| **Spacewalk** | Astronauts tumbling past a moon |
| **Web-slinger** | Figures swinging by on webs, Spider-Man flavour |
| **Milky Way** | The galactic band across the whole page |
| **Stars**, **Constellation**, **Aurora** | Year-round ambience |

All are canvas layers except **Aurora**, which is a slow accent glow.
**Spacewalk** and **Web-slinger** are scenes rather than particle storms —
they draw a handful of large figures, so intensity adds one or two more
instead of filling the screen. **Milky Way** is different again: its band is
tens of thousands of marks, so it is baked once into an offscreen strip that
afterwards scrolls as a single image, and a frame costs two blits plus the
near stars drawn live on top. Each renderer lives in
[`src/lib/effectRenderers.ts`](src/lib/effectRenderers.ts) as a factory that
holds its own state — that is what lets fireworks manage bursts and code rain
manage columns without the simpler effects carrying fields they never use.

Snow, stars and constellation render *in front* of the page — like real snow,
between you and what you're looking at — at low opacity and below the nav.
Aurora renders behind, since a colour wash over body text would hurt
legibility. Colours come from the live theme tokens, so effects follow your
accent and flip with light/dark.

Four things keep it from being a liability:

- `prefers-reduced-motion` disables it outright. Drifting particles are a
  known vestibular trigger, so it is removed rather than merely slowed.
- The animation loop stops when the tab is hidden — a backgrounded portfolio
  should not drain a laptop battery.
- Particle counts scale with viewport area and are hard-capped, so a 4K
  display gets 320 flakes rather than several thousand.
- Device pixel ratio is capped at 2; beyond that the cost buys no visible
  sharpness on soft particles.

**Rotation.** Theme → Background effect → *Rotation* changes the effect
automatically — **minute**, **hourly**, **daily**, **weekly**, or **monthly** —
with no dates to set. Tick which effects are eligible; leaving all of them
ticked uses the lot.

> **Minute** is a testing aid, not a setting to ship. It cycles every 60
> seconds so you can confirm rotation works without waiting a day; the admin
> panel warns you while it is selected. Switch back to Daily before deploying.

The app's re-check interval follows the mode — 15 minutes for calendar rules,
5 seconds on minute mode — so a fast rotation is actually visible rather than
silently correct.

The pick is **deterministic from the date**, not `Math.random()`. That matters:
every visitor on a given day sees the same effect, and it does not change as
someone clicks between pages. Weeks break on Monday.

Rather than hashing each day independently — which clusters, and can repeat
back-to-back — days are grouped into blocks the size of the pool, and each
block is a seeded shuffle of it. So every effect appears **exactly once per
block**, and the one place a repeat could occur, across a block boundary, is
detected and swapped away. Measured over a year with six effects: 0 repeats,
and a 60–61 split across all six.

**Scheduled effects.** Under Theme → Background effect → *Schedules*, a rule
overrides the default effect for a window of the calendar. Three kinds:

| Repeats | Uses | Example |
| --- | --- | --- |
| **Every year** | month + day → month + day | 25 Dec, or 25–30 Dec |
| **Every month** | day → day | the 1st to the 3rd |
| **One time** | date → date | a launch week, never repeating |

**Add holiday presets** creates six annual rules in one click — New Year
(fireworks), Valentine's (hearts), Spring (petals), Autumn (leaves), Halloween
(bats), Christmas (snow). Pressing it twice adds nothing, since it skips
labels that already exist. They are a starting point, not a definitive
calendar: holidays vary by country and belief, and every date, effect and
intensity stays editable.

Ranges may wrap: **28 Dec → 3 Jan** is valid, as is a monthly 28 → 3. When two
rules overlap, the higher **priority** wins (ties break on order, then name,
so the winner never depends on row order coming back from the database).

Dates are evaluated in each **visitor's** local timezone — someone in Manila
and someone in Berlin both see snow on the day their own calendar says 25
December. A tab left open overnight re-checks every 15 minutes, so a schedule
starting at midnight appears without a refresh.

The panel shows what is rendering right now and which rule caused it, plus a
**Preview a date** field so you can check a birthday rule in July.

Two behaviours worth stating outright, because both are deliberate:

- A **29 Feb** annual rule fires only in leap years — it does not roll over to
  1 March.
- A **monthly day 31** rule simply never matches in short months.

**Custom palettes.** Under Theme → Background → *Your palettes*, **New
palette** creates one you can name, edit, and delete. You pick only **two
colours per mode** — a background and a text colour for dark, and the same for
light. Panels, borders, hover states, and the three muted text tiers are all
derived from that pair.

That derivation is the point. Asking for eleven colours is how hand-rolled
themes fall apart — you end up with a border brighter than your body text.
Deriving them guarantees the ramp stays ordered no matter what two colours you
pick. Each mode also shows a live **WCAG contrast readout** (AAA / AA / fails
AA), so an unreadable combination tells you before your visitors find out.

The derivation is covered by invariant checks: token ordering, recessed insets,
and body-text legibility hold across eight background/text pairs, and all four
built-in presets clear WCAG AA in both modes.

**Skill icons.** The icon layouts match logos to your skill names in three
tiers: a real brand mark where one exists, then a category glyph (database,
cloud, testing, security…) matched on keywords, then a lettered badge. The
middle tier matters — simple-icons removed most Microsoft and Amazon marks on
trademark grounds, so SQL Server, Azure and AWS deliberately get an honest
generic glyph rather than a lookalike logo. Of the 64 skills currently in the
database, 63 resolve to an icon.

The brand-logo module is code-split: visitors only download it if you've
actually selected an icon layout.

### The Applications tab

A job hunt tracker that lives behind the login. `job_applications` is the only
table in the schema with **no public read policy** — the anon key the site ships
with cannot see it, and nothing in it is rendered anywhere on the public site.

Each application records the company, role, location, work setup (on-site /
hybrid / remote), a salary range with its currency and period, the date you
applied, where you found it, a contact, the job posting URL, and free notes.

Two fields describe where it stands, and keeping them apart is the whole design:

- **Stage** — how far it got: *Applied → Initial interview → Technical
  interview → Code exam → Assessment → Final interview → Job offer*. It's a
  clickable rail, not a dropdown: click the stage you've reached.
- **Outcome** — how it ended: *In progress, Offer accepted, Rejected, I
  declined, No response*.

One field could not say "reached the final interview, then rejected" — two can,
which is also what makes "which stage do I keep losing at" answerable later. The
rail takes its colour from the outcome, so a rejected application reads as *got
this far, then stopped* at a glance.

Above the list are counts (total, in progress, interviewing, offers, closed),
a filter, and a search across company, role and notes. The sidebar badge counts
only applications still in play. **Export CSV** dumps the whole table.

Set a **Next step** date on anything with an interview booked and the card
header shows how long you've got — *Next in 3 days*. Same autosave as every
other tab: edits save a moment after you stop typing, and immediately if you
alt-tab away.

### The Documents tab

Storage for the paperwork a career leaves behind: certificates of employment,
training certificates, diplomas, clearances, contracts, payslips. Drop files
onto the panel — several at once is fine — and each one becomes a card.

**These files are not public.** They go into their own `documents` storage
bucket, and that bucket, unlike `media`, has no public read policy. An
unguessable URL is not a permission, and a COE carries your name, your employer
and often your salary. Nothing here is readable without a signed-in session:

- **Open** and **Download** mint a signed URL good for two minutes.
- **Copy link** mints one good for an hour, for when HR asks you to send it.

Every link expires on its own, so nothing you hand out stays live, and a
screenshot of this screen leaks nothing.

Each card records a title, what kind of document it is, who issued it, a
reference number, and the dates it was issued and expires. The kind is guessed
from the filename on upload — a file with `coe` in its name lands as a
Certificate of Employment — and is a dropdown you can correct.

Expiry is the point of the dates. Clearances and IDs lapse, and finding that out
in the week you need the document is the problem this prevents: anything inside
60 days is flagged on its card and counted in **Expiring soon** at the top,
anything past its date reads *Expired 30 days ago* in red. Alongside those are
the total count and how much storage the bank is using.

Filter by kind, search across titles, issuers and notes. Deleting a card removes
the stored file too — the file first, so a failure leaves a row you can see and
delete again rather than a file nothing will ever list.

> If you set the site up before these features existed, run the migrations in
> [`supabase/migrations/`](supabase/migrations/) in order — `002-theme.sql`,
> `003-section-layouts.sql`, `004-sections-and-palettes.sql`, `005-brand.sql`,
> `006-share-image.sql`, `007-background-effect.sql`,
> `008-effect-schedules.sql`, `009-effect-rotation.sql`,
> `010-holiday-effects.sql`, `011-rotation-fast-modes.sql`,
> `012-work-carousel.sql`, `013-job-applications.sql`,
> `014-space-and-web-effects.sql`, `015-document-bank.sql` — in the Supabase SQL
> editor. Each is safe to re-run, and the Theme tab tells you if any are
> outstanding.

A few conventions worth knowing:

- **Drafts.** A project with **Published** off stays in the CMS but disappears
  from the public site. Use it to write a case study before it's ready.
- **Reordering.** The up/down arrows on each card set display order. Order is
  part of your unsaved changes, so remember to hit **Save**.
- **Multi-line fields.** Anywhere the hint says "one per line", each line
  becomes its own bullet. Comma-separated fields become tags.
- **Paragraphs.** In the About and Description fields, a blank line starts a
  new paragraph.
- **Adding and deleting** happen immediately — those don't wait for Save.
  Everything else is batched into the Save button.

---

## Design

The theme is "Editorial Mono": an off-black canvas, generous whitespace,
monospace for labels and metadata, hairline rules instead of boxes, and a
single amber accent. Both light and dark themes are hand-tuned rather than
inverted, and the toggle persists.

To change the accent colour, edit `--accent` (and `--accent-ink`,
`--accent-soft`, `--accent-line`) in
[`src/styles/tokens.css`](src/styles/tokens.css). Both theme blocks have their
own values — dark needs a light accent, light needs a dark one for contrast.

---

## Project layout

```
src/
  admin/            The CMS — login, editors, storage upload
  components/       Nav, Footer, Section, Icons
  site/             Public pages — Hero, WorkList, ProjectPage, Home
  lib/              Supabase client, types, content fetching, seed fallback
  styles/           tokens.css → base.css → site.css → admin.css
supabase/
  schema.sql        Run once in the Supabase SQL editor
```

## Scripts

```bash
npm run dev       # dev server with hot reload
npm run build     # typecheck + production build to dist/
npm run preview   # serve the production build locally
npm run lint      # eslint
```
