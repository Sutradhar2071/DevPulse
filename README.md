# DevPulse API

Backend API for reporting and managing software issues.

## Live URL

https://devpulse-cyan.vercel.app/

## GitHub Repo

https://github.com/Sutradhar2071/devpulse

---

## Features

- JWT Authentication
- Role-based authorization
- Create, update, delete issues
- Issue filtering & sorting
- PostgreSQL with raw SQL
- Modular Express architecture

---

## Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- pg
- bcrypt
- jsonwebtoken

---

## Setup

```bash
git clone https://github.com/Sutradhar2071/devpulse.git

cd devpulse

npm install
```

Create `.env`

```env
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_Q4s5BjAqSuwf@ep-frosty-sun-aq8rcquu-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=JWT_SECRET=devpulse_secret
```

Run server

```bash
npm run dev
```

---

## API Endpoints

### Auth

```http
POST /api/auth/signup
POST /api/auth/login
```

### Issues

```http
POST /api/issues
GET /api/issues
GET /api/issues/:id
PATCH /api/issues/:id
DELETE /api/issues/:id
```

---

## Query Example

```http
/api/issues?sort=newest&type=bug&status=open
```

---

## Deployment

- Backend: Vercel
- Database: Neon PostgreSQL
