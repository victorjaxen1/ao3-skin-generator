# Imgur API Setup via Postman - Step by Step

## Step 1: Register Application
1. Open your browser and go to: https://api.imgur.com/oauth2/addclient
2. Fill in the form:
   - **Application name:** AO3 Skin Generator
   - **Authorization type:** OAuth 2 authorization with a callback URL
   - **Authorization callback URL:** https://www.getpostman.com/oauth2/callback
   - **Application website:** https://github.com/victorjaxen1/ao3-skin-generator
   - **Email:** [Your email]
   - **Description:** Avatar uploads for AO3 Work Skin Generator

3. Click Submit
4. **IMPORTANT:** Copy and save these two values:
   - Client ID: [Copy this]
   - Client Secret: [Copy this]

## Step 2: Import Imgur Collection into Postman
1. Open Postman
2. Click "Import" button (top left)
3. Select "Link" tab
4. Paste: https://www.postman.com/imgur/workspace/imgur-s-public-workspace/collection/10426680-6b6f1e87-83c3-4c3f-8f0e-cab25d866e2b
5. Click Continue → Import

## Step 3: Test Anonymous Upload (Simple Method)
For anonymous uploads, you don't actually need OAuth! Just use the Client ID.

### In Postman:
1. Create a new request
2. Method: POST
3. URL: https://api.imgur.com/3/image
4. Headers tab:
   - Key: Authorization
   - Value: Client-ID YOUR_CLIENT_ID_HERE
5. Body tab → form-data:
   - Key: image (change type to "File")
   - Value: [Select a small test image]
6. Click Send

If you get a success response with an image link, you're all set!

## Step 4: Add to Your Project
Once you have your Client ID, tell me and I'll add it to your `.env.local` file.

---

## Troubleshooting
If the registration page keeps redirecting you to imgur.com, try:
- Using an incognito/private browser window
- Clearing your cookies for imgur.com
- Accessing directly via: https://api.imgur.com/oauth2/addclient
