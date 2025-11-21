# AO3 Work Skin Generator

Generate highlightable, accessible AO3 Work Skins for Social Media & Search scenes (iOS, Android/WhatsApp, Note/System, Twitter, Google). Built with Next.js + TypeScript.

## Current Templates
| Template | Purpose | Key Editable Fields |
| -------- | ------- | ------------------- |
| iOS iMessage | Chat bubbles with tails | Sender/Receiver colors, opacity, timestamps, avatars |
| Android/WhatsApp | Chat with green style & neutral layer | Sender/Receiver colors, timestamps, avatars |
| Note/System | Centered narrative/system messages | Color, opacity, timestamps |
| Twitter (Advanced) | 2019 style tweet(s) + optional Quote Tweet | Handle, verified badge, timestamp line, metrics (replies/retweets/likes), context link, quote tweet (avatar/name/handle/verified/text/image) |
| Google / Google Old / Naver | Search bar + suggestions/stats/correction | Engine variant, search term, results count/time, Did‑You‑Mean term, suggestions list |

Each message you enter becomes one tweet in Twitter mode; for Google the first message can serve as the query unless overridden.

## Features
- ✅ Live preview (mobile width toggle 375px) & dark mode simulation
- ✅ No media queries (fluid, AO3-friendly CSS)
- ✅ Automatic `#workskin` scoping for safe AO3 embedding
- ✅ DOMPurify sanitization (allowed tags: `br`, `b`, `strong` only)
- ✅ Local storage autosave (safe refresh / accidental close)
- ✅ Semantic HTML (`<dl>` structure for chats) improves screen reader context
- ✅ One-click copy of generated CSS & HTML blocks
- ✅ Cloudinary unsigned avatar/image uploads (no OAuth complexity)
- ✅ Advanced Twitter metrics + quote tweet embedding
- ✅ Google suggestions dropdown + stats + did‑you‑mean correction + engine variants
- 🔒 CSP & security headers (see `next.config.js`)
- 🧩 Bold markup helper: wrap text in `*stars*` inside suggestions to auto-convert to `<b>`

## Cloudinary Setup (Image / Avatar Uploads)
1. Create account at Cloudinary.
2. Create an unsigned upload preset (e.g. `ao3_avatars`).
3. Add to `.env.local`:
	```
	NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
	NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ao3_avatars
	```
4. Restart build; avatar upload button will store returned URL in each message.

## Quick Start (Dev)
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

If local dev has environment/port collisions you can still run a production build:
```bash
npm run build
npm run start
```

## Exporting & Using On AO3
1. Build your scene, then open the Export panel.
2. Copy CSS: paste into a new Work Skin (Create → Work Skin) under the CSS field. AO3 will prepend `#workskin` automatically; ours is already scoped so it's safe.
3. Copy HTML: paste directly into your chapter text where you want the scene.
4. Avoid adding `<script>` or disallowed tags—generator never emits them.
5. To update: edit externally, replace HTML block in the chapter editor (avoid repeated tiny edits to reduce HTML corruption risk).

## Twitter Template Guidance
- Metrics: toggle visibility; zero values hide individual metrics.
- Verified badge: check box (renders circular blue badge with white check).
- Quote Tweet: enable then fill fields; optional image URL displays below quoted text.
- Context link text: e.g. "192 people are talking about this"; sanitised & styled.
- Each source message becomes a separate tweet for multi-tweet threads.

## Google Template Guidance
- Engine variants: `google` (sans), `google-old` (serif pre-2015), `naver` (Korean variant).
- Results stats: fill Count + Time; empty values hide the line.
- Did You Mean: enter correction term only (auto prefixes label and styling).
- Suggestions: one per line; wrap emphasis in `*stars*` or use `<b>` directly.
- Autocomplete dropdown appears when ≥1 suggestion is provided.

## Security & Accessibility
- Sanitizer strips all tags except `br`, `b`, `strong`; no attributes.
- No inline event handlers or script content in output.
- Logical reading order preserved (sender name → bubble text → time).
- Quote tweet nested structure uses clear class names; consider adding `aria-label` manually if needed.

## Project Structure (Key Files)
```
src/lib/schema.ts       # Types + settings (Twitter/Google fields)
src/lib/generator.ts    # CSS + HTML generation logic per template
src/lib/sanitize.ts     # DOMPurify config (client) + fallback (server)
src/components/EditorForm.tsx  # Template & field controls
src/components/PreviewPane.tsx # Live rendered preview + style injection
src/components/ExportPanel.tsx # Copy buttons for CSS/HTML
```

## Roadmap
- ✅ Phase 1: iOS, Android/WhatsApp, Note/System
- ✅ Phase 2 (partial): Twitter advanced, Google search
- 🔜 Phase 2 continued: Instagram post, Discord chat
- 🔜 Phase 3: Email thread, Tinder card, Newspaper clipping
- 🔍 Future: Threaded tweet chains, inline emoji helper, accessibility ARIA labels

## Contribution Guidelines
1. Fork & branch (`feat/twitter-threading` style names).
2. Keep CSS within `#workskin` scoping only.
3. Avoid adding disallowed AO3 tags or scripts.
4. Submit PR with before/after screenshots of generated HTML.

## Troubleshooting
| Issue | Cause | Fix |
| ----- | ----- | --- |
| Text not bold in suggestions | Missing `*stars*` or `<b>` | Add `*word*` or `<b>word</b>` |
| Avatar not showing | Upload preset misconfigured | Verify Cloud name + unsigned preset |
| Metrics missing | Value zero or Show Metrics unchecked | Enable Show Metrics or set counts |
| Quote tweet block absent | `twitterQuoteEnabled` false | Toggle on & fill required fields |

## License
MIT

---
Inspired by community AO3 work skins (highlightable text approach) to ensure longevity & accessibility versus image-only embeds.
