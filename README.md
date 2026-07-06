# IT Support Help Desk (Next.js + Supabase)

A modern rewrite of the BRAC IT support help desk, built with Next.js 14 and Supabase.

## What's included in v1

- Google SSO sign-in (restricted to `@brac.net`)
- Automatic bootstrap: the first user to sign in becomes admin
- Admin panel for managing engineers and floors
- Ticket creation with BRAC HR Portal PIN lookup
- File attachments on tickets (Supabase Storage)
- Dashboard with stats and recent tickets
- All-tickets list with filters (month, status, search, "mine")
- Ticket detail page with status / assignee updates
- Dark / light theme

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + Google OAuth |
| Storage | Supabase Storage (private bucket) |
| Hosting | Vercel |

## 1. Create a Supabase project

1. Go to https://supabase.com/dashboard and create a new project.
2. Note down:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) — keep this secret!

## 2. Run the schema

In Supabase → SQL Editor, paste and run `supabase/schema.sql`.

This will create:
- Tables: `engineers`, `floors`, `tickets`, `ticket_attachments`
- RLS policies (engineers/floors/tickets/attachments)
- A trigger that bootstraps the first admin when a user signs in
- Helper functions `current_engineer()` and `is_admin()`

## 3. Create the Storage bucket

1. Supabase → Storage → **New bucket**
2. Name: `ticket-attachments`
3. Public bucket: **OFF** (private)
4. File size limit: 10 MB
5. Allowed MIME types: leave empty (or restrict to images/pdfs)

Then run the policies from `supabase/storage.sql` (uncomment first).

## 4. Configure Google OAuth

1. Google Cloud Console → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Authorized JavaScript origins:
   - `http://localhost:3000` (dev)
   - `https://your-domain.vercel.app` (prod)
4. Authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret into Supabase → Authentication → Providers → Google.

In Supabase, also add the redirect URL allow-list:
- `http://localhost:3000/auth/callback`
- `https://your-domain.vercel.app/auth/callback`

## 5. Local development

```bash
cp .env.example .env.local
# Fill in the three values from step 1

npm install
npm run dev
```

Open http://localhost:3000.

The **first** `@brac.net` user to sign in becomes admin automatically (via DB trigger).

## 6. Deploy to Vercel

1. Push the folder to GitHub.
2. Import the repo into Vercel.
3. Set the three environment variables in Vercel project settings.
4. Add `NEXT_PUBLIC_SITE_URL` (e.g., `https://helpdesk.brac.net`) if you set up a custom domain.
5. Deploy.

## Security notes

- Login is enforced to `@brac.net` only (middleware + OAuth `hd=brac.net` hint).
- Row-level security on every table.
- Attachment bucket is private; downloads use 10-minute signed URLs.
- Admin-only operations (delete, password/role changes) are checked via `is_admin()`.

## Project structure

```
app/
  (app)/                 # Protected layout (sidebar)
    dashboard/           # Stats + recent tickets
    new-ticket/          # PIN lookup + ticket form
    tickets/             # List + filters
    tickets/[id]/        # Detail + status updates
    admin/               # Engineers + floors
  api/
    brac-lookup/         # BRAC HR Portal scraper
    tickets/             # Ticket create + attachment upload
  auth/
    login/               # Sign-in page
    sign-in/             # Triggers Google OAuth
    callback/            # OAuth callback handler
    no-access/           # Account not provisioned
  globals.css
  layout.tsx
  page.tsx               # Redirects
components/
  admin-panel.tsx
  new-ticket-form.tsx
  tickets-table.tsx
  ticket-detail.tsx
  ticket-stats.tsx
  recent-tickets.tsx
  theme-toggle.tsx
  theme-script.tsx
  logout-button.tsx
lib/
  supabase/
    client.ts            # Browser client
    server.ts            # Server component / route handler client
    admin.ts             # Service-role client
  auth.ts                # Session / engineer / admin helpers
  brac.ts                # BRAC HR Portal scraper
  utils.ts               # Helpers
supabase/
  schema.sql             # Tables + RLS + triggers
  storage.sql            # Bucket policies
middleware.ts            # Auth + domain check
```

## v2 features (not in MVP)

- Duty roster calendar
- Feedback email collection
- SLA overdue alerts
- Ticket activity log / comments
- Bulk operations
- Email notifications (Resend)
