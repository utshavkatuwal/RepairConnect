# RepairConnect — cPanel Deployment Guide

Deploy the finished app to the **domain root** (`public_html`) on cPanel shared hosting.

## Files in this folder
| File | Purpose |
|------|---------|
| `.htaccess` | SPA fallback (react-router deep links) + security. Upload to `public_html/`. |
| `config.production.php` | Production DB template. Edit, then upload as `public_html/api/config.php`. |
| `repairconnect.sql` | Clean DB import (tables + data, no DB-name dependency). Import via phpMyAdmin. |

> The frontend build is in `../dist/`. It already uses the same-origin `/api` URL — no rebuild needed per domain.

---

## Step 1 — Create the database (cPanel)
1. Go to **MySQL Databases**.
2. Create a database, e.g. `myuser_repairconnect`.
3. Create a user, e.g. `myuser_rcuser`, with a strong password.
4. **Add user to database** with **All Privileges**.
5. Note: DB name → `myuser_repairconnect`, user → `myuser_rcuser`, the password, and DB host (usually `localhost`).

## Step 2 — Import the database (phpMyAdmin)
1. Open **phpMyAdmin** (find it under your domain in cPanel).
2. Select your new database on the left.
3. Go to the **Import** tab.
4. Choose `repairconnect.sql` and click **Go**.
5. You should see 7 tables created: `users`, `services`, `requests`, `bills`, `bill_extra_charges`, `messages`, `technician_services`.

## Step 3 — Upload the built frontend
1. Build is ready in `../dist/`. If you changed any frontend code, rebuild first:
   ```
   npm run build
   ```
2. In cPanel **File Manager**, open `public_html`.
3. Upload **all contents** of `dist/` (especially `index.html` and the `assets/` folder) into `public_html/`.
   - Do NOT upload it as a subfolder — `index.html` must be at `public_html/index.html`.

## Step 4 — Upload the API
1. In File Manager, create folder `public_html/api`.
2. Upload **all** `.php` files from `../api/` into `public_html/api/`.
3. **Important:** overwrite `config.php` with the edited `deploy/config.production.php` (update the 4 DB constants for your cPanel credentials).

## Step 5 — Upload `.htaccess`
1. In File Manager, upload `deploy/.htaccess` to `public_html/`.
2. This enables deep links like `/book`, `/orders`, `/admin` to load the SPA instead of 404ing.

## Step 6 — Update your admin password (optional but recommended)
The seeded admin is `super@repairconnect.com` / `QWERtyHero21`. Change it after logging in, or update in phpMyAdmin.

---

## Do NOT upload
- `C:\xampp\htdocs\repairconnect\idpass.txt` — contains plaintext admin credentials. Never upload it.
- `.env`, `.env.production`, `node_modules/`, `src/`, `package.json`, `api/config.php` from local dev (contains root/no-password creds).

## Test
- Visit `https://yourdomain.com/` → landing page loads.
- `https://yourdomain.com/login`, `/signup`, `/book` → deep links work (no 404).
- Login as admin → dashboard loads with stats (proves DB + API work).
