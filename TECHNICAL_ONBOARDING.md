# AO3 Skin Generator – Technical Onboarding

Welcome! This document accelerates ramp-up for new contributors. It consolidates architecture, conventions, security constraints, and extension patterns learned while building the multi‑template AO3 Work Skin generator.

## 1. High-Level Purpose
Generate safe, highlightable HTML + scoped CSS for embedding stylized social/chat/search scenes into AO3 works without JavaScript, external fonts, or unsupported tags. Output must remain selectable text (not rasterized images) and accessible.

## 2. Core Principles
- Text-first: Every visual element (tweets, messages, headers) is semantic HTML.
- AO3 compatibility: CSS strictly scoped under `#workskin`; no global resets, no script, iframe, canvas, video tags.
- Security: Sanitization allows only `br`, `b`, `strong`. No inline event handlers.
- Portability: Single copy/paste CSS + HTML blocks; no build step required for readers.
- Extensibility: Each new template adds minimal schema and generator branches.

## 3. Technology Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js + TypeScript | Rapid dev, typed domain model, SSR fallback for sanitizer |
| Styling (App UI) | Tailwind (config in `tailwind.config.cjs`) | Fast internal layout; not emitted to AO3 output |
| Output Styling | Handwritten CSS strings in `generator.ts` | Predictable, optimized, no unused classes |
| Sanitization | DOMPurify (client) + manual escape (SSR) | XSS safety inside AO3 markup |
| Persistence | `localStorage` (see `storage.ts`) | Autosave draft state/session continuity |
| Media | Cloudinary unsigned uploads | Simple avatar/image ingestion w/out OAuth |

## 4. Repository Layout (Relevant Paths)
```
generator/
  README.md                User-facing quick guide
  TECHNICAL_ONBOARDING.md  (this file)
  DEPLOY.md                Deployment specific notes (if present)
  src/
    lib/
      schema.ts            Typed model & defaults
      generator.ts         buildCSS/buildHTML per template
      sanitize.ts          DOMPurify config
      storage.ts           Local save helpers
      imgur.ts             Legacy (replaced by Cloudinary)
    components/
      EditorForm.tsx       Dynamic template controls
      PreviewPane.tsx      Live preview wrapper
      ExportPanel.tsx      Copy to clipboard & instructions
    pages/                 Next.js pages (main app entry)
```

## 5. Domain Model
`SkinProject` aggregates:
- `template`: discriminant union (‘ios’ | ‘android’ | ‘note’ | ‘twitter’ | ‘google’ | ‘instagram’ | ‘discord’ ...)
- `settings`: per-template + shared fields (bubble colors, width, watermark, etc.)
- `messages`: ordered list of `Message` objects (sender metadata, content, attachments, optional `roleColor` for Discord)

Key onboarding tasks: read `schema.ts` to understand new field addition pattern.

## 6. Generation Flow
1. User edits project state via `EditorForm`.
2. `buildCSS(project)` returns scoped stylesheet string for current template.
3. `buildHTML(project)` returns container `<div class="chat ...">` with variations.
4. Export panel surfaces both strings; user copies to AO3.

No runtime dependency exists after export; AO3 simply renders static CSS + HTML.

## 7. Sanitization Rules
Located in `sanitize.ts`:
- Converts newlines to `<br/>`.
- Client: DOMPurify with `ALLOWED_TAGS: ['br','b','strong']`.
- Server fallback: manual entity escaping (supports SSR). Avoid introducing additional tags unless vetted for AO3 safety.

## 8. Adding a New Template (Checklist)
1. Extend `template` union in `schema.ts`.
2. Add any new settings fields (keep optional, add defaults in `defaultProject`).
3. In `generator.ts`:
   - Add CSS builder (`buildXTemplateCSS`) returning a fully scoped string.
   - Branch in `buildCSS` switch.
   - Branch in `buildHTML` for structural differences.
4. Update `EditorForm.tsx` with conditional control panel.
5. Add sensible auto-defaults (color assignments, toggles) when template changes.
6. Update `README.md` (user-facing) and this onboarding doc if architecture changes.
7. Test: create sample project, export, verify highlightability & layout.
8. Security review: confirm no new tags/attributes beyond allowed scope.
9. Commit with descriptive message (`feat: add email thread template`).

## 9. Color & Theming Conventions
- Common fields: `senderColor`, `receiverColor`, `bubbleOpacity`.
- Some templates override color semantics (Twitter ‘senderColor’ powers verified badge & accent hues).
- Discord uses `roleColor` per message (inline style for name). Dark vs light via `discordDarkMode` flag.
- Keep color math inside generator; avoid runtime CSS variables unless necessary for AO3 readability.

## 10. Performance & Size Guidelines
- Strive for < 8KB generated CSS per template.
- Avoid duplicate selectors; each template’s CSS is atomic (no cross-template cascade).
- No external font imports; rely on system stacks for safety and performance.

## 11. Accessibility Notes
- Chat structures: `<dl>` with `<dt>` sender and `<dd>` bubble ensures screen readers announce speaker before content.
- Provide `alt` text for all images/attachments in `Message.attachments`.
- Consider manual ARIA labels for future complex structures (e.g., threaded tweets) if semantics become ambiguous.

## 12. Security Posture
- Sanitizer prevents script injection.
- Avatars & images are externally hosted (Cloudinary). AO3 usually allows `<img>` with remote src; confirm with policy if changed.
- No dynamic JS executes inside AO3—only static rendering.

## 13. Cloudinary Integration
Environment variables (in `.env.local`):
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```
Unsigned uploads return a JSON payload; saved URL placed into `avatarUrl` or attachments.

## 14. Testing Strategy
Manual functional testing per template:
- Create minimal project
- Export CSS/HTML
- Paste into AO3 sandbox/draft
- Verify: highlight text, proper flow, mobile readability
Potential future automated tests: snapshot the exported HTML + CSS for diff regression using Jest/Playwright (not presently implemented).

## 15. Common Pitfalls
| Pitfall | Resolution |
|---------|------------|
| Forgot to add default for new setting | Update `defaultProject.settings` to avoid undefined checks in UI |
| Raw `<script>` or `<style>` in content | Sanitizer strips; ensure UI prevents copy of such tags |
| Template switch loses per-message fields | Maintain message shape; only apply auto-color if missing |
| Bold markup inside suggestions not rendering | Use `*text*` or `<b>text</b>` pattern handled by `applyBoldMarkup` |

## 16. Future Roadmap (Engineering Angle)
- Template abstraction refactor (reduce duplication across bubble chats)
- Emoji alias parsing (e.g., `:smile:` → unicode) with safe whitelist
- Threaded tweet chains (nesting + conversation lines)
- Attachment gallery & multi-image grid (Instagram/Twitter)
- Light/Dark toggle output duplication (optional dual theme block)
- Optional CSS compression pass before export

## 17. Code Style & Conventions
- TypeScript strictness for domain models (`schema.ts`).
- Functional builder pattern (no mutable global state) in `generator.ts`.
- Prefer clear class names (`dc-line`, `tweet`, `instAvatar`) tied to template prefix.
- Avoid commenting generated CSS inline; rely on this doc for explanation.

## 18. Deployment Notes
- Vercel/Netlify config present; static assets served from `public/`.
- Environment variables must be set in hosting platform for Cloudinary to enable uploads.
- Client-only code (DOMPurify) guarded by window checks to prevent SSR failures.

## 19. Contribution Workflow
1. Open issue describing new template or enhancement.
2. Branch off `main`.
3. Implement per checklist (Section 8).
4. Provide screenshot examples (light & dark if applicable).
5. Submit PR—include rationale, security review notes, and any accessibility considerations.

## 20. Quick Reference (Cheat Sheet)
| Task | File(s) |
|------|---------|
| Add setting field | `schema.ts` (interface + defaults) |
| New template CSS | `generator.ts` (`buildXyzCSS`) |
| New template HTML branch | `generator.ts` (`buildHTML`) |
| Editor inputs | `components/EditorForm.tsx` |
| Sanitization rules | `lib/sanitize.ts` |
| Local persistence | `lib/storage.ts` |

## 21. Verification Before Commit
Run through this mini-checklist:
- [ ] Template renders correctly in Preview
- [ ] Exported HTML contains no forbidden tags
- [ ] CSS selectors scoped under `#workskin`
- [ ] README updated (user features)
- [ ] TECHNICAL_ONBOARDING updated if architectural changes
- [ ] No TypeScript errors (`npm run build` passes)

## 22. Glossary
- Work Skin: AO3 feature allowing custom CSS scoped to a work
- Scoped CSS: Restrict selectors under `#workskin` so AO3 safely applies them
- Unsigned Upload: Cloudinary preset allowing uploads without auth tokens

## 23. Getting Started (5-Minute Ramp)
1. `npm install`
2. Populate `.env.local` with Cloudinary settings.
3. Open `schema.ts` & `generator.ts` side-by-side.
4. Start dev: `npm run dev`
5. Create example messages; switch templates; inspect exported output.
6. Add a dummy field & propagate to confirm workflow.

## 24. Support & Questions
Open a GitHub issue with `[onboarding]` prefix for clarifications. Provide environment details and template impacted.

---
Welcome aboard—ship templates responsibly and keep scenes accessible.
