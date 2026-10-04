# MENTIS PROJECT STATUS & INSTANT AGENT HANDOFF

**Project Root:** `/Users/atreyaghoshal/.gemini/antigravity/scratch/Mentis`  
**GitHub Repository:** `https://github.com/Atreya21/Mentis`  
**Automated Git Push:** ✅ Active (Token authenticated)

---

## 1. INFRASTRUCTURE & CLOUD STATUS

### Database (MongoDB Atlas)
* **Status:** ✅ Live & Active (512 MB Free M0 Cluster)
* **Access List:** `0.0.0.0/0` (Allowed from anywhere)
* **User:** `atreyaghoshal_db_user`
* **Connection String:**
  `mongodb+srv://atreyaghoshal_db_user:Atreya4tr3y4@cluster0.iw4iaoy.mongodb.net/mentis_db?retryWrites=true&w=majority&appName=Cluster0`

### Backend API (Render)
* **Status:** ✅ Live & Operational (Free Web Service)
* **Service Name:** `mentis-backend`
* **Commit:** `36e4b15` (Clean production dependencies)
* **Live Primary URL:** `https://mentis-backend-a80p.onrender.com`
* **Root Directory:** `backend`
* **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Frontend PWA (Vercel)
* **Status:** ✅ Live & Operational (Hobby Free Tier)
* **Commit:** `560280f`
* **Live Deployment URL:** `https://mentis-chi.vercel.app`
* **Required Env Var:** `REACT_APP_BACKEND_URL="https://mentis-backend-a80p.onrender.com"`
* **Target Custom Domain:** `mentismathematicsfoundation.com`

---

## 2. LEGAL & INCORPORATION STATUS (7:00 PM GMEET)
* **Entity:** Mentis Mathematics Foundation (Section 8 Company)
* **Registered Office:** State of West Bengal, India
* **Statutory Directors/Subscribers:** Strictly Atreya Ghoshal & Aritra Ghoshal (exempting all other members from statutory liabilities)
* **Key Files Prepared in Brain:**
  * `mentis_statutory_moa_inc13.md` (Clean MOA with 8 future-proof objects)
  * `mentis_institutional_framework.md` (Clean Two-Tier Governance chart)
  * `gmeet_discussion_guide.md` (Personal cheat sheet for Atreya)
  * `letter_to_legal_counsel.md` (Post-call briefing letter)

---

## 3. IMMEDIATE NEXT ACTION
Complete Step 3: Deploy `/frontend` to Vercel, attach `REACT_APP_BACKEND_URL`, and map the custom domain `mentismathematicsfoundation.com`.
