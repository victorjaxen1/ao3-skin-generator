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
- `template`: discriminant union ('ios' | 'android' | 'note' | 'twitter' | 'google' | 'instagram' | 'discord')
- `settings`: per-template + shared fields (bubble colors, width, watermark, platform-specific features)
- `messages`: ordered list of `Message` objects with:
  - Core fields: sender, content, timestamp, avatarUrl, attachments, outgoing
  - Chat-specific: status ('sent' | 'delivered' | 'read'), reaction (emoji string)
  - Discord-specific: roleColor

Key onboarding tasks: read `schema.ts` to understand new field addition pattern.

### Recent Schema Enhancements (Nov 2025)
All templates now feature **platform-specific optimizations** for faster workflows:
- **Chat templates** (iOS/Android): Added contact headers, typing indicators, message reactions, status tracking
- **Twitter**: Collapsible metrics, auto-handle generation, quote tweet support
- **Instagram**: Dedicated post creator with username/caption/location fields
- **Google Search**: Toggle-based stats/corrections, suggestion previews
- **Note**: 4 style variants (system/document/letter/simple), alignment options
- **Discord**: Role color presets, server name, quick-assign buttons

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
| Template-agnostic UI showing irrelevant controls | Hide unrelated fields; use conditional rendering per template |
| Missing platform-specific features | Each template should optimize for its unique workflow patterns |

## 16. Template Optimization Lessons Learned (Nov 2025)

### Key Principle: Platform-Specific Workflows
Each template should be optimized for **its unique use case** rather than forcing all templates through generic controls. This dramatically improves UX and workflow speed for AO3 writers.

### Template-by-Template Insights

#### Twitter Template
**Challenge**: Generic sender/receiver colors didn't match Twitter's single-author model.  
**Solution**: 
- Repurposed `senderColor` as accent color (verified badge, engagement icons)
- Made metrics (likes/RTs/replies) collapsible to reduce clutter
- Auto-generated Twitter handles from sender names
- Added quote tweet section for nested content

**Lesson**: Single-post templates need different color semantics than chat templates.

#### Instagram Template
**Challenge**: Using the messages array felt awkward for single-post creation.  
**Solution**:
- Created dedicated fields: `instagramUsername`, `instagramCaption`, `instagramLocation`
- Added separate avatar/image upload controls
- Made engagement (likes/comments) collapsible with toggle
- Moved post creation to dedicated section instead of message list

**Lesson**: Social media posts aren't conversations—don't force them into chat-like interfaces.

#### Google Search Template
**Challenge**: Stats and corrections were always visible, cluttering simple searches.  
**Solution**:
- Added toggle switches: `googleShowStats`, `googleShowDidYouMean`
- Made `googleQuery` the prominent field (not buried in messages)
- Created visual suggestion preview dropdown
- Separated search-specific controls from generic chat UI

**Lesson**: Search interfaces need query-first design with optional metadata.

#### Note Template
**Challenge**: Single style didn't fit varied use cases (system alerts vs formal letters).  
**Solution**:
- Created 4 style variants: system, document, letter, simple
- Added alignment options: left, center, right
- Simplified message interface (no sender/receiver concepts)
- Each variant has distinct visual identity

**Lesson**: Document templates benefit from style presets rather than granular color controls.

#### Discord Template
**Challenge**: Manual role color input was tedious and error-prone.  
**Solution**:
- Created role color presets with quick-assign buttons
- Added server name field for context
- Implemented dark/light mode variants
- Pre-populated common role colors (admin/mod/member)

**Lesson**: Community platforms need preset systems that match real-world usage patterns.

#### iOS/Android Chat Templates
**Challenge**: Basic chat bubbles lacked modern messaging features.  
**Solution**:
- Added contact headers (name + status)
- Implemented typing indicators with animations
- Added message reactions and status tracking (sent/delivered/read)
- Platform-specific features:
  - **iOS**: "To:" label, "Delivered" indicator, blue bubbles
  - **Android**: Status text, checkmark system (✓/✓✓), Material Design styling

**Lesson**: Chat templates should reflect real platform conventions—iOS and Android users expect different visual languages.

### Cross-Template Patterns

**1. Hide Irrelevant Controls**
Don't show sender/receiver color pickers for single-author templates (Twitter, Instagram, Note). Reduces cognitive load.

**2. Smart Defaults & Auto-Generation**
- Twitter: Auto-generate @handles from sender names
- Instagram: Auto-populate caption field structure
- Discord: Pre-fill common role colors

**3. Collapsible Sections**
Optional metadata (metrics, stats, corrections) should be toggleable, not always visible.

**4. Dedicated Panels**
Each template gets its own option panel in `EditorForm.tsx` with appropriate gradients:
- Twitter: Purple gradient
- Instagram: Pink/orange gradient  
- Google: Blue/red/yellow gradient
- Discord: Purple/indigo gradient
- iOS: Blue gradient
- Android: Green gradient

**5. Progressive Disclosure**
Show basic controls first, advanced features behind toggles or collapsible sections.

### Architecture Decisions

**Why Not Abstract All Chat Templates?**
Initial instinct: create shared `ChatTemplate` component. **Decision: Don't.**  
Reason: iOS, Android, Discord, and Note have fundamentally different conventions. Forcing abstraction creates more conditionals than it saves. Keep each template's CSS/HTML builder separate for clarity.

**Why Dedicated Fields vs Message Array?**
Instagram and Google proved that non-conversational templates shouldn't abuse the messages array. Create dedicated fields (`instagramCaption`, `googleQuery`) for better semantics.

**Status Indicators: Per-Message vs Global?**
Added `Message.status` (sent/delivered/read) as per-message field rather than global setting. Allows realistic chat scenarios where some messages are delivered and others aren't.

### Performance Considerations
- Typing animations use CSS keyframes (no JavaScript)
- Reactions positioned absolutely to avoid layout shifts
- Contact headers use minimal DOM structure
- All platform-specific CSS isolated to template builders

### Future Template Design Guidelines

When adding new templates:
1. **Audit real platform**: Screenshot actual UI, note unique patterns
2. **Identify core workflow**: What's the primary task? (Single post? Conversation? Search?)
3. **Challenge generic fields**: Does "sender/receiver" make sense here?
4. **Create dedicated controls**: Don't reuse chat UI for non-chat templates
5. **Add smart defaults**: Pre-populate what can be inferred
6. **Hide irrelevant**: Conditional rendering is your friend
7. **Test workflow speed**: Can user complete task in <2 minutes?

## 17. Recent Updates (November 2025)

### Platform Asset System
Introduced centralized image hosting for authentic platform icons:
- **Location**: `src/lib/platformAssets.ts`
- **CDN**: Publit.io (https://media.publit.io/file/AO3-Skins-App/)
- **Assets**:
  - Twitter: verified badge, logo, reply/retweet/like icons
  - Instagram: location pin
  - WhatsApp: clock icon (sending), single check (sent), double check (delivered/read)
- **Implementation**: Icons referenced via `PLATFORM_ASSETS` object, rendered as `<img>` tags
- **Note**: No JavaScript fallbacks (onerror handlers) since AO3 doesn't execute JS

### Content Processing Functions
Added text enhancement utilities in `generator.ts`:
- `highlightHashtags(text)`: Wraps hashtags in `<span class="hashtag">` for Twitter blue styling
- `applyBoldMarkup(raw)`: Converts `*text*` to `<b>text</b>` for Google suggestions

### Preview Panel Improvements
Fixed responsive centering issues:
- Added `overflow-auto` to preview container
- Set `maxWidth: '100%'` on workskin div
- Added `margin: '0 auto'` for proper centering
- All templates now stay contained at any zoom level

### Google Search Template Refinement
Rebuilt as unified component for seamless dropdown:
- `.search-container`: Wraps search bar + suggestions as single component
- `.search-bar`: Query text with bottom border when suggestions present
- `.search-bar-solo`: Standalone rounded bar when no suggestions
- **Key fix**: Don't try to join separate components; build as one with conditional structure

### CSS Architecture Updates
**Template-specific enhancements:**
- **iOS**: San Francisco font, dark blur reactions, proper tail shapes with clip-path
- **Android/WhatsApp**: Material Design styling, checkmark system with status tracking
- **Twitter**: Modern X design with rounded cards, hover effects, proper spacing
- **Google**: Authentic shadow system, proper border connections
- **All templates**: Responsive width constraints (`width:90%`, `max-width`, `min-width:200px`)

### Hydration & SSR Fixes
- Replaced `crypto.randomUUID()` with static IDs in `defaultProject()` to prevent SSR mismatches
- PreviewPane loaded with `dynamic(() => import(), {ssr: false})`
- All localStorage operations guarded with SSR checks

### CSP Configuration
Content Security Policy configured in three layers:
1. **next.config.js** (primary): Controls actual headers sent by Next.js
2. **netlify.toml**: CDN-level headers for Netlify deployment
3. **_document.tsx**: Meta tag fallback
- Added `https://media.publit.io` to `img-src` directive

## 18. Future Roadmap (Engineering Angle)
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

### Template-Specific Field Reference (Nov 2025)

**Chat Templates (iOS/Android)**
- `chatContactName`: Contact header name
- `chatShowTyping`: Enable typing indicator
- `chatTypingName`: Name shown with typing bubble
- `iosShowHeader`: iOS "To:" label toggle
- `iosShowDelivered`: iOS "Delivered" status toggle
- `androidCheckmarks`: Android checkmark (✓/✓✓) toggle
- `androidStatusText`: Android status line (e.g., "Online")
- `androidShowStatus`: Toggle Android status visibility
- `Message.status`: 'sent' | 'delivered' | 'read'
- `Message.reaction`: Emoji string per message

**Twitter Template**
- `twitterShowMetrics`: Toggle likes/RTs/replies visibility
- `senderColor`: Repurposed as accent color (not bubble color)

**Instagram Template**
- `instagramUsername`: Post author username
- `instagramCaption`: Post caption text
- `instagramLocation`: Location tag
- `instagramAvatarUrl`: Profile picture URL
- `instagramImageUrl`: Post image URL
- `instagramShowLikes`: Toggle likes count
- `instagramLikesCount`: Number of likes
- `instagramShowComments`: Toggle comments link
- `instagramCommentsPreview`: Comments preview text

**Google Search Template**
- `googleQuery`: Search query text (prominent field)
- `googleSuggestions`: Array of suggestion strings
- `googleShowStats`: Toggle results stats
- `googleStatsText`: Stats line (e.g., "About 1,000 results")
- `googleShowDidYouMean`: Toggle correction
- `googleDidYouMean`: Suggested correction text
- `googleEngineVariant`: 'google' | 'google-old' | 'naver'

**Note Template**
- `noteStyle`: 'system' | 'document' | 'letter' | 'simple'
- `noteAlignment`: 'left' | 'center' | 'right'

**Discord Template**
- `discordRolePresets`: Array of {role, color} objects
- `discordServerName`: Server name for header
- `discordChannelName`: Channel name
- `discordShowHeader`: Toggle header visibility
- `discordDarkMode`: Dark/light theme toggle
- `Message.roleColor`: Per-message role color

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
