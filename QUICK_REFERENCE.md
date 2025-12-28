# ⚡ DEPLOYMENT QUICK REFERENCE

## Your App Structure
```
MindValut/
├── backend/        → API (deploy to Vercel)
├── frontend/       → React App (deploy to Vercel)
└── MongoDB Atlas   → Database (free tier)
```

---

## 3 Things You Need to Do

### 1️⃣ MongoDB Atlas
- Go to: cloud.mongodb.com
- Create FREE cluster
- Add user `mindvault_user`
- Get connection string: `mongodb+srv://mindvault_user:PASSWORD@cluster.mongodb.net/mindvault...`

### 2️⃣ Deploy Backend
- Vercel → New Project
- Root: `backend`
- Env vars:
  - `JWT_SECRET` = any secret string
  - `MONGODB_URI` = your connection string
  - `NODE_ENV` = production
- Get URL: `https://your-backend.vercel.app`

### 3️⃣ Deploy Frontend
- Vercel → New Project
- Root: `frontend`
- Env var:
  - `VITE_API_URL` = your backend URL (no slash)
- Get URL: `https://your-frontend.vercel.app`

---

## Files Already Fixed

✅ `backend/vercel.json` - Deployment config
✅ `frontend/vercel.json` - SPA routing
✅ `frontend/.env.production` - Production env
✅ `frontend/.env.development` - Development env
✅ `backend/src/app.ts` - CORS fixed
✅ `backend/.env` - Local dev config

---

## Environment Variables Summary

**Backend (Vercel):**
```
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindvault?retryWrites=true&w=majority
NODE_ENV=production
```

**Frontend (Vercel):**
```
VITE_API_URL=https://your-backend.vercel.app
```

---

## After Deployment

- Frontend URL: `https://your-frontend.vercel.app`
- Backend URL: `https://your-backend.vercel.app`
- Test: Sign up → Should work ✅

---

## Auto-Deploy on Git Push

```bash
git add .
git commit -m "Update"
git push origin main
```

Vercel auto-deploys!

---

**See FINAL_DEPLOYMENT_INSTRUCTIONS.md for detailed steps**
