# Troubleshooting: "Missing required parameter: client_id" on Vercel

## Critical: Vite Environment Variables are Build-Time Only

**IMPORTANT**: Vite embeds `VITE_*` environment variables into your JavaScript bundle **at build time**. This means:

1. ✅ You MUST redeploy after adding/changing environment variables
2. ✅ The variable must be set BEFORE the build runs
3. ❌ Just adding the variable in Vercel dashboard is NOT enough - you must redeploy

## Step-by-Step Fix

### 1. Verify Variable is Set Correctly in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Look for `VITE_GOOGLE_CLIENT_ID`
5. **Check these things**:
   - ✅ Variable name is exactly: `VITE_GOOGLE_CLIENT_ID` (case-sensitive, no typos)
   - ✅ Value starts with a number and ends with `.apps.googleusercontent.com`
   - ✅ No quotes around the value (Vercel might add them automatically - remove if present)
   - ✅ No extra spaces before or after the value
   - ✅ Environment is set to **Production** (and Preview if you want it there too)

### 2. Check Current Deployment Status

1. Go to **Deployments** tab
2. Look at the latest deployment
3. Check if it shows "Building" or "Ready"
4. **If the deployment was created BEFORE you added the environment variable, it won't have the variable!**

### 3. Redeploy (This is Critical!)

**Option A: Redeploy from Dashboard**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots** (⋯) menu
4. Click **Redeploy**
5. Make sure **"Use existing Build Cache"** is **UNCHECKED** (so it rebuilds with new env vars)
6. Click **Redeploy**
7. Wait for build to complete (usually 2-5 minutes)

**Option B: Trigger New Deployment**
1. Make a small change to any file (or just add a comment)
2. Commit and push to your Git repository
3. Vercel will automatically build a new deployment with the environment variables

### 4. Verify After Redeployment

1. Wait for deployment to finish (status shows "Ready")
2. Open your Vercel app URL
3. Open browser DevTools Console (F12)
4. Look for the debug log that shows:
   ```
   [DEBUG] Environment check: {
     hasClientId: true,
     clientIdLength: 72,  // or similar number
     clientIdPreview: "123456789-abcdefghij...",
     ...
   }
   ```
5. If `hasClientId: false` or `clientIdLength: 0`, the variable is still not being picked up

## Common Issues

### Issue 1: Variable Set but Not Redeployed
**Symptom**: Variable exists in Vercel dashboard but still getting error

**Solution**: 
- You MUST redeploy after adding environment variables
- Vite variables are embedded at build time, not runtime
- Use "Redeploy" button and make sure build cache is disabled

### Issue 2: Variable Set for Wrong Environment
**Symptom**: Works in Preview but not Production (or vice versa)

**Solution**:
- In Vercel Environment Variables, click on the variable
- Make sure **Production** is checked (and Preview if needed)
- Save and redeploy

### Issue 3: Value Has Extra Characters
**Symptom**: Variable is set but still empty

**Solution**:
- Check for extra spaces: ` VITE_GOOGLE_CLIENT_ID = value` (wrong)
- Should be: `VITE_GOOGLE_CLIENT_ID=value` (correct)
- Check for quotes: `VITE_GOOGLE_CLIENT_ID="value"` (might cause issues)
- Should be: `VITE_GOOGLE_CLIENT_ID=value` (no quotes needed)

### Issue 4: Variable Name Typo
**Symptom**: Variable not found

**Solution**:
- Must be exactly: `VITE_GOOGLE_CLIENT_ID`
- Case-sensitive
- Must start with `VITE_` (Vite only exposes variables starting with this prefix)

## How to Verify Variable is in Build

After redeployment, you can check if the variable was embedded:

1. Open your deployed app
2. Open DevTools > Network tab
3. Find the main JavaScript bundle (usually `index-[hash].js`)
4. Open it and search for your Client ID (first 20 characters)
5. If you find it, the variable was embedded correctly
6. If not, the build didn't pick it up

## Quick Checklist

- [ ] Variable name is exactly `VITE_GOOGLE_CLIENT_ID` (no typos)
- [ ] Value is correct (starts with number, ends with `.apps.googleusercontent.com`)
- [ ] No quotes or extra spaces in value
- [ ] Environment is set to **Production** (and Preview if needed)
- [ ] **Redeployed after adding the variable** (most important!)
- [ ] Build cache was disabled during redeploy
- [ ] Checked browser console for debug logs
- [ ] Verified in Network tab that Client ID is in the bundle

## Still Not Working?

If you've done all the above and it's still not working:

1. **Double-check the variable value**:
   - Copy the Client ID from Google Cloud Console again
   - Make sure it's the full value (usually 70-80 characters)
   - Format: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

2. **Check Vercel build logs**:
   - Go to Deployments > Click on the deployment > View build logs
   - Look for any errors or warnings about environment variables

3. **Try setting it for all environments**:
   - In Vercel, edit the variable
   - Check all three: Production, Preview, Development
   - Save and redeploy

4. **Verify Google Cloud Console**:
   - Make sure your Vercel domain is in "Authorized JavaScript origins"
   - Format: `https://your-app.vercel.app` and `https://*.vercel.app`


