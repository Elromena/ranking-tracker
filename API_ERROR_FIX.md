# API Error Fix - "Unexpected token '<'" Issue

## 🔴 The Error You Saw

```
Failed to save configuration: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 🔍 What Was Happening

The error meant the server was returning **HTML** (an error page) instead of **JSON** data. This happens when:
1. The API endpoint crashes
2. Database connection fails
3. Server returns a 500 error page
4. The frontend tries to parse HTML as JSON → crashes

## ✅ What Was Fixed

### 1. Backend API Error Handling (src/app/api/config/route.js)
**Before:**
```javascript
export async function PUT(request) {
  const body = await request.json();
  const operations = Object.entries(body).map(...);
  await prisma.$transaction(operations);
  return NextResponse.json({ ok: true });
}
```
☝️ If anything failed, it would crash and return HTML error page

**After:**
```javascript
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const operations = Object.entries(body).map(...);
    await prisma.$transaction(operations);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
```
☝️ Now returns proper JSON error messages instead of HTML

---

### 2. Frontend API Helper (src/app/page.js)
**Before:**
```javascript
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json(); // ❌ Always tries to parse as JSON, even if it's HTML
}
```

**After:**
```javascript
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  
  // ✅ Check if response is ok first
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP ${res.status}`);
    } catch (e) {
      if (e.message.includes('Unexpected token')) {
        throw new Error(`Server error (${res.status}): Server returned HTML error page`);
      }
      throw e;
    }
  }
  
  // ✅ Check content type before parsing
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON but got ${contentType}`);
  }
  
  return res.json();
}
```

---

### 3. New Health Check Endpoint (src/app/api/health/route.js)
Added a health check to verify database connection:

```javascript
GET /api/health

Response:
{
  "ok": true,
  "status": "healthy",
  "database": "connected",
  "tables": {
    "trackedUrls": 2,
    "config": 10
  },
  "timestamp": "2026-02-09T..."
}
```

---

## 🚀 What To Do Now

### Step 1: Wait for Deployment (2-3 min)
Railway is rebuilding with the fixes.

### Step 2: Test Health Check
```bash
# Check if database is connected
curl https://ranking-tracker-production.up.railway.app/api/health
```

Should see:
```json
{
  "ok": true,
  "status": "healthy",
  "database": "connected",
  "tables": {
    "trackedUrls": 2,
    "config": 10
  }
}
```

### Step 3: Try Saving Configuration Again
1. Go to https://ranking-tracker-production.up.railway.app/
2. Click **Settings**
3. Change any value
4. Click **"💾 Save Configuration"**

**Now you'll see:**
- ✅ Either: `✅ Saved successfully!`
- ❌ Or: A clear error message like `Database connection failed` instead of the cryptic HTML error

---

## 🔍 What Different Errors Mean Now

### ✅ Success:
```
✅ Saved successfully!
```
Everything worked!

### ❌ Database Error:
```
Failed to save configuration: Database connection error
```
Check Railway logs, DATABASE_URL might be wrong

### ❌ Invalid Input:
```
Failed to save configuration: Invalid request body
```
Frontend sent bad data (bug in the code)

### ❌ Server Error:
```
Failed to save configuration: Server error (500): Server returned HTML error page
```
Something crashed on the server. Check Railway logs for stack trace.

---

## 🐛 If It Still Doesn't Work

### Check Health Endpoint First:
```bash
curl https://ranking-tracker-production.up.railway.app/api/health
```

**If health check fails:**
- Database isn't connected
- Check DATABASE_URL in Railway
- Check if Postgres addon is running

**If health check passes but save fails:**
- Open browser console (F12)
- Try to save
- Look for error message
- Share the error message

### Check Railway Logs:
1. Go to Railway dashboard
2. Click on your service
3. Click "Deployments"
4. Click on the latest deployment
5. Check logs for errors

Look for lines like:
```
Error: P2002: Unique constraint failed
Error: P1001: Can't reach database server
```

---

## 📊 How Error Handling Works Now

```
User clicks "Save"
      ↓
Frontend sends PUT /api/config
      ↓
Backend receives request
      ↓
[Try to save to database]
      ↓
  Success?
  ↙     ↘
YES      NO
 ↓        ↓
Return   Catch error
JSON     Return JSON with error
✅       ❌
 ↓        ↓
Frontend checks response
 ↓        ↓
Parse JSON (works now!)
 ↓        ↓
Show success or error message
```

**Before:** If anything failed, server returned HTML → frontend crashed trying to parse it

**After:** Server always returns JSON → frontend can show proper error messages

---

## ✅ What Changed - Summary

| Component | Before | After |
|-----------|--------|-------|
| **Backend PUT** | No error handling, crashes return HTML | Try-catch with JSON error responses |
| **Frontend api()** | Blindly parses response as JSON | Checks status and content-type first |
| **Error Messages** | "Unexpected token '<'" (cryptic) | Clear messages like "Database connection failed" |
| **Health Check** | None | New `/api/health` endpoint |
| **Debugging** | Hard to diagnose | Clear error messages + Railway logs |

---

## 🎯 Testing Checklist

After deployment finishes:

- [ ] Health check returns ok: `curl .../api/health`
- [ ] Settings page loads without errors
- [ ] Can change a value in Settings
- [ ] Click "Save Configuration"
- [ ] See either success message or clear error
- [ ] No "Unexpected token" errors
- [ ] Error messages are helpful

---

## 📝 Files Changed

1. `src/app/api/config/route.js` - Added error handling to PUT endpoint
2. `src/app/page.js` - Enhanced api() helper with validation
3. `src/app/api/health/route.js` - New health check endpoint
4. `API_ERROR_FIX.md` - This documentation

---

## 💡 Why This Matters

**Before:** When something went wrong, you got a cryptic error and no way to diagnose it.

**After:** Clear error messages that tell you exactly what's wrong and how to fix it.

This makes debugging much easier and helps you understand what's happening when things fail.

---

## 🎉 After This Fix

You should be able to:
- ✅ Save configuration successfully
- ✅ See clear error messages if something fails
- ✅ Use health check to verify system status
- ✅ Debug issues using Railway logs
- ✅ No more "Unexpected token '<'" errors

---

Wait ~3 minutes for deployment, then try saving again! 🚀
