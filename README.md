# Practech — Engineering Workshop

A browser-first engineering practical demo built with React, TypeScript, Vite, Three.js and React Three Fiber. VR equipment is not required. The 3D workshop loads only when opened, and the session is saved in local browser storage.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, then preview it with `npm run preview`.

## Deploy from GitHub to Vercel

Import this repository in Vercel and leave the project root at the repository root. `vercel.json` selects the Vite framework, runs `npm run build`, publishes `dist`, and rewrites client-side routes to `index.html` so paths such as `/login` and `/signup` work on refresh. Vercel creates deployments from pushes to the connected Git branch and preview deployments for pull requests.

For live Supabase authentication, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under the Vercel project's Environment Variables for the environments you use. These are public client keys; never add a Supabase service-role key to this frontend. `.env.local` is ignored by Git and is not uploaded to Vercel. Set the Supabase Auth site's URL and redirect URLs to your Vercel production domain and any preview domains you intend to use.

This repository's deployable app is Vite. The `app/`, `utils/supabase/`, and root `middleware.ts` files are an unused Next.js scaffold and are excluded by `.vercelignore`; they are not part of this deployment or authentication runtime.

## Demo scope

The current release demonstrates four rule-based practicals: engine cooling, a 24 V control circuit, a loaded truss and a pneumatic actuator. Each has selectable prototype components, a toolbox, tool compatibility checks, diagnostic feedback, simulated repair, event history, a procedure score and a downloadable text report. Models are purpose-built Three.js prototypes, not production engineering assets. Readings are illustrative scenario data and are not suitable for real engineering decisions.

Sessions are stored per browser in `localStorage`. This build has no server, authentication, role management, institution data isolation, instructor assignment editor, cloud asset storage, or persistent cross-device records. The WebXR API is detected for display only; browser interaction remains the supported workflow. To add a scenario, extend `ScenarioDefinition` and the component construction in `src/simulation/scenarios.ts`; operation rules are in `src/simulation/engine.ts` and viewer input is in `src/ui/EquipmentView.tsx`.

## Structure

- `src/simulation/types.ts` — typed scenario, part, tool, event and session contracts.
- `src/simulation/scenarios.ts` — four demo scenarios and their selectable components.
- `src/simulation/engine.ts` — shared operation validation, state changes and event scoring.
- `src/ui/App.tsx` — dashboard, discipline pages and responsive workshop interface.
- `src/ui/EquipmentView.tsx` — lazily loaded, mouse and touch accessible Three.js model viewer.
- `src/ui/styles.scss` — dark and light responsive interface system.

## Engineering content library

The integrated content area adds a seeded catalogue (13 model records and 24 practical exercises across mechanical, electrical, civil and mechatronics), search/filter views, contribution forms, a staged review queue, a content dashboard, an original GLB/GLTF visual preview, and links from exercises into the existing workshop scenarios. Exercise records retain model links, learning objectives, tools, education level, difficulty and task instructions. Completing a linked exercise records an attempt in browser storage.

Content metadata and review state use `localStorage`; uploaded original files use IndexedDB in the current browser. The workspace role selector is a UI preview control, not authentication or authorization, and all workspace routes are open during this prototype phase. Admin and tutor uploads accept `.sl`, GLB, GLTF, OBJ, FBX, STL, STEP/STP, IGES/IGS, multiple STL component files, or a ZIP containing STL files. STL components can be selected from a component list and inspected individually in the browser viewer. Other originals are stored locally; only GLB/GLTF files and STL components can be previewed in the browser, while `.sl` and other formats require conversion before preview. This repo has no API, database, object storage, institution isolation, malware scanning or background conversion service. The seeded catalogue is demonstration content: sample model records are clearly separated from linked prototype simulations, and only the three interactive prototypes are marked simulation-ready. No model is marked assessment-ready. Component names and scenario readings remain illustrative and unvalidated.

The next production integration step is a backend service and database migration for content records, versioned submissions/reviews, upload authorization and object-storage references. A worker would validate, scan, convert, optimize and generate previews for uploads; only then should a model readiness level advance. Course/module/topic links, formal reviewer assignment, granular RBAC, configurable rubrics and institution-wide analytics are not backed by services in this frontend demo.

## Student, tutor and admin workspaces

The global **View as** switch exposes three role-specific demo workspaces. Students can enroll in up to two active programs from the four seeded disciplines, see approved learning content only for enrolled disciplines, complete lessons, launch linked practicals, view automatic grades, message a tutor and receive a program certificate after all published lesson and practical requirements are complete. Completed programs remain available for repeat practice. Tutors can create module revisions, author or revise practical sessions and reply to student messages; those changes stay pending while the existing published version remains active. Administrators approve module revisions in Program Administration and approve model/session submissions in Reviews & Approvals. Admins can also edit submissions from any author, update source and licence details, replace uploaded model files, or change an exercise's linked model. Edited content returns to the review queue before publication.

## Supabase authentication and data backend

The `/login` and `/signup` pages use Supabase Auth email/password endpoints, including email confirmation, password reset, restored sessions and token refresh. Copy `.env.example` into `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable live auth. New sign-ups always receive the `student` role; user metadata cannot grant tutor or admin access. A user's profile role selects the initial workspace view, while workspace routes remain reachable without authentication as requested for this prototype.

Next App Router equivalents are scaffolded in `app/page.tsx` and `utils/supabase/`. The root `middleware.ts` refreshes Supabase cookies without adding route protection; email confirmation is handled at `app/auth/confirm/route.ts`. The current app is still built and served with Vite, so running the Next scaffold requires adding/using a Next.js runtime. `.env.local` is ignored by Git; it accepts the `NEXT_PUBLIC_SUPABASE_*` keys, and the Vite sign-in page can use those same public values.

The ordered migrations in `supabase/migrations/` create identity and programs, learning content and models, submissions and progress, row-level security, private model storage, program-scoped tutor assignments, and revision/audit history. Apply them with `supabase db push`. Deploy the `content-submit`, `content-review`, `enroll-program`, `admin-set-role`, `submit-assessment` and `issue-certificate` Edge Functions with `supabase functions deploy <function-name>`; each function contains its own CORS, client and authentication helpers, and the review and role-management endpoints require an administrator. Assessment scores are calculated server-side against each session's `assessment_criteria.items` rubric. Model storage keys should use `<program_id>/<model_id>/<component_file>` so upload permissions can be checked against the tutor's assignment. Set a first admin by updating that user's `profiles.role` using the Supabase SQL editor or a trusted administrative process. Configure email confirmation and the Auth redirect URLs for your deployment before inviting students.

Enrollment, lesson completion, attempts, grades, certificates, messages and content are stored in this browser. **View as** is a demonstration switch, not secure authentication or role enforcement. The four program curricula and completion rules are sample content; broader discipline records in the model catalogue do not yet have seeded student programs. Automatic grades use the demo simulation score, not a validated assessment service.
