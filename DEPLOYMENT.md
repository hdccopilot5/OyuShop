# 🚀 Deployment Guide - Render.com

## Step-by-Step Deployment

### 1️⃣ MongoDB Atlas Setup (Database)

1. **Create Account:**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up (FREE)

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose **FREE** (M0 Sandbox)
   - Select region closest to you
   - Cluster Name: `OyuShop`

3. **Setup Access:**
   - Database Access → Add User
     - Username: `oyuadmin`
     - Password: Generate & save it
   - Network Access → Add IP Address
     - Click "Allow Access from Anywhere" (0.0.0.0/0)

4. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string:
     ```
     mongodb+srv://oyuadmin:<password>@oyushop.xxxxx.mongodb.net/babyshop
     ```
   - Replace `<password>` with your actual password

---

### 2️⃣ Deploy Backend (Server)

1. **Go to Render.com:**
   - Sign up at https://render.com
   - Connect your GitHub account

2. **Create Web Service:**
   - Dashboard → New → Web Service
   - Connect repository: `hdccopilot5/OyuShop`
   - Name: `oyushop-backend`

3. **Configure:**
   ```
   Name: oyushop-backend
   Region: Choose closest
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: cd server && npm install
   Start Command: cd server && npm start
   ```

4. **Environment Variables:**
   Click "Advanced" → Add Environment Variables:
   ```
   MONGODB_URI = mongodb+srv://oyuadmin:YOUR_PASSWORD@oyushop.xxxxx.mongodb.net/babyshop
   PORT = 5000
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Get your backend URL: `https://oyushop-backend.onrender.com`

---

### 3️⃣ Update Frontend API URL

Before deploying frontend, update API endpoint:

**Edit `client/src/app.js`, `AdminPanel.js`, `OrdersView.js`, `UserCheckout.js`:**

Replace `http://localhost:5000` with your Render backend URL:
```javascript
// Before:
fetch('http://localhost:5000/api/products')

// After:
fetch('https://oyushop-backend.onrender.com/api/products')
```

---

### 4️⃣ Deploy Frontend (Client)

1. **Create Static Site:**
   - Render Dashboard → New → Static Site
   - Same repository: `hdccopilot5/OyuShop`
   - Name: `oyushop-frontend`

2. **Configure:**
   ```
   Name: oyushop-frontend
   Branch: main
   Root Directory: (leave empty)
   Build Command: cd client && npm install && npm run build
   Publish Directory: client/build
   ```

3. **Deploy:**
   - Click "Create Static Site"
   - Wait 5-10 minutes
   - Get URL: `https://oyushop-frontend.onrender.com`

---

## ✅ Verification

### Test Backend:
```
https://oyushop-backend.onrender.com/api/products
```
Should return JSON data

### Test Frontend:
```
https://oyushop-frontend.onrender.com
```
Should show shop page

### Test Admin:
```
https://oyushop-frontend.onrender.com/admin
Username: admin
Password: 99752020
```

---

## 🔧 Troubleshooting

### Backend Issues:

**"Application failed to start"**
- Check logs in Render dashboard
- Verify MONGODB_URI is correct
- Ensure build command has `cd server`

**"Cannot connect to MongoDB"**
- Check Network Access allows 0.0.0.0/0
- Verify connection string password
- Check database user exists

### Frontend Issues:

**"Cannot fetch products"**
- Verify backend URL in code
- Check CORS settings
- Ensure backend is running

**Build fails:**
- Check build command: `cd client && npm install && npm run build`
- Verify publish directory: `client/build`

---

## 💰 Cost

- **MongoDB Atlas:** FREE (512MB)
- **Render.com:** FREE (with limitations)
  - Backend: Free tier, may sleep after 15 min inactivity
  - Frontend: Always active

**Free tier limitations:**
- Backend may take 30s to wake up after inactivity
- 750 hours/month free

---

## 🔄 Updates

After code changes:

1. Commit to GitHub:
   ```bash
   git add .
   git commit -m "Update message"
   git push origin main
   ```

2. Render will **auto-deploy** both services!

---

## 📞 Support

If deployment fails, check:
1. Render dashboard logs
2. MongoDB Atlas connection
3. Environment variables
4. Build/Start commands

---

## 🎉 Success!

Your shop is now LIVE and accessible worldwide! 🌍

Share your link:
- Shop: `https://oyushop-frontend.onrender.com`
- Admin: `https://oyushop-frontend.onrender.com/admin`
