# MEA – Ma3an Education Academies website

A full website: public site, "My MEA" parent portal, a teacher portal, and an
admin portal. Accounts, the course catalogue, enrolments, homework,
messages, resources, attendance, assessments, and the contact form are all
genuinely real, backed by **Netlify's own built-in Functions and Blobs
storage** — no third-party account, no API key to paste anywhere, for any
of that. Real verification and password-reset **emails**, and real online
**payments**, are also built in, and each needs one small, optional
third-party service (Resend, and Stripe) — full instructions below.

Every piece of this has been tested end to end with real, independent
browser sessions standing in for a parent, a teacher and an admin acting
completely separately — not just checked in a single tab.

---

## What's real

- **Accounts** — parent self-service sign-up and sign-in; teacher accounts
  created by admin; your own admin login. Password hashing, duplicate-email
  and weak-password checks, brute-force lockout.
- **Real email** (once connected, see Part 3 below) — a genuine "confirm
  your email" link before a new account can sign in, and a genuine
  "forgot password" flow. Without it connected, new accounts are simply
  auto-verified so sign-up still works with zero setup.
- **Payments** — real invoices, generated from actual enrolments, payable online by
  card via Stripe (once connected, see Part 3 below). Without it, invoices still
  work, families just see payment instructions instead of "Pay Now".
- **Sessions** — genuinely persist across devices and browsers.
- **Children** — added and edited for real, per parent.
- **The course and class catalogue** — seeded automatically from the sample
  data the first time admin visits Admin → Courses, then fully editable,
  and visible to every visitor.
- **Enrolments** — a parent's request and admin's approve / decline /
  waitlist / move decision are both real, with server-side seat-capacity
  checks that never trust the browser.
- **Homework** — a teacher sets it, a parent's child submits it, the teacher
  marks it, the parent sees the real feedback.
- **Lesson resources, attendance and assessments** — a teacher records
  them, families see the real result.
- **File storage** — homework submissions are actually stored now (previously
  only the filename was recorded), in your choice of Netlify Blobs (default,
  zero setup), Google Drive, OneDrive, or GitHub — switchable any time in
  Admin → Setup & Integrations, no redeploy needed. See Part 4 below.
- **Messages** — real conversations between parents and staff/teachers.
- **The contact form and Help & Support requests** — visible for real in
  Admin → Support Queue.

**Payments are real, once connected (Part 3 below).** Admin generates
invoices from real enrolments (Admin → Invoices & Payments); families pay by
card via a genuine Stripe Checkout page — card details never touch this
site. Without it connected, invoices still work, just without the online
"Pay Now" button.

**Admin's screens don't update live.** When someone elsewhere submits a new
request, admin won't see it until they click the **Refresh** button on that
page (Enrolments, Support Queue, Parents & Children). This is a deliberate,
simple choice rather than adding real-time syncing.

---

## 1. Deploy on Netlify (step by step)

**This needs a GitHub-connected deploy, not drag-and-drop.** The backend
uses one small package (`@netlify/blobs`), and only a Git-connected deploy
runs `npm install` before building. This is the one real trade-off for
having genuine accounts instead of a browser-only demo.

### Step 1 — Get the code into GitHub
1. If you don't already have one, create a free account at **github.com**.
2. Create a new, empty repository.
3. Upload this project's files so they sit at the **root** of that
   repository (i.e. `public/`, `netlify/`, `package.json` etc. are all at
   the top level, not inside another folder). The easiest way if you're not
   familiar with Git: on the repository's GitHub page, use **Add file →
   Upload files** and drag in everything from this unzipped folder.

### Step 2 — Connect it to Netlify
1. Go to **app.netlify.com** and sign in (or create a free account).
2. **Add new site → Import an existing project**.
3. Choose **GitHub**, authorise Netlify if asked, and pick the repository
   from Step 1.
4. Netlify detects the settings from `netlify.toml` automatically — you
   don't need to type anything into the build settings. Click **Deploy**.
5. Wait for the first deploy to finish (a minute or two).

### Step 3 — Set your admin login
1. In your new site's Netlify dashboard: **Site configuration →
   Environment variables → Add a variable**.
2. Add all three of these (choose your own values, not the examples):
   - `ADMIN_USERNAME` = a username you choose
   - `ADMIN_PASSWORD` = a strong password you choose
   - `SESSION_SECRET` = any random string of 32+ characters — generate one
     at **randomkeygen.com**, or run `openssl rand -hex 32`
3. **Deploys → Trigger deploy → Deploy site**, so the new values take effect.

### Step 4 — Sign in
Open your site (Netlify gives you a `*.netlify.app` address — add your own
domain later under **Domain management**), go to `/#/account/sign-in`, and
sign in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you just set.

### Step 5 — Bring the catalogue to life
Go to **Admin → Courses**. The first time you visit, the site automatically
copies the sample course and class catalogue into your real database.
Replace the sample names, fees and times with your real offering whenever
you're ready.

### Step 6 — Add a real teacher (whenever you're ready)
Go to **Admin → Content → Teacher accounts**. Fill in their name, email and
a password, and share those details with the teacher yourself — there's no
self-service sign-up for staff. Then go to **Admin → Classes**, edit a
class, and assign it to them.

All of the above is also explained inside the site itself, in **Admin →
Setup & Integrations**, with copy-to-clipboard buttons for the exact values.

### Trying it without deploying anything
`npm install` then `npm run preview` runs the whole site locally — public
pages, portals, and the real backend together — at `http://localhost:8790`,
using a temporary in-memory store that resets each time you stop it. Handy
before pushing to GitHub at all.

---

## 2. Connect real email (optional, ~5 minutes)

Without this, new accounts are auto-verified with no email sent, and
password reset isn't available — **everything else works fine without it**.
This uses **Resend**, a transactional email service with a free plan (no
credit card needed to start, generous enough for a site this size).

### Step 1 — Get an API key
1. Create a free account at **resend.com**.
2. Go to **API Keys → Create API Key**, and copy it (starts with `re_`).

### Step 2 — Connect it
In Netlify: **Site configuration → Environment variables → Add a variable**:
```
RESEND_API_KEY=re_your_key_here
```
This alone works immediately — email sends from Resend's own shared test
address (`onboarding@resend.dev`), which is fine for trying it out.

### Step 3 — Send from your own domain (recommended before real families use this)
1. In Resend, go to **Domains → Add Domain** and follow their instructions
   to verify a domain you own (adding a couple of DNS records — Resend
   walks you through it).
2. Once verified, add a second environment variable in Netlify:
```
EMAIL_FROM=Ma3an Education Academies <hello@yourdomain.com>
```

### Step 4 — Redeploy
**Deploys → Trigger deploy**, so the site picks up the new values. From
then on, sign-up sends a real verification email, and "forgot password"
sends a real reset link.

This is also explained inside the site itself, in **Admin → Setup &
Integrations**, with copy-to-clipboard buttons for the exact values.

---

## 3. Connect Stripe for online payment (optional, ~10 minutes)

Without this, invoices still work — families just see payment instructions
instead of a "Pay Now" button. This uses **Stripe Checkout**: a hosted
payment page, so card details never touch this site or Netlify at all.

### Step 1 — Get your secret key
In Stripe: **Developers → API keys** → copy your **Secret key** (starts with
`sk_`). Use a **test** key first if you'd like to try it safely — Stripe's
test cards (e.g. `4242 4242 4242 4242`, any future expiry, any CVC) never
charge real money.

### Step 2 — Connect it
In Netlify: **Site configuration → Environment variables → Add a variable**:
```
STRIPE_SECRET_KEY=sk_your_key_here
```

### Step 3 — Set up the webhook
This is how Stripe tells the site a payment actually succeeded.
1. In Stripe: **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://yoursite.netlify.app/api/stripe-webhook`
   (use your real site address).
3. Listen for event: `checkout.session.completed`.
4. Stripe shows a **Signing secret** (starts with `whsec_`) once created — add
   it too:
```
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 4 — Redeploy and try it
**Deploys → Trigger deploy**. Go to **Admin → Invoices & Payments**, generate
this month's invoices, sign in as a parent with a Due invoice, and pay it
with a test card. When you're confident it works, switch
`STRIPE_SECRET_KEY` to your **live** secret key and repeat the webhook step
in live mode (test-mode and live-mode webhooks are separate in Stripe).

This is also explained inside the site itself, in **Admin → Setup &
Integrations**, with copy-to-clipboard buttons for the exact values.

## 4. File storage — Netlify, Google Drive, OneDrive, or GitHub

Right now this covers one thing: homework submission attachments (lesson
resources stay as Drive links your teachers paste in, which already works
with no setup). By default, files are stored in Netlify Blobs — the same
storage backing everything else, no setup needed. You can switch to your
own cloud storage instead, in **Admin → Setup & Integrations → File
storage**, with no redeploy required — it's a runtime setting, not an
environment variable.

**Netlify (default):** always ready, nothing to configure.

**Google Drive:** uses a *service account* — Google's mechanism for
server-to-server access, with no person's login involved. It's its own
robot identity with its own email address, and it can only see a folder
you've explicitly shared with it.
1. In **Google Cloud Console**: create a project (or use one you have),
   enable the **Google Drive API**, then **IAM & Admin → Service Accounts →
   Create Service Account**.
2. Open the new service account → **Keys → Add Key → Create new key → JSON**
   — this downloads a JSON file. Open it and copy the `client_email` and
   `private_key` values.
3. In Google Drive: create (or pick) a folder, share it with that
   `client_email` address (Editor access), and copy the folder's ID from
   its URL (`drive.google.com/drive/folders/`**`THIS_PART`**).
4. In Admin → Setup & Integrations → File storage → Google Drive, paste in
   the service account email, the private key (the whole thing, including
   the `BEGIN/END PRIVATE KEY` lines), and the folder ID. Save, then Test
   connection, then Make active.

**OneDrive:** uses an Azure *app registration* — the Microsoft equivalent
of a service account, not your personal Microsoft login.
1. In the **Azure Portal**: **Microsoft Entra ID → App registrations → New
   registration**.
2. Under **Certificates & secrets**, create a new client secret — copy its
   value immediately (it's only shown once).
3. Under **API permissions**, add **Microsoft Graph → Application
   permissions → Files.ReadWrite.All**, then **Grant admin consent**.
4. Get your **Drive ID**: the drive you want to store files in (a
   SharePoint document library or a specific OneDrive) — your IT admin or
   the Graph Explorer tool (`aka.ms/ge`) can find this for you.
5. In Admin → Setup & Integrations → File storage → OneDrive, paste in the
   tenant ID, client ID, client secret, and drive ID. Save, Test, Make
   active.

**GitHub:** included because it was asked for — worth reading the caveat
shown right on the card before choosing it. Every upload becomes a
permanent commit (the repository only ever grows), there's no per-file
access control, and files are only reachable at their link if the
repository is **public**. Netlify or Drive/OneDrive are a better fit for
family-uploaded files.
1. Create (or pick) a GitHub repository.
2. **Settings → Developer settings → Personal access tokens → Fine-grained
   tokens → Generate new token**, scoped to that one repository, with
   **Contents: Read and write** permission.
3. In Admin → Setup & Integrations → File storage → GitHub, paste in the
   owner, repo name, branch, a folder path (e.g. `uploads`), and the token.
   Save, Test, Make active.

Whichever is active, saved secrets are never sent back to the browser once
saved — the form shows "•••• saved" instead, and leaving a field blank
when saving keeps the existing value rather than clearing it.

## Editing content

Almost everything is editable from the Admin portal, no redeploy needed:
- **Setup & Integrations** — phone, email, WhatsApp, hours, social links,
  sibling discount, the "preview build" footer note
- **Courses / Classes** — add, edit, or hide real courses and classes
- **Enrolments** — approve, decline, waitlist, move class
- **Parents & Children / Support Queue** — real family and enquiry data
- **Content** — FAQs, testimonials, student success stories, teacher
  profiles shown on the About page, and creating real teacher accounts
- **Announcements** — the homepage notice banner and portal announcements
- **Reports** — export

Two things are still edited in code, because they're structural rather than
content: the page layouts themselves, and adding a genuinely new page type.
Ask any time.

## Editing design
- **Colours and fonts:** `public/css/styles.css` — the `:root` block at the top
- **Photos and logo:** replace files in `public/img/`, keeping the same names

---

## Files in this package

```
public/                    everything Netlify serves publicly
  index.html                 the whole site (all pages, one HTML file)
  css/styles.css              colours, fonts, layout
  js/                          the site's code, split into readable files
  img/                          photos and logos
netlify/functions/          the real backend (19 functions)
  register.mjs, login.mjs,     accounts, sessions, teacher accounts,
  logout.mjs, session.mjs,     email verification, password reset
  teachers.mjs, verify.mjs,
  reset.mjs
  children.mjs                  a parent's children / a teacher's roster
  courses.mjs, classes.mjs      the catalogue (public read, admin write)
  enrolments.mjs                 requests, approvals, capacity checks
  homework.mjs, submissions.mjs  set, submit, mark
  resources.mjs                  lesson materials
  messages.mjs                   parent ↔ staff conversations
  attendance.mjs, assessments.mjs  real, teacher/admin recorded
  contact.mjs                    contact form + Support Queue
  admin-directory.mjs            real families, for admin's screens
  invoices.mjs, checkout.mjs,    real billing: generate, pay by card via
  stripe-webhook.mjs             Stripe Checkout, confirm payment
  upload.mjs, file.mjs,          file storage: upload, serve back (Netlify
  storage-settings.mjs           provider only), admin's provider settings
  _lib/storage/                  one file per provider: netlify, gdrive,
                                  onedrive, github — same interface each
  _lib/                          shared logic: password hashing, sessions,
                                  storage, rate limiting, email sending
scripts/test-server.mjs     local preview server (see "Trying it" above)
netlify.toml                 tells Netlify how to build and serve everything
package.json                 the one dependency (@netlify/blobs)
.env.example                 all the environment variables, explained
README.md                    this file
```

---

## Before real families use this site

- Replace every placeholder: course fees, times, teacher names, phone
  number, email, testimonials and success stories are all sample content
  from the original design mockups (once you edit them in Admin, real
  edits save for real).
- Connect real email (Part 2) and send from your own verified domain,
  rather than Resend's shared test address.
- Have the Privacy Policy, Terms, Cookies and Safeguarding pages reviewed
  by a legal or data-protection adviser — the current text is a draft.
- Turn off "Show the preview build note" in Admin → Setup & Integrations
  once the content above is replaced.
- Decide on payments (see "What's real" above) before relying on this for
  real fee collection.
