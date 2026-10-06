# KO Systems Site Redesign Design

## Objective

Transform the existing KO Systems landing page into an independent, credible lead-generation site for custom software services. Preserve the approved scroll-zoom hero, remove current editor-specific and generative-tool dependencies and references from the working tree, replace generic content with evidence from real projects, and direct qualified visitors to WhatsApp for quotes.

## Success Criteria

- The current scroll-driven hero behavior remains recognizable and functional on desktop and mobile.
- Logos render locally without editor-specific asset URLs and switch appropriately between light and dark sections.
- The working tree contains no former-editor or generative-tool dependency, telemetry, URL, configuration, or textual attribution.
- The site presents only four real projects currently in operation, without identifying their clients.
- Visitors can explore projects through a restrained Craft-inspired grid and three fictional interactive demonstrations.
- Services describe work KO Systems actually performs rather than generic technology claims.
- Every primary conversion path opens WhatsApp directly with a useful prefilled message.
- Existing navigation, responsive behavior, and contact functionality remain available or are replaced by equivalent behavior.
- The production build, lint checks, automated behavior tests, and desktop/mobile browser verification pass.

## Audience and Positioning

The commercial audience is companies that need a new system, need an existing idea implemented, or need an existing system improved. The public copy will not label prospective clients by company size.

KO Systems can enter at different stages:

- diagnose a business problem and design the solution;
- refine and build an already defined idea;
- design, develop, publish, and maintain a complete product;
- improve, integrate, or maintain an existing system.

The central positioning is practical custom software for real business operations. Copy must be specific, concise, and supported by actual project experience. It must not claim unverified metrics or outcomes.

## Information Architecture

The landing page will use this order:

1. Header navigation and primary WhatsApp action.
2. Existing scroll-zoom hero, with corrected local branding.
3. Selected projects in a Craft-inspired grid.
4. Contextual project details and three small fictional demonstrations.
5. Services presented in a stable editorial layout with restrained motion.
6. Working process.
7. Final WhatsApp call to action.
8. Institutional footer.

Header navigation:

- Projetos
- Serviços
- Processo
- GitHub, only after a relevant public profile or repository is available
- Solicitar orçamento

The GitHub navigation item must remain absent until it has a useful public destination.

## Visual Direction and Motion

The current navy identity remains the foundation. The visual rhythm takes inspiration from the Ruixen Craft page: compact project tiles, clear typographic hierarchy, strong screenshots, consistent metadata, and deliberate spacing. It must be adapted into an institutional company site rather than copied as a personal portfolio.

Motion hierarchy:

- Hero: the principal expressive motion, preserving the existing zoom-on-scroll effect.
- Projects: functional interaction used to reveal information or demonstrate a flow.
- Services: subtle entrance and hover/focus feedback only.
- Process, contact, and footer: stable reading surfaces without decorative animation.

All motion must honor `prefers-reduced-motion`. Essential content and actions cannot depend on hover.

## Brand Assets

The supplied brand files are the source of truth:

- `5-em-png.png`: navy mark for light surfaces.
- `6.jpg`: light mark for dark surfaces.

The implementation will create local, web-ready assets inside the repository. The hero may use a symbol-only derivative when required by the current zoom composition; headers and footers may use the complete lockup. No runtime request may depend on an editor-specific asset service.

Image treatment must preserve the logo proportions and avoid visible background boxes where transparency is required.

## Hero

The hero is the only existing section already approved. Preserve:

- the word-based scroll zoom;
- the current transition from the opening composition into the main statement;
- responsive and reduced-motion fallbacks;
- the direct transition into the rest of the landing page.

Change only what is necessary to make local brand assets render correctly, improve section-to-section color consistency, and keep navigation legible over the hero.

## Selected Projects

Only projects currently in real use will appear:

1. PDV para restaurante.
2. Gestão integrada de produção, estoque e vendas.
3. Leitor e organizador de pedidos em PDF/texto.
4. Gestão de linhas e dispositivos corporativos.

Client identities, logos, names, contact details, documents, database records, deployment URLs, and business-specific identifiers must not appear.

Each project tile contains:

- a sanitized or reconstructed visual;
- segment label;
- descriptive project title;
- one-sentence purpose;
- an action to explore the case.

Selecting a project reveals:

- the operational problem;
- the implemented approach;
- representative capabilities;
- the kind of operational improvement, without invented metrics;
- a contextual WhatsApp action such as “Precisa de uma solução parecida?”.

The project grid must work with keyboard, mouse, and touch. On small screens it becomes a vertical or two-column layout without hover-only behavior.

## Fictional Interactive Demonstrations

Three projects receive compact demonstrations using only bundled fictional data:

### PDV

Show a sample table/order flow. The visitor can add or inspect fictional items, view a calculated total, and move through a representative order/payment state. It is a demonstration of the interaction model, not a connection to the production system.

### Integrated Management

Show a sample operational overview with fictional products, stock, sales, and financial values. The visitor can switch between a small number of views to understand how connected information is organized.

### PDF/Text Order Reader

Use a bundled fictional order sample. The visitor starts a simulated processing action and sees the source content become an organized separation table. The initial release will not upload user files or send document content to a server.

The corporate lines project will use the normal project-detail interaction without a separate functional demonstration.

Every demonstration must visibly state that its data is fictional. Demonstrations must be independent implementations; no real project repository, API, database, environment variable, or customer asset is imported into the site.

## Services

Services will use a clear editorial section rather than the current animated gallery:

1. **Sistemas de gestão e operação** — ERPs, internal controls, stock, production, CRM, and operational workflows.
2. **Vendas e atendimento** — PDV, online stores, ordering, and commercial journeys.
3. **Automação de processos** — document reading, data transformation, and removal of repetitive manual work.
4. **Integrações e plataformas web** — connected systems, portals, and responsive web applications.
5. **Evolução de sistemas** — improvements, publication, maintenance, and support defined for each project.

Copy will explain concrete outcomes and representative capabilities without promising a fixed maintenance model.

## Working Process

Present four stages:

1. Entender — clarify the operation, problem, constraints, and current tools.
2. Desenhar — define the solution, interface, scope, and delivery stages.
3. Construir — develop and validate in short, visible cycles.
4. Publicar e evoluir — deploy, support, maintain, and improve according to the project.

The process should make both engagement paths clear: KO Systems can start from a problem or from an already defined idea.

## Conversion and Contact

WhatsApp is the primary conversion channel. Primary actions open:

`https://wa.me/5511930086602`

with a prefilled message equivalent to:

> Olá! Gostaria de solicitar um orçamento. Minha empresa atua no segmento de ___ e preciso de uma solução para ___.

Calls to action appear in the header, after projects, after services where appropriate, in the final contact section, and in the footer. They must not overwhelm the page or compete visually with one another.

Planned secondary contact information:

- Email: `contato@kosystems.com.br`, displayed only after the mailbox is active.
- Instagram: `@ko.systems`.
- Domain: `kosystems.com.br`.

No web contact form is included in the first release. This avoids storing personal data on the site and keeps the quote path low-friction.

## Institutional Footer

The footer uses the light logo on the dark navy surface and contains:

- KO Systems name and a concise description;
- navigation shortcuts;
- WhatsApp;
- active email when available;
- Instagram;
- CNPJ `69.208.733/0001-12`;
- privacy policy link;
- current-year copyright;
- GitHub only when a useful public destination exists.

No physical service address is shown. The site may state “Atendimento remoto” if a location-related label is needed.

## Privacy and Public Portfolio Boundaries

The deployed site is public at `kosystems.com.br`; repository visibility is independent from site visibility.

- The website repository may remain private.
- All real client product repositories remain private.
- Public demonstrations, if later placed in public repositories, start from sanitized code and fictional data with a clean history.
- No public branch will be created inside a private real-product repository.
- No customer repository will be made public by deleting current files while retaining its old history.

The initial interactive demonstrations live in the website codebase and do not require public repositories.

## Platform Independence

The current working tree will be cleaned completely while preserving published Git history:

- remove the former editor's Vite configuration package;
- replace the wrapper with explicit standard Vite/TanStack/React/Tailwind configuration;
- remove the existing editor metadata directory;
- remove editor-specific error-reporting hooks, globals, comments, and telemetry;
- remove editor-specific package-manager exceptions;
- replace all editor asset manifests and hosted editor URLs with local assets;
- remove former-editor and generative-tool references from README, configuration, source, generated lockfiles, and current documentation;
- regenerate dependency locks from standard package sources;
- retain generic client/server error handling without editor telemetry.

No pushed commits will be amended, rebased, squashed, force-pushed, or otherwise rewritten. Historical references remain only in the private existing Git history, as explicitly approved.

## Technical Architecture

Retain the existing React, TypeScript, TanStack Start, Vite, and Tailwind foundation. Replace only the editor-specific configuration layer and components that no longer serve the approved design.

Implementation boundaries:

- route composition and content data remain separated from reusable presentation components;
- project metadata and fictional demo data live in explicit local data modules;
- each demonstration owns its local interaction state and exposes no external data connection;
- brand and project media use local static imports or public assets;
- the root route owns metadata, global providers, generic errors, and document shell;
- responsive styles follow existing Tailwind conventions and semantic theme tokens.

Dependencies will be audited after removing old project/service galleries. Packages will be removed only when no remaining feature imports them. No unrelated refactor of the UI component library is included.

## Error Handling and Fallbacks

- Generic 404 and runtime error pages will be written in Portuguese.
- Error reporting will use normal browser/server logging without third-party editor hooks.
- A failed image must not collapse the project layout; local images require dimensions and meaningful alternatives.
- Demonstrations operate from bundled data and therefore do not need network-error states.
- Reduced-motion users receive stable hero/project states with the same content and actions.
- WhatsApp links remain ordinary accessible anchors and work without client-side JavaScript.

## SEO, Accessibility, and Performance

- Portuguese metadata, canonical domain, Open Graph information, and social preview assets.
- Semantic heading order, landmarks, link text, labels, and alt text.
- Keyboard-operable project and demo interactions with visible focus.
- Dialogs, if used, include focus management, Escape handling, and accessible names.
- Responsive verification at representative mobile and desktop widths.
- Lazy-load below-the-fold imagery; size assets for their display context.
- Avoid unnecessary animation libraries or duplicate dependencies.
- Preserve a useful experience when JavaScript animation is reduced.

## Verification

Verification must include:

- automated tests for project selection, fictional demo state changes, and WhatsApp URL generation;
- lint and TypeScript validation;
- production build using the independent Vite/TanStack configuration;
- repository-wide scan confirming no current former-editor, generative-tool, or hosted editor asset references;
- desktop and mobile browser walkthrough of hero, navigation, projects, demonstrations, services, CTA, and footer;
- keyboard and reduced-motion checks;
- checks that no real customer data, client identifiers, private URLs, or secrets are present in public page content or bundled assets.

## Out of Scope

- Rewriting published Git history.
- Making real client repositories public.
- Connecting demonstrations to production APIs or databases.
- Uploading arbitrary visitor PDFs in the first release.
- Publishing unfinished projects as case studies.
- A web contact form, CRM, analytics, advertising setup, or email provisioning.
- Final hosting-provider selection, DNS changes, and production deployment; the implementation will produce a deployable build for `kosystems.com.br`.
