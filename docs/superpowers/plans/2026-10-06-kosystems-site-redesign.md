# KO Systems Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an independent, responsive KO Systems landing page that preserves the approved scroll-zoom hero, presents four anonymous real projects through fictional demonstrations, explains concrete services, and converts visitors through WhatsApp.

**Architecture:** Keep TanStack Start as the SSR shell and move the landing experience into focused components under `src/features/landing`. Store all portfolio content and fictional records locally, keep each demonstration stateful but network-free, and let `src/routes/index.tsx` remain a thin route adapter. Replace the legacy editor wrapper with the standard TanStack/Vite plugin chain and use npm as the reproducible package workflow already available in this checkout.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router, Vite 8, Tailwind CSS 4, Vitest, Testing Library, jsdom

**Spec:** `docs/superpowers/specs/2026-10-06-kosystems-site-redesign-design.md`

## Global Constraints

- Preserve the current scroll-driven hero behavior and its reduced-motion fallback.
- Show only the four approved projects currently in operation; never expose client names or real business data.
- Use only bundled fictional data in demonstrations and never connect them to real APIs, databases, or repositories.
- Use the navy logo on light surfaces and the light logo on dark surfaces.
- The working tree must contain no former-editor or generative-tool dependency, telemetry, URL, configuration, or attribution.
- Keep published Git history intact; do not amend, rebase, squash, force-push, or rewrite existing commits.
- WhatsApp remains the primary conversion path; do not add a contact form.
- Do not show email or GitHub links until a working mailbox or useful public destination exists.
- Preserve the user's untracked `package-lock.json` contents while adopting and updating it as the npm lockfile.

## Review Focus

- With reduced motion enabled, the hero must reveal the same message and CTA without trapping the visitor in a long scroll sequence; covered in Task 7 browser checks.
- On a touch-width viewport, every project must be selectable without hover and all content must fit without horizontal scrolling; covered in Task 4 component tests and Task 7 browser checks.
- Selecting the non-demo corporate-lines case after a demo case must not leave stale demo controls visible; covered in Task 4 component tests.
- The WhatsApp URL must preserve the Brazilian number and correctly encode the guided Portuguese message; covered in Task 3 unit tests.
- A production artifact must not contain private repository URLs, customer identifiers, editor asset paths, or forbidden attributions; covered in Tasks 1 and 7.

---

### Task 1: Independent Toolchain and Clean Project Baseline

**Files:**
- Create: `scripts/check-project-independence.mjs`
- Create: `tests/project-independence.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `bunfig.toml` or remove it when npm becomes canonical
- Remove: `bun.lock`
- Remove: the hidden legacy-editor metadata directory at the repository root
- Remove: the editor-specific error reporter under `src/lib`
- Modify: `src/routes/__root.tsx`

**Interfaces:**
- Consumes: existing TanStack Start server entry at `src/server.ts` and Tailwind stylesheet at `src/styles.css`.
- Produces: standard Vite plugin configuration, npm lockfile, `npm run check:independence`, `npm test`, and `npm run typecheck`.

- [ ] **Step 1: Write the failing independence test**

Create `tests/project-independence.test.mjs` to run `node scripts/check-project-independence.mjs` and assert exit code `0`. In the checker, construct forbidden tokens from string fragments so the checker does not contain the complete forbidden text itself; scan tracked/current project files while excluding `.git`, `node_modules`, build output, and binary media.

- [ ] **Step 2: Run the test to verify it fails on the current project**

Run: `node --test tests/project-independence.test.mjs`

Expected: FAIL because the current configuration, metadata, asset manifests, documentation, and telemetry still contain legacy-editor references.

- [ ] **Step 3: Replace the build wrapper and package workflow**

Configure `vite.config.ts` with `tanstackStart({ server: { entry: "server" } })`, `nitro()`, `viteReact()`, `tailwindcss()`, and `tsconfigPaths()` in the documented order. Remove the legacy config package and unused direct router plugin from `package.json`; add `typecheck`, `test`, and `check:independence` scripts plus Vitest/Testing Library/jsdom dev dependencies pinned by the generated npm lockfile. Update `package-lock.json` with `npm install`; remove the obsolete Bun lock/config when no longer needed.

- [ ] **Step 4: Remove editor metadata and telemetry while retaining generic errors**

Delete the root editor metadata directory and the editor-specific client error reporter. Remove its import/effect from `src/routes/__root.tsx`, keep `console.error` plus the existing generic server safeguards, and rewrite `AGENTS.md` as a platform-neutral instruction that only preserves the no-history-rewrite rule. Replace `README.md` with KO Systems development, test, build, and asset guidance.

- [ ] **Step 5: Run foundation verification**

Run: `npm run check:independence && npm run typecheck && npm run build`

Expected: all commands PASS and the application builds with the explicit plugin chain.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts AGENTS.md README.md scripts tests src/routes/__root.tsx src/lib bunfig.toml bun.lock
git commit -m "build: remove editor-specific runtime dependencies"
```

### Task 2: Local Brand Assets and Reusable Brand Component

**Files:**
- Create: `public/brand/ko-systems-navy.png`
- Create: `public/brand/ko-systems-light.jpg`
- Create: `src/components/brand/brand-mark.tsx`
- Create: `src/components/brand/brand-mark.test.tsx`
- Modify: `public/favicon.png`
- Modify: `src/components/ui/glyph-portal.tsx`

**Interfaces:**
- Consumes: approved source logos `D:/Usuário/Documents/KO Systems LOGOS/5-em-png.png`, `D:/Usuário/Documents/KO Systems LOGOS/6.jpg`, and the existing transparent symbol in `public/favicon.png`.
- Produces: `BrandMark({ surface, format, className })`, where `surface` is `"light" | "dark"` and `format` is `"lockup" | "symbol"`.

- [ ] **Step 1: Write failing brand-selection tests**

```tsx
render(<BrandMark surface="light" format="lockup" />)
expect(screen.getByRole("img", { name: "KO Systems" })).toHaveAttribute(
  "src",
  "/brand/ko-systems-navy.png",
)

rerender(<BrandMark surface="dark" format="lockup" />)
expect(screen.getByRole("img", { name: "KO Systems" })).toHaveAttribute(
  "src",
  "/brand/ko-systems-light.jpg",
)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/brand/brand-mark.test.tsx`

Expected: FAIL because the component and local brand assets do not exist.

- [ ] **Step 3: Add approved assets and implement `BrandMark`**

Copy the two supplied files without altering the artwork. Use the transparent favicon symbol for `format="symbol"`; color it through the component's surface-aware presentation rather than generating a new approximation. Update `GlyphPortal` only as needed to accept and render the local symbol consistently in the existing zoom composition.

- [ ] **Step 4: Run the brand tests**

Run: `npm test -- src/components/brand/brand-mark.test.tsx`

Expected: PASS for both surface variants and both formats.

- [ ] **Step 5: Commit**

```bash
git add public/brand public/favicon.png src/components/brand src/components/ui/glyph-portal.tsx
git commit -m "feat: add local KO Systems brand assets"
```

### Task 3: Landing Content Model and Contact Utilities

**Files:**
- Create: `src/features/landing/content.ts`
- Create: `src/features/landing/contact.ts`
- Create: `src/features/landing/content.test.ts`
- Create: `src/features/landing/contact.test.ts`

**Interfaces:**
- Consumes: approved project, service, process, company, and contact decisions from the spec.
- Produces: `ProjectCase`, `ServiceOffering`, `ProcessStep`, `projects`, `services`, `processSteps`, and `buildWhatsAppUrl(message?: string): string`.

- [ ] **Step 1: Write failing content and WhatsApp tests**

```ts
expect(projects.map((project) => project.slug)).toEqual([
  "pdv-restaurante",
  "gestao-integrada",
  "leitor-pedidos",
  "gestao-linhas",
])
expect(projects.every((project) => !("clientName" in project))).toBe(true)
const whatsappUrl = new URL(buildWhatsAppUrl())
expect(`${whatsappUrl.origin}${whatsappUrl.pathname}`).toBe("https://wa.me/5511930086602")
expect(whatsappUrl.searchParams.get("text")).toBe(
  "Olá! Gostaria de solicitar um orçamento. Minha empresa atua no segmento de ___ e preciso de uma solução para ___.",
)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/landing/content.test.ts src/features/landing/contact.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement typed content and contact utilities**

Add only the four approved projects, five approved service groups, four process stages, Instagram URL, domain, CNPJ, and guided WhatsApp copy. Do not add email or GitHub destinations yet. Project records include `slug`, `segment`, `title`, `summary`, `problem`, `solution`, `capabilities`, and `demoKind: "pos" | "management" | "document" | null`.

- [ ] **Step 4: Run the content tests**

Run: `npm test -- src/features/landing/content.test.ts src/features/landing/contact.test.ts`

Expected: PASS with exactly four anonymous projects and the encoded contact URL.

- [ ] **Step 5: Commit**

```bash
git add src/features/landing/content.ts src/features/landing/contact.ts src/features/landing/*.test.ts
git commit -m "feat: define portfolio content and contact flow"
```

### Task 4: Craft-Inspired Project Showcase and Fictional Demos

**Files:**
- Create: `src/features/landing/project-showcase.tsx`
- Create: `src/features/landing/project-showcase.test.tsx`
- Create: `src/features/landing/demos/pos-demo.tsx`
- Create: `src/features/landing/demos/management-demo.tsx`
- Create: `src/features/landing/demos/document-demo.tsx`
- Create: `src/features/landing/demos/project-demo.tsx`
- Create: `src/features/landing/demos/project-demo.test.tsx`

**Interfaces:**
- Consumes: `ProjectCase[]` and `demoKind` from Task 3.
- Produces: `ProjectShowcase({ projects })` and `ProjectDemo({ kind })` with local, network-free state.

- [ ] **Step 1: Write failing showcase behavior tests**

```tsx
render(<ProjectShowcase projects={projects} />)
fireEvent.click(screen.getByRole("button", { name: /gestão de linhas/i }))
expect(screen.getByRole("heading", { name: /linhas e dispositivos/i })).toBeVisible()
expect(screen.queryByText(/dados fictícios/i)).not.toBeInTheDocument()

fireEvent.click(screen.getByRole("button", { name: /pdv/i }))
expect(screen.getByText(/dados fictícios/i)).toBeVisible()
```

Add tests proving touch/click selection does not depend on hover and selection state uses `aria-pressed` or tabs semantics.

- [ ] **Step 2: Write failing demo interaction tests**

Test that the PDV demo updates a fictional order total/status, the management demo switches among stock/sales/finance views, and the document demo converts the bundled sample into a separation table after “Processar exemplo”.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- src/features/landing/project-showcase.test.tsx src/features/landing/demos/project-demo.test.tsx`

Expected: FAIL because showcase and demo components do not exist.

- [ ] **Step 4: Implement the showcase**

Build a restrained three/two/one-column project grid with reconstructed interface previews, segment/title/summary, visible keyboard focus, and a shared detail region. Use buttons with explicit selected state; on mobile keep all selection actions visible and place the detail immediately after the selected card or in a clearly associated region.

- [ ] **Step 5: Implement the three demonstrations**

Keep each demo small and focused:

- PDV: fictional items, calculated total, and representative status progression.
- Management: fictional products/stock/sales/finance views.
- Document: bundled fictional source text and a deterministic generated table.

Every demo displays “Dados fictícios”. Do not add uploads, persistence, network calls, or real business names.

- [ ] **Step 6: Run project tests**

Run: `npm test -- src/features/landing/project-showcase.test.tsx src/features/landing/demos/project-demo.test.tsx`

Expected: PASS, including the stale-demo regression test for the corporate-lines case.

- [ ] **Step 7: Commit**

```bash
git add src/features/landing/project-showcase* src/features/landing/demos
git commit -m "feat: add interactive project showcase"
```

### Task 5: Services, Process, Navigation, Contact, and Footer

**Files:**
- Create: `src/features/landing/site-header.tsx`
- Create: `src/features/landing/services-section.tsx`
- Create: `src/features/landing/process-section.tsx`
- Create: `src/features/landing/contact-section.tsx`
- Create: `src/features/landing/site-footer.tsx`
- Create: `src/features/landing/landing-sections.test.tsx`

**Interfaces:**
- Consumes: services/process/company data and `buildWhatsAppUrl()` from Task 3; `BrandMark` from Task 2.
- Produces: semantic landing sections with `#projetos`, `#servicos`, `#processo`, and `#contato` anchors.

- [ ] **Step 1: Write failing section tests**

Test that the header exposes the four section links and WhatsApp CTA, the five approved services render, the four process stages render in order, the footer shows CNPJ and Instagram, and email/GitHub links are absent.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/features/landing/landing-sections.test.tsx`

Expected: FAIL because the section components do not exist.

- [ ] **Step 3: Implement accessible navigation and editorial sections**

Add a mobile menu with an accurate accessible label and close it after choosing a link. Present services as a stable editorial list with only subtle CSS transitions. Render the four-stage process and use direct WhatsApp anchors in the header and final contact section.

- [ ] **Step 4: Implement the institutional footer**

Use the light lockup on navy, show CNPJ `69.208.733/0001-12`, Instagram `@ko.systems`, domain/copyright, section shortcuts, and the WhatsApp action. Do not render a physical address, inactive email, or unavailable GitHub destination.

- [ ] **Step 5: Run section tests**

Run: `npm test -- src/features/landing/landing-sections.test.tsx`

Expected: PASS with required institutional data and intentionally absent inactive links.

- [ ] **Step 6: Commit**

```bash
git add src/features/landing/site-header.tsx src/features/landing/services-section.tsx src/features/landing/process-section.tsx src/features/landing/contact-section.tsx src/features/landing/site-footer.tsx src/features/landing/landing-sections.test.tsx
git commit -m "feat: add institutional landing sections"
```

### Task 6: Assemble the Landing Route, Privacy Page, and Metadata

**Files:**
- Create: `src/features/landing/landing-page.tsx`
- Create: `src/features/landing/landing-page.test.tsx`
- Create: `src/routes/privacidade.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/lib/error-page.ts`
- Modify: `src/styles.css`
- Remove: `src/components/ui/animated-gallery.tsx`
- Remove: `src/components/ui/animated-slideshow.tsx`
- Remove: `src/components/ui/gallery-animation.tsx`
- Remove: all editor asset-manifest JSON files under `src/assets`

**Interfaces:**
- Consumes: hero component, `BrandMark`, project showcase, sections, and content modules from Tasks 2–5.
- Produces: `LandingPage`, `/` route, `/privacidade` route, Portuguese generic error experiences, canonical metadata, and final responsive theme.

- [ ] **Step 1: Write the failing integrated landing test**

Render `LandingPage` and assert one `h1`, all four project selectors, five service headings, the four process stages, multiple direct WhatsApp links, the light/dark brand usage, and no inactive email/GitHub links.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/landing/landing-page.test.tsx`

Expected: FAIL because the assembled page does not exist.

- [ ] **Step 3: Assemble the route while preserving the hero**

Move route body composition to `LandingPage`; keep `src/routes/index.tsx` responsible only for file-route definition and page metadata. Reuse `GlyphPortal` with the local symbol and approved zoom settings, followed by project showcase, services, process, contact, and footer.

- [ ] **Step 4: Add privacy and Portuguese fallbacks**

Create a concise privacy route explaining that the site has no contact form and directs visitors to third-party channels. Translate 404/client/server error copy while preserving retry/home behavior. Add canonical `https://kosystems.com.br/`, Open Graph metadata, and local social/brand imagery.

- [ ] **Step 5: Replace legacy gallery styling and dependencies**

Remove the three obsolete animated gallery components and their imports. Update `src/styles.css` for the approved navy/light palette, responsive project grid, focus states, and reduced motion. Remove `motion` and `framer-motion` from `package.json` only after `rg` confirms no remaining imports, then update `package-lock.json`.

- [ ] **Step 6: Run integration checks**

Run: `npm test -- src/features/landing/landing-page.test.tsx && npm run typecheck && npm run lint && npm run build`

Expected: all commands PASS.

- [ ] **Step 7: Commit**

```bash
git add src/routes src/features/landing src/lib/error-page.ts src/styles.css src/components/ui package.json package-lock.json src/assets
git commit -m "feat: rebuild KO Systems landing experience"
```

### Task 7: Full Verification and Privacy Audit

**Files:**
- Modify: files identified by verification only when a concrete defect is reproduced
- Verify: entire working tree and production build output

**Interfaces:**
- Consumes: complete landing implementation from Tasks 1–6.
- Produces: verified responsive site with a documented clean working state.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test && npm run check:independence && npm run typecheck && npm run lint && npm run build`

Expected: all commands PASS from a clean dependency install.

- [ ] **Step 2: Scan source and build output for disclosure risks**

Run targeted searches for the four private repository names, known client/business names, private repository URLs, editor asset prefixes, and forbidden attributions. Scan both project files and emitted build output while excluding `.git`, dependencies, binary media, and the approved private-history boundary.

Expected: no prohibited matches in current source or built assets; only generic anonymous segment/project language remains.

- [ ] **Step 3: Verify desktop flow in a browser**

At a representative desktop viewport, verify hero zoom, navigation anchors, all project selections, all three demos, services, process, WhatsApp URLs, privacy route, footer links, 404 behavior, and console errors.

- [ ] **Step 4: Verify mobile and reduced-motion flows**

At a representative phone viewport, verify menu behavior, no horizontal overflow, touch project selection, readable demo controls, reachable CTAs, correct logos on contrasting surfaces, and a functional reduced-motion hero/content fallback.

- [ ] **Step 5: Review the final diff and working tree**

Run: `git diff --check && git status --short && git diff --stat origin/main...HEAD`

Expected: no whitespace errors; the user's pre-existing lockfile is incorporated without unrelated data loss; no real client repositories or external files were modified.

- [ ] **Step 6: Commit verification fixes if needed**

If verification changed files, stage each verified fix by its exact path and run `git commit -m "fix: resolve landing verification findings"`. Skip this step when no fix was required.
