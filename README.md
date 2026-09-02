<p align="center">
  <img src="./public/logo.png" alt="RepairConnect" width="140" />
</p>

<h1 align="center">🔧 RepairConnect</h1>

<p align="center">
  <strong>On-Demand Technician &amp; Repair Service Marketplace</strong><br/>
  Get verified technicians to your doorstep — in minutes, not days.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-roles">Roles</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-overview">API</a> •
  <a href="#-database">Database</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## ✨ What is RepairConnect?

RepairConnect is a **real-time service marketplace** that connects customers with
**verified, nearby technicians** for repairs and home services — plumbing, electrical,
AC servicing, carpentry, appliance repair, and more.

Inspired by on-demand platforms, RepairConnect flips the traditional model:

- 🧍 A **customer** posts a quick service request and gets matched with available specialists
  near them.
- 🔧 A **technician** goes online, sees live requests in real time, and accepts the ones that
  fit.
- 🛡 A **super admin** manages the entire ecosystem from a central dashboard.

Once a technician accepts, both sides are connected with **live chat, order tracking,
billing, and a full job journey** — from "Searching" all the way to "Finished".

---

## 🚀 Features

### For Customers
- 📲 One-tap service booking with location pickup (Google Maps integration)
- 🕒 **Live order tracking** from request → technician accept → arrival → billing → done
- 💬 Real-time chat with your technician
- 🧾 Digital bill viewer with transparent itemised charges & totals
- 📍 Job history and repeat booking

### For Technicians
- 🟢 **Online/Offline toggle** — orders only appear while you're available
- ⚡ Live incoming request feed with accept/reject
- 🧭 One-tap Google Maps navigation to the customer
- 🔄 Full job journey control (Departed → Reached → Billing → Finished)
- 💰 **Bill editor** — set service charges, add/remove extra charges
- 💬 Chat with clients in real time

### For Super Admin
- 📊 Live overview dashboard with real metrics (users, online techs, revenue…)
- 👥 Manage customers & technicians (create / edit / delete)
- 🛠 Manage services & pricing
- 📦 View, cancel, and audit all orders
- 🧾 Track bills issued & total revenue

### Platform-wide
- 🔐 Secure **role-based access control** (customer / technician / superadmin)
- 🛡 Password hashing & verified technician accounts
- 📱 Fully **mobile-responsive** with a hamburger navigation
- 🎨 Modern light **glassmorphism** UI, no emoji clutter, crisp SVG icons

---

## ⚙️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| **Frontend** | React 19, Vite 6, React Router 7 (BrowserRouter) |
| **Maps**    | Leaflet + Google Maps links |
| **Backend** | PHP 8 (REST-style JSON API) |
| **Database**| MySQL / MariaDB (PDO, prepared statements) |
| **Auth**    | Bcrypt password hashing, session-less token auth |
| **Hosting** | cPanel / shared hosting compatible (`public_html`) |

---

## 👥 Roles

| Role | Access | Home route |
|------|--------|------------|
| **Customer** | Book & track orders, chat, view bills | `/book` |
| **Technician** | Accept live orders, update journey, bill, chat | `/technician` |
| **Super Admin** | Full platform management | `/admin` |

---

## 🏃 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (18+) and npm
- A PHP environment (e.g. [XAMPP](https://www.apachefriends.org/)) with MySQL/MariaDB

### 1. Clone & install
```bash
git clone https://github.com/your-org/repairconnect.git
cd repairconnect
npm install
```

### 2. Configure the backend
The PHP API lives in `api/`. Point `config.php` at your MySQL database by setting the
`DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASS` constants for **your** environment.

### 3. Set up the database
Import the schema + seed data (see [`deploy/repairconnect.sql`](deploy/repairconnect.sql))
into your database. It is designed to import cleanly into any database name and comes with
foreign-key-safe loading.

### 4. Run the frontend (dev)
```bash
npm run dev
```
Open the printed local URL (default `http://localhost:5173`). The dev server proxies
all `/api` calls to the same origin as the site, so the API resolves automatically.

> The default `API_URL` falls back to the **same origin** (`/api`), so the same build works
> in local dev, staging, and production without hard-coding URLs. Production-only values
> live in `.env.production` and are **not** required to run locally.

### 5. Production build
```bash
npm run build
```
Output lands in `dist/` and is ready to deploy to any static host.

---

## 🔌 API Overview

A REST-style JSON API under `api/`. Every response follows a uniform shape:

```json
{ "success": true, "message": "ok", ... }
```

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `signup.php` / `login.php` | POST | Register & authenticate users |
| `services.php` | GET | List available services & pricing |
| `create_request.php` | POST | Customer creates a service request |
| `available_orders.php` | GET | Live requests for technicians |
| `accept_order.php` | POST | Technician accepts / rejects a request |
| `request_status.php` | GET | Poll live request status (tracking) |
| `update_order_status.php` | POST | Advance job journey (departed → … → finished) |
| `orders.php` / `my_requests.php` | GET | List orders per user |
| `cancel_request.php` | POST | Cancel an order |
| `send_message.php` / `get_messages.php` | POST/GET | Real-time chat |
| `bill.php` | GET/POST | Fetch & manage bills + extra charges |
| `tech_status.php` | GET/POST | Technician online/offline |
| `admin_*.php` | GET/POST | Admin dashboards & management |
| `update_profile.php` / `delete_account.php` | POST | Profile & account management |

---

## 🗄 Database

MySQL database with seven tables (fully foreign-key linked):

- **users** — customers, technicians, and admins (`role`, bcrypt password)
- **services** — service catalogue with default pricing
- **service_requests** — orders with lat/lng, address, and lifecycle `status`
- **bills** + **bill_extra_charges** — itemised billing & extras
- **chat_messages** — conversation history
- **technician_services** — which services each technician can handle

The request lifecycle is an enum on `service_requests.status`:

```
recruiting → accepted → departed → reached → billing → finished
      └──────────────→ cancelled / rejected
```

---

## 🚢 Deployment

Fully configured for **cPanel / shared hosting** at the domain root. A ready-to-go
deployment kit lives in [`deploy/`](deploy/):

- **`.htaccess`** — SPA fallback so react-router deep links (`/book`, `/orders`…) never 404,
  plus sensible security headers.
- **`repairconnect.sql`** — foreign-key-safe schema + seed import.
- **`HOW-TO-DEPLOY.md`** — step-by-step cPanel / phpMyAdmin guide.

Run `npm run build`, upload `dist/` to `public_html/`, upload `api/`, import the SQL, and edit
the DB constants in `config.php`. That's it.

> 💡 The production frontend build already targets the **same origin** (`/api`), so no
> per-domain rebuild is ever needed.

---

## 🗺 Roadmap

- [x] Live booking & technician matching
- [x] Real-time chat & order tracking
- [x] Online/offline technician availability
- [x] Itemised billing system (service + extras)
- [x] Full super-admin dashboard & revenue stats
- [x] Mobile-responsive UI
- [ ] Ratings & reviews
- [ ] In-app payments / escrow
- [ ] Notifications (email / SMS / push)
- [ ] Technician verification badges
- [ ] AI-powered request triage

---

## 🛡 Security Notes

- All DB access uses **PDO prepared statements** (SQL-injection safe).
- User passwords are stored as **bcrypt hashes**.
- Role checks (`admin_only`) gate every admin endpoint.
- Sensitive files (`.env`, SQL dumps, credentials) are **excluded from the repository**
  and should never be uploaded to production.

---

## 📄 License

Distributed under the [ISC license](LICENSE).

---

<p align="center">
  Built with 💙 for a faster, more reliable repair experience.<br/>
  <sub>RepairConnect — Verified technicians at your doorstep.</sub>
</p>
