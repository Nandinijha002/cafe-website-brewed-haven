# Brewed Haven — Backend API & Admin Panel

Node.js + Express backend for the Brewed Haven café website (Old Faridabad).
Handles **reservations**, **menu management**, and **contact messages**, with
a built-in **admin panel** to manage everything.

No external database server is required — data is stored in simple JSON
files under `db/data/` using a tiny built-in datastore (`db/jsonStore.js`).
This keeps setup to just `npm install` with zero native dependencies. You
can swap in MySQL/PostgreSQL/MongoDB later without changing the routes much,
since every route talks to the database only through `db/jsonStore.js`.

---

## 1. Folder Structure

```
cafe_backend/
├── server.js              ← app entry point
├── package.json
├── .env                   ← your local config (PORT, JWT_SECRET)
├── .env.example
├── db/
│   ├── jsonStore.js        ← mini JSON-file database engine
│   ├── seed.js             ← populates starter menu + admin login
│   └── data/                ← auto-created; holds menu.json, reservations.json, etc.
├── middleware/
│   └── auth.js              ← JWT verification middleware
├── routes/
│   ├── auth.js              ← POST /api/auth/login
│   ├── menu.js               ← /api/menu (CRUD)
│   ├── reservations.js       ← /api/reservations (CRUD)
│   └── contact.js            ← /api/contact (CRUD)
└── public/admin/             ← static admin panel (HTML/CSS/JS)
    ├── index.html
    ├── admin.css
    └── admin.js
```

---

## 2. Setup

```bash
cd cafe_backend
npm install
npm run seed      # creates starter menu items + admin login
npm start         # starts the server on http://localhost:5000
```

For auto-restart on file changes during development:
```bash
npm run dev
```

**Default admin login:** `admin` / `Admin@123`
⚠️ Change this password after first login (see Section 5).

---

## 3. Connecting Your Frontend Website

In your website's `script.js`, change the reservation form's `submitForm()`
function to POST to the API instead of just showing a success message:

```js
async function submitForm() {
  // ...your existing validation...

  const payload = {
    name: document.getElementById('fname').value,
    phone: document.getElementById('fphone').value,
    email: document.getElementById('femail').value,
    date: document.getElementById('fdate').value,
    time: document.getElementById('ftime').value,
    guests: document.getElementById('fguests').value,
    message: document.getElementById('fmsg').value,
  };

  const res = await fetch('http://localhost:5000/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    document.getElementById('formSuccess').style.display = 'block';
  } else {
    const err = await res.json();
    alert(err.errors?.[0]?.msg || 'Something went wrong.');
  }
}
```

To load menu items dynamically instead of hardcoding them in HTML:
```js
const items = await fetch('http://localhost:5000/api/menu?category=coffee').then(r => r.json());
```

---

## 4. API Reference

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns a JWT. Body: `{ username, password }` |

### Menu
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/menu` | Public | List all items. Optional `?category=coffee` |
| GET | `/menu/:id` | Public | Get one item |
| POST | `/menu` | Admin | Create item |
| PUT | `/menu/:id` | Admin | Update item |
| DELETE | `/menu/:id` | Admin | Delete item |

Categories: `coffee`, `fastfood`, `desserts`, `beverages`, `specials`

Menu item shape:
```json
{
  "name": "Cappuccino",
  "category": "coffee",
  "description": "Velvety and smooth.",
  "price": 200,
  "image": "https://...",
  "available": true
}
```

### Reservations
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/reservations` | Public | Submit booking from website form |
| GET | `/reservations` | Admin | List all. Optional `?status=pending` |
| GET | `/reservations/:id` | Admin | Get one |
| PUT | `/reservations/:id` | Admin | Update status: `pending/confirmed/completed/cancelled` |
| DELETE | `/reservations/:id` | Admin | Delete |

Reservation shape (request body):
```json
{
  "name": "Aanya Sharma",
  "phone": "+919876543210",
  "email": "aanya@example.com",
  "date": "2026-06-25",
  "time": "19:00",
  "guests": "2 People",
  "message": "Window seat please"
}
```

### Contact Messages
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/contact` | Public | Submit a contact message |
| GET | `/contact` | Admin | List all messages |
| DELETE | `/contact/:id` | Admin | Delete a message |

### Auth header for admin routes
```
Authorization: Bearer <token>
```

---

## 5. Admin Panel

Visit: **http://localhost:5000/admin**

Features:
- Secure login (JWT, 8-hour session)
- Dashboard with live stats (reservations, pending count, menu count, messages)
- Reservations table — filter by status, update status inline, delete
- Menu management — add/edit/delete items with image URL, price, availability toggle
- Contact messages — view and delete

**To change the admin password:** the seed script only creates the account
if one doesn't already exist. To reset it, delete `db/data/admins.json` and
edit the password in `db/seed.js` before running `npm run seed` again — or
add a "change password" endpoint later if needed.

---

## 6. Security Notes

- Passwords are hashed with `bcryptjs` — never stored in plain text.
- Admin routes are protected by JWT (`jsonwebtoken`), verified in `middleware/auth.js`.
- All inputs are validated with `express-validator` before touching the database.
- Change `JWT_SECRET` in `.env` to a long random string before deploying anywhere public.
- This JSON-file datastore is great for learning/small projects but isn't built
  for high concurrency — for a real production deployment, migrate to a proper
  database (PostgreSQL/MySQL/MongoDB) using the same route structure.

---

## 7. Deployment Tips

- Set `PORT` and `JWT_SECRET` as environment variables on your host (Render, Railway, etc.)
- Make sure `db/data/` is writable, or mount a persistent volume there
- Update the frontend's `fetch()` URLs from `http://localhost:5000` to your deployed API URL
- Enable HTTPS in production (most hosts do this automatically)