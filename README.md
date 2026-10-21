# Makram Distributions — website

The website at [makramdistributions.com](https://makramdistributions.com): vendors submit products, retailers browse the catalog, and the admin panel is where submissions are reviewed.

## Common edits — where to go

| I want to change… | Open this file |
|---|---|
| Phone number, email address, location, business description | `lib/site.ts` |
| Links in the top menu and footer | `lib/site.ts` → `navLinks` |
| Product categories (homepage + submission form) | `lib/site.ts` → `categories` |
| Brand colors (the gold) | `app/globals.css` → the `@theme` block at the top |
| Status names, colors, and the messages vendors see on the tracking page | `lib/status.ts` |
| Homepage text, FAQ, process steps | `app/(website)/page.tsx` — the text is at the top of the file |
| Any other page's text | `app/(website)/<page name>/page.tsx` |
| What all buttons, cards, form fields, and page titles look like | `components/ui.tsx` |
| The top menu / the footer | `components/Navbar.tsx` / `components/Footer.tsx` |
| Products shown on the site | No code needed: Admin panel → Products |
| The price calculator's math (Admin → Price Calculator) | `lib/pricing.ts` |

## How the folders are organized

```
app/
  (website)/        Public pages. The (parentheses) don't appear in the web address,
                    so app/(website)/about/page.tsx is the page at /about
    layout.tsx      Background, top menu, and footer around every public page
  admin/            The admin panel at /admin (has its own sidebar layout)
  api/              Behind-the-scenes code the forms send data to
  globals.css       Brand colors and shared styles
components/         Building blocks used by many pages (buttons, cards, menu, footer)
lib/
  site.ts           Business details, menu links, categories
  status.ts         Submission statuses
  email.ts          Sends all emails (stays quiet when testing on your Mac)
  prisma.ts         Database connection
prisma/
  schema.prisma     The database tables
  seed.mjs          Fake data for the test database
proxy.ts            Keeps the admin panel behind the login
```

## Trying changes on your Mac

```bash
npm install     # first time only
npm run dev     # then open http://localhost:3000
```

Your Mac uses a separate **test database** (the `dev` branch in Neon), set in the `.env` file. Testing never touches real submissions, and no emails are sent; the terminal prints what *would* have been sent instead. To receive them yourself, set `DEV_EMAIL_TO=you@example.com` in `.env`.

To fill an empty test database with fake products and submissions: `npm run db:seed`

## Putting changes live

The live site runs on **Vercel**, which rebuilds automatically whenever the `main` branch on GitHub changes. Work on a separate branch, check it on your Mac, then merge into `main` and push.

The live site's passwords and keys (database, email, file uploads) are stored in Vercel's project settings, not in this code.

## Services used

| Service | What it does |
|---|---|
| Vercel | Runs the live website |
| GitHub | Stores the code |
| Neon | The database (branch `production` = live, `dev` = testing) |
| Cloudinary | Stores files vendors upload |
| Resend | Sends the site's emails |
| GoDaddy | The domain name |
| Google Workspace | The info@ inbox |
