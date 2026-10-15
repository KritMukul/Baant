# Deploying Dibs to your own server

This gets the app running on a server you control, at an address like `https://krit.website`, so you can test it on real phones.

**What runs:** one Node app (Next.js), one Postgres database, and Caddy in front for automatic HTTPS. Nothing else. No Supabase account is needed (you can still use Supabase's database if you prefer: see Option C).

## Before you start

You need:

- A server you can SSH into (any small VPS is enough) with Docker and the Docker Compose plugin installed.
- A domain (you have `krit.website`) pointing at the server: an **A record** to its public IPv4 address. Ports **80 and 443** open.
- One API key for reading photos: Anthropic, OpenAI or Gemini. (Or none, with `BILL_PARSER=stub`, to click through with a built-in sample bill.)

## Build on your laptop, run on the server (best for small servers)

`next build` is the heavy step: it can use more than a gigabyte of memory, which a small EC2 instance may not have. **Running** the app is light (about 95 MB idle and 130 MB under a burst of requests, measured; Postgres and Caddy add a little more). So build the Docker image on your laptop and send the finished image to the server. The server never builds.

**On the server, once**

1. An Ubuntu 22.04 or 24.04 instance. In its security group allow inbound **22** (your IP only), **80** and **443**. Give it an Elastic IP and point your domain's A record at it.
2. Install Docker with the compose plugin, then log out and back in:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   docker compose version     # after logging back in
   ```
   (Amazon Linux 2023: `sudo dnf install -y docker && sudo systemctl enable --now docker && sudo usermod -aG docker ec2-user`, then install the compose plugin from Docker's releases page. Steps drift, so check Docker's current docs.)

**On your laptop**

1. Install Docker Desktop (Mac or Windows) or Docker Engine (Linux). On Windows, run the commands from a WSL2 terminal.
2. Get the code: `git clone https://github.com/KritMukul/Baant.git dibs && cd dibs && git checkout claude/stoic-cray-tzscj3`.
3. Send it:
   ```bash
   SSH_OPTS="-i ~/.ssh/your-key.pem" scripts/ship.sh ubuntu@<server-ip>
   ```
   (`SSH_OPTS` is whatever you normally pass to `ssh`; leave it out if you log in without a key file.)

   The script asks the server which CPU it has and builds for that (an M-chip Mac building for an Intel server works, just slower), sends the image over ssh, and copies `docker-compose.yml`, the Caddyfile and the schema next to it.
4. The first time it stops and tells you to fill in the server's settings:
   ```bash
   ssh ubuntu@<server-ip>
   cd dibs && nano .env       # DOMAIN, APP_URL, POSTGRES_PASSWORD and one vision key (see the table below)
   docker compose up -d --no-build
   curl https://krit.website/api/health
   ```
5. To update later: `git pull && scripts/ship.sh ubuntu@<server-ip>`. It keeps your `.env` and restarts the app on the new image.

The same thing by hand, if you prefer to see each step:

```bash
docker buildx build --platform linux/amd64 -t dibs:latest --load .      # linux/arm64 for Graviton (t4g) servers
docker save dibs:latest | gzip | ssh ubuntu@<server-ip> 'gunzip | docker load'
tar czf - docker-compose.yml deploy/Caddyfile supabase/schema.sql .env.example | ssh ubuntu@<server-ip> 'mkdir -p dibs && tar xzf - -C dibs'
```

**With a registry instead of ssh** (Docker Hub, GitHub's `ghcr.io`, or AWS ECR): `docker buildx build --platform linux/amd64 -t ghcr.io/<you>/dibs:latest --push .`, set `DIBS_IMAGE=ghcr.io/<you>/dibs:latest` in the server's `.env`, then there `docker compose pull && docker compose up -d --no-build`. The server needs `docker login ghcr.io` once if the image is private.

**Without Docker on the server:** build on the laptop (`npm ci && npm run build`), copy `.next/standalone/` to the server, put `.next/static` inside it at `.next/static` and `public/` beside it, and run `node server.js` with the settings from `.env` as environment variables (Node 22 on the server; you also need a Postgres to point `DATABASE_URL` at). The standalone folder is plain JavaScript, so building on a Mac and running on Linux works.

If something goes wrong:

| What you see | Why | Fix |
|---|---|---|
| `exec format error` when the container starts | Built for the wrong CPU | Run again with `PLATFORM=linux/amd64` or `linux/arm64` to match `uname -m` on the server (`x86_64` is amd64, `aarch64` is arm64) |
| `docker buildx` is not found, or the cross-CPU build fails on a Linux laptop | No emulation set up | `docker run --privileged --rm tonistiivi/binfmt --install all`, then run the script again |
| `permission denied` talking to Docker on the server | Your user is not in the docker group yet | `sudo usermod -aG docker $USER`, log out and back in |
| The script hangs at "Sending it" | Slow upload or an ssh prompt | It is about 100 MB; check you can `ssh` to the server without a password prompt |
| `set POSTGRES_PASSWORD in .env` | `.env` is missing a value | Edit `.env` on the server, then `docker compose up -d --no-build` |
| The browser tab still shows an old icon (a teal ₹ is the very first version) | Browsers cache tab icons per site, apart from the page | Hard-reload (Ctrl/Cmd+Shift+R). If it sticks, clear this site's data or open the site in a private window. Confirm the server is on the new image: `curl -sI https://krit.website/favicon.ico` should return 200, not 404 |

## Option A: Docker Compose, building on the server

Use this if the server has 2 GB of memory or more (or you add swap). Otherwise use the laptop route above.

```bash
git clone https://github.com/KritMukul/Baant.git dibs && cd dibs
git checkout claude/stoic-cray-tzscj3        # or main, once merged
cp .env.example .env
nano .env
```

Set at least these in `.env`:

| Variable | Example | Meaning |
|---|---|---|
| `DOMAIN` | `krit.website` | Caddy gets a certificate for this by itself. Use `:80` to test over plain http by IP first |
| `APP_URL` | `https://krit.website` | The address people open. Used for links, QR codes and secure cookies |
| `POSTGRES_PASSWORD` | a long random string | The database password (only the app can reach the database) |
| `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) | `...` | Reads bills and payment screenshots |

Then:

```bash
docker compose up -d --build
docker compose logs -f app          # Ctrl-C to leave
```

The first start creates the database tables by itself. Check it:

```bash
curl https://krit.website/api/health     # {"ok":true,"store":"postgres"}
```

Open `https://krit.website` on your phone. Update later with `git pull && docker compose up -d --build`.

**Backups:** `docker compose exec -T db pg_dump -U dibs dibs > dibs-backup.sql`

**A first test without a domain:** set `DOMAIN=:80` and `APP_URL=http://<server-ip>`. Everything works except what browsers only allow on HTTPS: copying to the clipboard (a fallback exists), the system share sheet, and installing to the home screen.

## Option B: Node directly (no Docker)

You need Node 22 and a Postgres database you can reach.

```bash
npm ci
cp .env.example .env     # set DATABASE_URL, APP_URL and a vision key
npm run db:init          # creates the tables (safe to run twice)
npm run smoke            # walks a test bill through a whole evening against your database
npm run build
npm start                # listens on port 3000
```

Put Caddy or nginx in front for HTTPS (pass `Host`, `X-Forwarded-Host` and `X-Forwarded-Proto`). With Caddy the whole config is:

```
krit.website {
	reverse_proxy localhost:3000
}
```

To keep it running, use systemd or `pm2`. A systemd unit:

```ini
[Unit]
Description=Dibs
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/dibs
EnvironmentFile=/opt/dibs/.env
ExecStart=/usr/bin/npm start
Restart=always
User=dibs

[Install]
WantedBy=multi-user.target
```

## Option C: Supabase's database instead of your own Postgres

1. In Supabase: **SQL editor**, paste `supabase/schema.sql`, run it. (If you ran the first MVP schema earlier, run `supabase/drop-mvp.sql` first; it deletes the old test bills.)
2. **Project settings, Database, Connection string, URI**. Use the **Session pooler** string if your server has no IPv6 (the direct connection is IPv6-only on the free plan).
3. Put it in `.env` as `DATABASE_URL`. TLS is switched on automatically for `supabase.co` and `supabase.com` hosts.
4. In Docker Compose, delete the `db` service and the `depends_on` block, and keep `DATABASE_URL` from `.env` instead of the built-in line.

## Check that it works

From your machine, with `DATABASE_URL` set to the same database:

```bash
npm run smoke        # creates a test bill, joins two friends, pays, confirms, settles, deletes it
```

If you set a vision key, also check that it can read a real bill (the repo has four photos in `fixtures/bills/`):

```bash
npm run parse-bills      # prints each bill's items, whether they add up, and any row the model was unsure about
```

(The key used while building this was revoked, so the reader was last checked against the live model before the "unsure rows" feature was added. This is the first thing to run with your own key.)

Then the real test, on two phones:

1. Phone A (host): open the site, photograph a bill, add your name and UPI ID, **Scan the bill**. Fix anything on the check screen, then **Share link**.
2. Phone B (friend): open the link (or scan the QR on phone A's screen), type a name, tap items.
3. Phone A: everything claimed, **Lock claims**. Phone B: **Pay** appears with the exact amount.

## The most important test: real UPI payments

Dibs builds a standard `upi://pay?...` link (and a note like `Dibs 7K2 Mukul`). Whether it works depends on the phone and the UPI app, and **I could not test this from here**. Please test before trusting it:

1. Use a small real bill, or just a split of ₹1 to ₹10, and one near ₹1,000.
2. Try **GPay, PhonePe, Paytm and BHIM**, on **Android and an iPhone** (iOS Safari is the least predictable).
3. For each, note: does the app open? Is the amount, payee and note filled in? Is the amount editable? Does it refuse (some apps decline a preset amount to a personal UPI ID)?
4. If nothing opens, Dibs shows a "No UPI app opened" screen with copyable details. Make sure that path is usable.
5. Also try the host's QR scan (the QR on the Share screen is for joining, not paying).

What you find here decides whether the payment screen needs a different design.

## While you are testing publicly

Anyone who finds the address can scan a bill, and every scan costs a vision API call. Dibs limits scans to 20 per IP per hour (`SCAN_LIMIT_PER_HOUR`), but while it is a test you can also put a password on the host's start page. In `deploy/Caddyfile`, inside the site block, before `reverse_proxy`:

```
	@start path /
	basicauth @start {
		you JDJhJDE0JC4uLg...      # from: docker compose exec caddy caddy hash-password
	}
```

Friends' links (`/b/...`) stay open. The start page and its scan request live at `/`, so the password covers both.

## What is and is not verified

Verified here (see `docs/` and the tests): the rules and money maths (106 tests), the same storage contract on memory and on a real Postgres 16, the full flow on phone-sized browsers with a host and three friends, the standalone production server against Postgres, the QR code decoding back to the link.

**Not verified:** a real Supabase project; `docker compose` and `scripts/ship.sh` themselves (Docker was not available here: the script was syntax-checked and dry-run only, and the Dockerfile and compose file are untested; the standalone server they run was); real phones and real keyboards; real UPI apps; the vision models on real bills and payment screenshots beyond the earlier parse tests; HTTPS-only features (clipboard, share sheet, install to home screen) on a real certificate.
