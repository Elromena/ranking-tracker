# Google Search Console Setup Guide
**Complete Step-by-Step Instructions**

---

## 🔴 IMPORTANT: You Have the Wrong Type of Credentials

The file you shared (`client_secret_...json`) is an **OAuth 2.0 client secret** for desktop/web applications. This requires manual browser login every time.

For automated server-side tracking, you need a **Service Account** key, which can access GSC without human interaction.

---

## ✅ STEP-BY-STEP SETUP (10 minutes)

### Step 1: Create a Service Account

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Make sure you're in the right project: **"gsc-mcp-for-claude"**
   - (You should see this in the top dropdown)

2. **Navigate to Service Accounts**
   - Click the ☰ menu (top left)
   - Click **"IAM & Admin"**
   - Click **"Service Accounts"**

3. **Create New Service Account**
   - Click **"+ CREATE SERVICE ACCOUNT"** (blue button at top)
   
   **Page 1 - Service account details:**
   - **Name:** `ranking-tracker-bot`
   - **ID:** (auto-generated) `ranking-tracker-bot`
   - **Description:** `Automated service account for SEO ranking tracker`
   - Click **"CREATE AND CONTINUE"**
   
   **Page 2 - Grant access:**
   - **Skip this step** - Click **"CONTINUE"**
   - (We don't need IAM roles for GSC access)
   
   **Page 3 - Grant users access:**
   - **Skip this step** - Click **"DONE"**

### Step 2: Download the Service Account Key (JSON)

1. **Find Your Service Account**
   - You should now see it in the list: `ranking-tracker-bot@gsc-mcp-for-claude.iam.gserviceaccount.com`
   - Click on it to open details

2. **Create a Key**
   - Click the **"KEYS"** tab at the top
   - Click **"ADD KEY"** dropdown
   - Select **"Create new key"**
   - Choose **"JSON"** format
   - Click **"CREATE"**
   
3. **Download**
   - A JSON file will automatically download to your computer
   - **This is the file you need!**
   - Keep it safe - it's like a password

**Example of what the file should contain:**
```json
{
  "type": "service_account",
  "project_id": "gsc-mcp-for-claude",
  "private_key_id": "1234567890abcdef...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "ranking-tracker-bot@gsc-mcp-for-claude.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/ranking-tracker-bot%40gsc-mcp-for-claude.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### Step 3: Enable Google Search Console API

1. **Go to API Library**
   - In Google Cloud Console, click ☰ menu
   - Click **"APIs & Services" → "Library"**
   
2. **Find and Enable GSC API**
   - In the search box, type: `search console`
   - Click on **"Google Search Console API"**
   - Click **"ENABLE"** (blue button)
   - Wait a few seconds for it to enable

### Step 4: Add Service Account to Google Search Console

This is **CRITICAL** - the service account needs permission to read your GSC data.

1. **Go to Google Search Console**
   - Visit: https://search.google.com/search-console
   - You should see your property (e.g., blockchain-ads.com)

2. **Open Settings**
   - Click on your property to select it
   - Click **"Settings"** (⚙️) in the left sidebar

3. **Add User**
   - Click **"Users and permissions"**
   - Click **"ADD USER"** (blue button)
   
4. **Enter Service Account Email**
   - Paste the email from your JSON file
   - Example: `ranking-tracker-bot@gsc-mcp-for-claude.iam.gserviceaccount.com`
   - Select **"Full"** permission (important!)
   - Click **"ADD"**

5. **Wait a Few Minutes**
   - Changes can take 2-3 minutes to propagate
   - Don't test immediately - wait at least 2 minutes

### Step 5: Configure Railway Environment Variables

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project: `ranking-tracker`

2. **Open Variables**
   - Click on your service (the one running the app)
   - Click the **"Variables"** tab

3. **Set GSC_CREDENTIALS**
   - Click **"+ New Variable"**
   - **Name:** `GSC_CREDENTIALS`
   - **Value:** Paste the **ENTIRE contents** of your service account JSON file
   - It should be one long line or properly formatted JSON
   - Click **"Add"**

**Important:** Copy the ENTIRE JSON file content, including the curly braces `{ }`. It should look like:
```
{"type":"service_account","project_id":"gsc-mcp-for-claude","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"ranking-tracker-bot@gsc-mcp-for-claude.iam.gserviceaccount.com",...}
```

4. **Set GSC_PROPERTY (We'll do this next using the app)**

### Step 6: Find Your GSC Property URL (Using the App)

Instead of guessing the property URL, let's use the app to list all available properties!

1. **Wait for Railway to Redeploy**
   - After setting GSC_CREDENTIALS, Railway will redeploy (2-3 minutes)
   - Check deployment status in Railway dashboard

2. **Go to Your App Settings**
   - Visit: https://ranking-tracker-production.up.railway.app/
   - Click **"Settings"** in the sidebar

3. **List Your GSC Sites**
   - In the "Data Sources" section
   - Click **"📋 List My GSC Sites"** button
   - Wait a few seconds

4. **You Should See Your Sites:**
   ```
   ✅ Found 2 GSC properties
   Service Account: ranking-tracker-bot@gsc-mcp-for-claude.iam.gserviceaccount.com
   
   Available properties:
   
   ┌──────────────────────────────────┐
   │ https://blockchain-ads.com       │
   │ Permission: siteOwner            │
   │ [Use This] button                │
   └──────────────────────────────────┘
   
   ┌──────────────────────────────────┐
   │ sc-domain:blockchain-ads.com     │
   │ Permission: siteOwner            │
   │ [Use This] button                │
   └──────────────────────────────────┘
   ```

5. **Click "Use This" on Your Property**
   - Choose the one you want (usually the `https://` one)
   - It will automatically fill the GSC Property field
   - Click **"Save Configuration"** at the bottom

6. **Add GSC_PROPERTY to Railway**
   - Copy the property URL you selected
   - Go back to Railway → Variables tab
   - Add new variable:
     - **Name:** `GSC_PROPERTY`
     - **Value:** (e.g., `https://blockchain-ads.com`)
   - Click **"Add"**

### Step 7: Test the Connection

1. **Wait for Railway to Redeploy Again** (2-3 minutes)

2. **Test GSC Connection**
   - Go back to your app Settings page
   - Click **"🔍 Test GSC Connection"** button
   - You should see:
   ```
   ✅ GSC Connection Working!
   Service Account: ranking-tracker-bot@gsc-mcp-for-claude.iam.gserviceaccount.com
   Retrieved 150 keywords from GSC
   
   Sample keywords:
   • crypto affiliate programs - Pos: 8.5, Clicks: 23
   • best crypto ads - Pos: 3.2, Clicks: 45
   • blockchain advertising - Pos: 12.1, Clicks: 15
   ```

---

## 🎉 SUCCESS! You're All Set

If the test passed, your GSC integration is working! Now you can:

1. **Backfill Historical Data**
   - Settings → "⏮ Backfill Historical Data"
   - Get 4 weeks of ranking data

2. **Add Your Articles**
   - Dashboard → "+ Add Article"
   - Add URLs you want to track

3. **Let It Run**
   - Weekly cron job runs automatically every Monday
   - Or trigger manually anytime

---

## 🐛 TROUBLESHOOTING

### Error: "Invalid credentials type"
**Problem:** You uploaded an OAuth client secret instead of a service account key

**Solution:**
- Follow Step 1-2 above to create a service account
- Download the JSON key
- Replace GSC_CREDENTIALS with the new JSON

**How to tell the difference:**
- ❌ OAuth client: `"installed": {"client_id": ...`
- ✅ Service account: `"type": "service_account"`

---

### Error: "Permission denied" or "403"
**Problem:** Service account doesn't have access to your GSC property

**Solution:**
1. Go to Search Console → Settings → Users and permissions
2. Add the service account email (from JSON file)
3. Give it **"Full"** permission
4. Wait 2-3 minutes
5. Try again

---

### Error: "No GSC properties found"
**Problem:** Service account isn't added to any GSC properties yet

**Solution:**
- Click "List My GSC Sites" button
- Read the error message - it will show the service account email
- Add that email to your GSC property (Step 4 above)

---

### Error: "GSC_CREDENTIALS not valid JSON"
**Problem:** JSON file wasn't copied correctly

**Solution:**
1. Open the downloaded JSON file in a text editor
2. Select ALL (Cmd+A or Ctrl+A)
3. Copy (Cmd+C or Ctrl+C)
4. In Railway variables, paste the ENTIRE thing
5. Make sure curly braces `{}` are at the start and end

---

### "List My GSC Sites" Shows No Sites
**Cause:** Service account exists but hasn't been added to any GSC properties

**Fix:**
1. The error will show the service account email
2. Copy that email
3. Go to Search Console → Settings → Users
4. Add the email with Full permission
5. Wait 2-3 minutes
6. Click "List My GSC Sites" again

---

## 📋 CHECKLIST

Before testing, make sure you have:

- [ ] Created a service account in Google Cloud Console
- [ ] Downloaded the service account JSON key file
- [ ] Enabled Google Search Console API
- [ ] Added service account email to GSC Users with "Full" permission
- [ ] Waited 2-3 minutes after adding to GSC
- [ ] Copied ENTIRE JSON file contents to Railway GSC_CREDENTIALS variable
- [ ] Used "List My GSC Sites" to find the correct property URL
- [ ] Set GSC_PROPERTY in Railway variables
- [ ] Waited for Railway to redeploy
- [ ] Tested connection with "Test GSC Connection" button

---

## 🔐 SECURITY NOTES

**Service Account Key is Sensitive:**
- It's like a password - don't share it publicly
- Don't commit it to git
- Only store it in Railway environment variables
- If compromised, delete the key in Google Cloud Console and create a new one

**Permissions:**
- Service account only has access to GSC (not other Google services)
- Can only READ data from GSC (not modify)
- Can only access properties where you explicitly added it as a user

---

## 📊 WHAT EACH PROPERTY TYPE MEANS

When you "List My GSC Sites", you might see:

**Domain Property:** `sc-domain:blockchain-ads.com`
- Includes ALL subdomains (www, blog, shop, etc.)
- Includes both http and https
- Most comprehensive

**URL-prefix Property:** `https://blockchain-ads.com`
- Only this exact URL and paths under it
- Separate from http version
- More specific

**Which to use?**
- If you have a domain property, use that (more data)
- Otherwise use the URL-prefix that matches your site

---

## 🎯 NEXT STEPS AFTER SETUP

1. **Test GSC Connection** ✓
2. **Backfill 4 Weeks of Data** (Settings → Backfill)
3. **Add Your Articles** (Dashboard → Add Article)
4. **Review Initial Data** (Check Weekly Report)
5. **Set Alert Thresholds** (Settings → Alert Thresholds)
6. **Let Monday Cron Run Automatically**

---

## 💬 STILL HAVING ISSUES?

Share the exact error message you're seeing and I'll help troubleshoot!

Common info needed:
- Screenshot of error message
- Service account email (from JSON file)
- GSC property URL you're trying to use
- Whether service account is in GSC Users list
