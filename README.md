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

---

## Using the CMS

| Tab              | What you control                                                     |
| ---------------- | -------------------------------------------------------------------- |
| **Profile**      | Name, role, hero intro, about text, contact details, social links, the metrics strip, portrait, résumé PDF, and SEO tags |
| **Projects**     | Add, reorder, publish, or unpublish projects. Each gets its own page at `/work/<slug>` |
| **Experience**   | Your work history timeline                                           |
| **Skills**       | Skill groups and their tags                                          |
| **Awards**       | Certifications and awards                                            |
| **Theme**        | Hero layout, background preset, accent colour, and font pairing — all previewed live |
| **Inbox**        | Messages sent through the contact form, with reply and delete        |

### The Theme tab

| Setting | Options |
| --- | --- |
| **Hero layout** | **Editorial** (type only), **Portrait** (full-bleed photo with your name over it), **Split** (copy left, ring-framed photo right) |
| **Projects section** | **List** (numbered rows), **Grid** (image tiles with caption bars), **Cards** (screenshot + title + stack + buttons) |
| **Skills section** | **Grouped** (label beside tags), **Icon wall** (flat grid of tech logos), **Tiles** (bordered logo cards, still grouped) |
| **Experience section** | **Rows** (dates in a left column), **Timeline** (vertical rail with date chips), **Cards** (panels with an accent edge) |
| **About section** | **Sidebar** (prose + fact card), **Portrait** (tall photo beside prose), **Centered** (round avatar, centred prose) |
| **Certifications** | **Grid** (bordered cards), **List** (hairline rows), **Badges** (pills with an accent seal) |
| **Contact section** | **Split** (pitch left, form right), **Centered** (narrow column), **Cards** (detail tiles above a panelled form) |
| **Background** | Obsidian, Midnight, Slate, Espresso — each ships a matched dark *and* light palette — **plus any palettes you build yourself** |
| **Accent** | Eight swatches plus a custom hex picker. The light theme automatically gets a darkened version so it stays readable on a pale background |
| **Typography** | Inter, Sora, Space Grotesk, Outfit, or Instrument Serif — loaded from Google Fonts on demand |

Both photo layouts have their own **Hero photo** upload. If you haven't set
one, they fall back to your About portrait, and if that's missing too they fall
back to the Editorial layout — the site never renders an empty frame.

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

> If you set the site up before these features existed, run the migrations in
> [`supabase/migrations/`](supabase/migrations/) in order —
> `002-theme.sql`, `003-section-layouts.sql`, `004-sections-and-palettes.sql` —
> in the Supabase SQL editor. Each is safe to re-run, and the Theme tab tells
> you if any are outstanding.

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
