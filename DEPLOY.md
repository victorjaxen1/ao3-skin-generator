# GitHub Setup Instructions

## Step 1: Create GitHub Repository

Go to https://github.com/new and create a new repository:
- Repository name: `ao3-skin-generator`
- Description: `No-code generator for AO3 Work Skins - mobile-responsive Social Media AU templates`
- Visibility: Public
- Do NOT initialize with README (we already have one)

## Step 2: Push Code

Run these commands in your terminal:

```powershell
cd "c:\Users\ROGYNET IT\Downloads\AO3 Skins\generator"
git remote add origin https://github.com/victorjaxen1/ao3-skin-generator.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repo: `victorjaxen1/ao3-skin-generator`
3. Framework Preset: Next.js (auto-detected)
4. Add Environment Variable:
   - Name: `NEXT_PUBLIC_IMGUR_CLIENT_ID`
   - Value: [Your Imgur Client ID]
5. Click Deploy

**Live URL will be:** `https://ao3-skin-generator.vercel.app`

## Alternative: Deploy to Netlify

1. Go to https://app.netlify.com/start
2. Connect GitHub repo: `victorjaxen1/ao3-skin-generator`
3. Build settings (auto-detected from netlify.toml)
4. Add Environment Variable in Site Settings:
   - Key: `NEXT_PUBLIC_IMGUR_CLIENT_ID`
   - Value: [Your Imgur Client ID]
5. Deploy

## Get Imgur Client ID

1. Go to https://api.imgur.com/oauth2/addclient
2. Application name: `AO3 Skin Generator`
3. Authorization type: `Anonymous usage without user authorization`
4. Email: [Your email]
5. Description: `Avatar uploads for AO3 work skin generator`
6. Copy the Client ID and add to Vercel/Netlify environment variables

## Post-Deploy

- Test avatar upload functionality
- Share on Tumblr/AO3 community resources
- Monitor Ko-fi tips (add link to footer once you have account)
