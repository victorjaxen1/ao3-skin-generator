# AO3 Work Skin Generator

**Live MVP:** Generate mobile-responsive, dark-mode-compatible AO3 Work Skins for Social Media AU fics (iOS Messages, Android/WhatsApp, Notes).

## Features
- ✅ Live preview with mobile (375px) and dark mode toggles
- ✅ No media queries (fluid flexbox layout)
- ✅ Automatic `#workskin` CSS scoping
- ✅ DOMPurify sanitization
- ✅ localStorage autosave
- ✅ Semantic HTML (`<dl>/<dt>/<dd>`) for accessibility
- ✅ One-click copy CSS + HTML export
- 🔜 Imgur avatar uploads (requires Client ID)

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and add your Imgur Client ID:

```
NEXT_PUBLIC_IMGUR_CLIENT_ID=your_client_id_here
```

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```
Add `NEXT_PUBLIC_IMGUR_CLIENT_ID` in Vercel dashboard → Settings → Environment Variables.

### Netlify
```bash
npm run build
# Upload .next/ folder or connect GitHub repo
```
Add env var in Netlify dashboard → Site settings → Build & deploy → Environment.

## Security
- DOMPurify sanitizes user content (client-side)
- No inline scripts in generated HTML
- CSP headers recommended (see `next.config.js`)
- Never commit `.env.local`

## Roadmap
- **Phase 1 (MVP):** iOS, Android, Note templates ✅
- **Phase 2:** Discord, Twitter, Instagram templates
- **Phase 3:** Tinder profile, Email, Newspaper layouts

## Contributing
Feedback welcome! Open issues for bugs or feature requests.

## License
MIT
