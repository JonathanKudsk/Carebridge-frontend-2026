# CareBridge 2.0 — Project Primer for AI Coding Assistants

> **Read this first.** This file is the working source of truth for any agentic coding tool (Claude Code, Gemini CLI, Cursor, Copilot, etc.) working on the CareBridge codebase. It captures the business case, domain model, tech stack, conventions, and process rules used across the 7+ teams. Drop this file at the root of both `team_3_backend/` and `team_3_frontend/Carebridge-frontend-2026/` (filename `CLAUDE.md` for Claude Code, or symlink/copy to `AGENTS.md` for tools that prefer that name).
>
> **Audience:** AI agents and the developers prompting them.
>
> **How to use this doc.** Treat it as a strong default, not a straitjacket. The human you're working with has the final call on every decision. When something is ambiguous, ask. When a standard doesn't fit, surface the deviation and get sign-off rather than silently bending the rule. Your goal is to be a careful, opinionated collaborator — not a rule-enforcement bot.
>
> **Scope:** Sprint 1, Spring 2026. Status verified against the code on 2026-04-29.

--- 

## 1. The product in one paragraph

CareBridge 2.0 is a web platform for Danish *bosteder* — residential care homes that house and support residents (the "borgere") with cognitive, psychiatric, or physical care needs. CareWorkers (pædagoger/medarbejdere) document daily care, log incidents, manage medication, plan shifts, and communicate with each other. Guardians (parents or other next-of-kin) get appropriately scoped visibility into their resident's life. Admins manage user accounts. The product replaces fragmented paper journals, ad-hoc spreadsheets, and email threads with a single auditable system. Hard requirements: GDPR-grade data protection, role-based access, full action audit trail, and 99.5%+ uptime.

It's a school project built by ~7 student teams of ~6 people each (Scrum Master, Tech Lead, Developer×n) over three sprints. The 7 teams contribute features in parallel against a shared codebase; cross-team coordination, glossary discipline, and PR hygiene are the project's hardest engineering problems — harder than any individual feature.

---

## 2. Stakeholders and roles

### Real-world user roles

| Role | Danish | What they do |
|------|--------|--------------|
| `CAREWORKER` | Pædagog/medarbejder | Daily care, journal entries, checklists |
| `GUARDIAN` | Forælder/pårørende | Visibility into their resident |
| `ADMIN` | Administrator | User & system management |

### Roles actually in code (`Role` enum, `entities/enums/Role.java`)

```java
public enum Role implements RouteRole {
    ANYONE,    // public route — no auth required
    USER,      // generic logged-in user (default for new accounts)
    ADMIN,
    CAREWORKER,
    GUARDIAN
}
```

> **Important.** `RESIDENT`, `PLANNER`, and `DOCTOR` appear in the BDD glossary and in some user stories (US #3 — doctor edits medication; US #10 — vagtplan/Planner) but **are not yet in the `Role` enum.** Teams adding those user stories will need to extend the enum and announce the entity change. Do not assume those role values exist.

### Project roles (within each team of 6)
- **Scrum Master** — owns process, ceremonies, blockers
- **Tech Lead** — owns code quality, PR review, cross-team coordination, entity changes, architecture calls
- **Developer(s)** — build features

### Cross-team coordination
- **KIMM** — owns the cross-team BDD glossary and the merged Coding Standards document. Canonical answer for any domain term.
- **PO (Product Owner)** — reviews finished product against acceptance criteria.

---

## 3. Tech stack (verified against `pom.xml` and `package.json`)

### Backend (`team_3_backend/`)
- **Java 21** (compile target via maven-compiler-plugin `<release>21</release>`)
- **Javalin 6.3.0** — REST framework. Uses `Context` (`ctx`). Routes registered via `ApiBuilder` DSL.
- **Hibernate 6.4.4** — ORM. Schema managed by `hibernate.hbm2ddl.auto=create` in dev (drops & recreates on each app start) and `create-drop` in tests. **There is no Flyway/Liquibase.**
- **PostgreSQL 42.7.3** — production DB
- **Testcontainers 1.20.1** — `jdbc:tc:postgresql:15.3-alpine3.18:///test_db` — auto-spins Postgres in Docker for tests
- **Jackson 2.16.1 + jsr310** — JSON serialization
- **Nimbus JOSE JWT 10.5** (`com.nimbusds:nimbus-jose-jwt`) — JWT signing/verification
- **jBCrypt 0.4** (`org.mindrot:jbcrypt`) — password hashing
- **Hibernate Validator 8.0.1** — bean validation (`@NotBlank`, `@Email`, `@Size`)
- **Lombok 1.18.36** — annotation processor active for both main and test compilation. **Used inconsistently:** `Template`, `Field`, `JournalEntry`, `JournalEntryAnswer`, DTOs use Lombok; `User`, `Resident` hand-write getters/setters. Don't assume — match the file you're editing.
- **JUnit 5.10.2** + **REST Assured 5.5.0** — tests
- **Logback 1.5.13** — logging via SLF4J

**App entry:** `com.carebridge.App.main` → `ApplicationConfig.startServer(7070)` → API exposed at `http://localhost:7070/api`. README says 8080 — README is wrong. Listen port is **7070**.

**Useful commands:**
```bash
mvn clean install
mvn clean compile exec:java          # dev — runs App.main
mvn clean package
java -jar target/carebridge-backend-1.0-SNAPSHOT.jar
mvn test                              # all tests (Testcontainers)
mvn test -Dtest=EventDAOTest          # single class
mvn -B clean package -DskipTests      # CI build step
```

**Required env / `application.properties`:**
```
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SSLMODE=disable | require        # defaults to "require" if unset
FRONTEND_ORIGIN=http://localhost:5173   # falls back to "*" if unset
ISSUER=carebridge
TOKEN_EXPIRE_TIME=3600000           # ms
SECRET_KEY=...                      # ≥32 chars
DEPLOYED=                           # set in production; toggles to setDeployedProperties()
```

The `setDeployedProperties()` path uses different env vars (`CONNECTION_STR`, `DB_USERNAME`) — be aware if touching `HibernateConfig`.

### Frontend (`team_3_frontend/Carebridge-frontend-2026/`)
- **React 19.1.1** + **Vite 7.1.7** + **React Router DOM 7.9.4**
- **Bootstrap 5.3.8** + **react-bootstrap 2.10.10** for UI. **No Tailwind.**
- **Axios 1.13.2** for HTTP, **jwt-decode 4.0.0** for token parsing
- **ESLint 9** with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- Vite env var: `VITE_API_URL` for the backend URL

**Useful commands:**
```bash
npm install
npm run dev      # vite dev server
npm run build    # vite build → /dist
npm run lint     # eslint .
npm run preview  # serve built /dist
```

### Database hosting
Teams use **Neon.tech** branches — each team can have its own isolated Postgres branch. Connection comes from `application.properties` or env. Never commit credentials.

### CI (GitHub Actions, `.github/workflows/workflow.yml`)
Two jobs on `ubuntu-latest`:
1. **build** — runs on every push to `main` and on PR. `mvn -B clean package -DskipTests`.
2. **test** — only on PRs (`if: github.event_name == 'pull_request'`). `mvn -B test`. Depends on `build`.

Repo secrets/vars used: `SECRET_KEY`, `DB_PASSWORD` (secrets); `DEPLOYED`, `ISSUER`, `TOKEN_EXPIRE_TIME`, `FRONTEND_ORIGIN`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_SSLMODE` (vars).

There is **no coverage gate enforced in CI** despite the 90% DoD target. Coverage is on the honor system today.

---

## 4. Project structure (verified)

### Backend
```
team_3_backend/
├── pom.xml
├── src/main/java/com/carebridge/
│   ├── App.java                              # main(), starts Javalin on port 7070
│   ├── config/
│   │   ├── ApplicationConfig.java            # Javalin config, CORS, exception handlers
│   │   ├── HibernateConfig.java              # EMF, dev/test/deployed property profiles
│   │   └── Populator.java                    # seeds demo data
│   ├── controllers/
│   │   ├── IController.java                  # generic interface: read/readAll/create/update/delete
│   │   ├── impl/                             # concrete controllers (UserController, ...)
│   │   └── security/                         # AccessController, SecurityController, interfaces
│   ├── dao/
│   │   ├── IDAO.java                         # generic interface
│   │   ├── impl/                             # singletons via getInstance()
│   │   └── security/                         # ISecurityDAO, SecurityDAO
│   ├── dtos/
│   │   ├── ...DTO.java                       # request + response DTOs (separate package!)
│   │   └── security/                         # token DTOs + token exceptions
│   ├── entities/                             # JPA @Entity classes
│   │   ├── enums/Role.java                   # the routing role enum
│   │   └── security/ISecurityUser.java
│   ├── enums/                                # other enums (EntryType, RiskAssessment, FieldType)
│   ├── exceptions/                           # ApiException, ApiRuntimeException, ValidationException, NotAuthorizedException
│   ├── routes/                               # Javalin EndpointGroup wiring per resource
│   │   └── Routes.java                       # the top-level path() composition
│   ├── services/
│   │   └── mappers/                          # static Entity↔DTO mappers (NO real service layer yet)
│   └── utils/Utils.java
├── src/main/resources/
│   ├── hibernate.cfg.xml                     # legacy H2 config — NOT used, HibernateConfig overrides it
│   └── logback.xml
└── src/test/java/
    ├── dao/                                  # *DAOTest.java
    └── restTest/                             # REST Assured integration tests
```

### Frontend
```
team_3_frontend/Carebridge-frontend-2026/
├── package.json
├── vite.config.js
├── eslint.config.js
├── index.html
├── README.md
├── README-migration.md
└── src/
    ├── main.jsx
    ├── App.jsx                              # router, navbar, PrivateRoute
    ├── api/api.js                           # endpoint helper functions (getUsers, createUser, ...) — imports the axios client from services/api.js
    ├── services/
    │   ├── api.js                           # the canonical axios instance (token interceptor lives here)
    │   ├── auth.js                          # getToken/getCurrentUser/logout/onAuthChanged + login()
    │   └── events.js
    ├── components/
    │   ├── ContinuousCalendar.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── ResidentForm.jsx
    │   ├── SnackProvider.jsx
    │   ├── DemoWrapper.jsx
    │   ├── icons/SnackIcons.jsx
    │   └── Journal/                         # JournalForm, JournalList, ShowJournalDetails
    ├── pages/
    │   ├── (auth)/Login.jsx
    │   ├── (worker)/CreateUser.jsx, LinkResidents.jsx
    │   └── Home, About, Contact, Login, NotFound, CalendarPage,
    │       JournalOverviewPage, CreateJournalPage,
    │       CreateResidentPage, residentOverview
    └── utils/                               # residents, validation
```

> **Note.** Two layers of API code exist: `src/services/api.js` is the canonical axios instance (with the JWT-injecting interceptor); `src/api/api.js` is a small module of endpoint-named helper functions (`getUsers`, `createUser`, `createJournalEntry`, …) that import from `services/api.js` and call its methods. They are *not* duplicates — they're an instance + helpers split. Use `services/api.js` directly for one-off calls; add helpers to `api/api.js` for endpoints reused across multiple pages.
>
> **Note — duplicate Login.jsx.** Two `Login.jsx` files exist: `src/pages/Login.jsx` (top-level) is the **live** one — `App.jsx` imports it, and it uses `login()` from `services/auth`. `src/pages/(auth)/Login.jsx` is **dead code** — it uses raw `fetch` with the hardcoded URL `http://localhost:7070/api/auth/login`, writes to a different localStorage key (`jwt_token`), and isn't imported anywhere. Don't use the `(auth)` version as a reference for new auth code; consider deleting it in a chore PR.
>
> **Note.** `residentOverview.jsx` is lowercase, breaking the PascalCase convention for components. Don't "fix" it without coordination — other files import that exact name.
>
> **Note.** Pages are organized in folders `(auth)/` and `(worker)/`. The parens are an organizing convention only — they have **no** special meaning in Vite or React Router 7 (unlike Next.js, where they create route groups). Treat them as plain folders.

---

## 5. Domain model (BDD glossary + actual code)

> **Always use these names verbatim** in new code, comments, commits, and documentation. If the term you need isn't here, ask KIMM before inventing one.

### What's actually in the code today

| Business term | Code class | Status | Notes |
|---------------|-----------|--------|-------|
| Caretaker / CareWorker | `User` with `Role.CAREWORKER` | Live | Single `User` entity, role-stamped (no separate `CareWorker` class) |
| Guardian | `User` with `Role.GUARDIAN` | Live | Has `residents` ManyToMany via `guardian_residents` |
| Admin | `User` with `Role.ADMIN` | Live | |
| Resident | `Resident` | Live | `firstName`, `lastName`, `cprNr`, `journal` (1:1), `users` (m:n via `resident_user`) |
| Journal | `Journal` | Live | Owned by Resident |
| JournalEntry | `JournalEntry` | Live | Includes `template_id`, `editCloseTime = createdAt + 24h` |
| EntryType | `EntryType` enum | Live | `DAILY`, `INCIDENT`, `MEDICAL`, `NOTE` |
| Risk assessment | `RiskAssessment` enum | Live | `LOW`, `MEDIUM`, `HIGH` |
| Template | `Template` | **Partial** | Has `id`, `title`, `fields`, `journalEntries`. CRUD: read/readAll work; **create/update/delete are `501` stubs in `TemplateController`** (this is Team 3's Sprint 1 work) |
| Field | `Field` | Live | `id`, `template`, `title`, `fieldType` |
| FieldType | `FieldType` enum | Live | `TEXTFIELD`, `CHECKBOX`, `NUMBERFIELD` |
| JournalEntryAnswer | `JournalEntryAnswer` | Live | Links `JournalEntry` ↔ `Field` with a `String answer` |
| Event | `Event` | Live | Calendar item |
| EventType | `EventType` | Live | With color hex |

### What's in the glossary but **NOT yet in the code**

These are coming from other teams' user stories. Don't reference them as if they exist:

| Term | Owning team | Notes |
|------|-------------|-------|
| `Shift`, `ShiftType`, `ShiftStatus`, `ShiftAssignment`, `PlanPeriod`, `PlanStatus`, `Location`, `Overlap` | Team 6 (Vagtplan) | US #10, planned for Sprint 1–2 |
| `Message`, `Chat` | Team 5 | US #7, Sprint 1–2 |
| `MedicationChart` (or similar) | Team 1 | US #2/#3 |
| Role values `PLANNER`, `RESIDENT`, `DOCTOR` | Various | Need to be added to `Role` enum + announced |
| Real `Service` layer between controllers and DAOs | (none) | Coding standards mandate it; the code doesn't have it yet. Today, controllers call DAOs directly. Discuss before introducing one — it would touch every controller. |

### User identity & contact fields (`User.java`)

`User` separates **public** and **internal** contact info:
- `name`, `email` — internal/login
- `displayName`, `displayEmail`, `displayPhone` — meant to be visible to other roles
- `internalEmail`, `internalPhone` — staff-only
- `passwordHash` — BCrypt, hashed in `setPassword(rawPassword)`

> **Known issue.** `UserMapper.toDTO` currently exposes `internalEmail` and `internalPhone` in the response. That looks like a leak: a `Guardian` may see internal contact info via `/users` endpoints. Before "fixing" this, talk to the team — there may be a reason. If not, this is worth a Sprint 1 follow-up PR, separate from feature work, with the entity-change and security implications spelled out.

> **Known issue.** `User.role` is a single `Role`, not a `Set<Role>`. The glossary mentions "roles" plural. Today's reality: one role per user. Don't write code that assumes multiple roles per user without changing the entity (which is an entity change → announce + KIMM).

### Core relationships
```
Resident ─── 1 owns 1 ──→ Journal ──→ contains 0..* JournalEntry
                                  └─→ uses 0..* Field (indirectly via Template)
JournalEntry ─── M:1 ──→ User (author)
JournalEntry ─── M:1 ──→ Template
JournalEntry ─── 1:N ──→ JournalEntryAnswer
JournalEntryAnswer ─── M:1 ──→ Field
Template ─── 1:N ──→ Field
Template ─── 1:N ──→ JournalEntry
Resident ─── M:N (resident_user) ──→ User
Resident ─── M:N (guardian_residents, inverse) ──→ User (Guardian role)
```

### Database (snake_case, `bigserial` IDs, Hibernate auto-DDL)

Real tables: `users`, `resident`, `journal`, `journal_entries`, `journal_entry_Answers` (sic — note the capital A), `template`, `field`, `events`, `event_types`, `event_seen_by_users`, `guardian_residents`, `resident_user`.

> **Important.** Schema is regenerated from JPA annotations on every dev startup (`hbm2ddl.auto=create`). There are no migration scripts. Adding a new entity = (1) add to `entities/`, (2) register in `HibernateConfig.getAnnotationConfiguration()`, (3) restart. There is no migration history; if you need to preserve dev data, take a Neon snapshot before restarting.

---

## 6. Functional requirements (CareBridge 2.0)

Split across the 7 teams. Full reference in `CareBridge 2 - funktionelle krav.docx`. Summary:

1. **User management & access** — roles, RBAC with need-to-know, login (planned 2FA — Team 2)
2. **Journaling** — daily entries, types (pedagogical/medical/care), attachments, search/filter, **template-driven entries (Team 3)**, incident registration
3. **Admin & planning** — task management, calendar, medication module, statistics, resident overview, time tracking, shift planning
4. **Communication** — internal messaging, notifications

Non-functional: GDPR encryption at rest and in transit, full audit logging, automated backups, 99.5% uptime, 2s response time, 500 concurrent users, mobile-responsive, Dark mode default with Light toggle, sustainability lens (each team picks one feature with a sustainability angle).

---

## 7. Team & sprint boundaries (Sprint 1, Spring 2026)

| Team | User Story | Sprint 1 | Sprint 2 |
|------|------------|----------|----------|
| 1 | Edit & Display Resident Medication Data (US #2, #3) | x | x |
| 2 | 2FA (US #4) + Calendar events (US #11) | x (#4) | x (#11) |
| **3 (this team)** | **Create Template — create + edit Templates (US #5)** | **x** | |
| 4 | Beboeroversigt — resident overview (US #6) | x | x |
| 5 | Chat system (US #7) | x | x |
| 6 | Vagtplan — shift planning (US #10) | x | x |
| 7 | Resident overview pre-work (US #8) + Role-based access (US #9) | x (#8) | x (#9) |

### Team 3 — what to build, concretely

The product backlog row says *"Create Template — Create and edit template"*. Cross-referenced to the code:

- **Backend.** Sprint 1's task is implementing `TemplateController.create()`, `update()`, `delete()`. At the start of the sprint these were `501 Not Implemented` stubs. **Always read the current state of `TemplateController.java`, `TemplateDAO.java`, and `TemplateRoute.java` before assuming what's there** — this section will go stale the moment work begins. The read methods (`read`, `readAll`) already work and return `TemplateDetailedResponseDTO` and `TemplateResponseDTO[]` respectively.

- The data model is already there: `Template { id, title, List<Field> fields, List<JournalEntry> journalEntries }`, `Field { id, template, title, FieldType fieldType }`, `FieldType { TEXTFIELD, CHECKBOX, NUMBERFIELD }`.

- **Frontend.** No template UI exists yet. You'll need pages/components for listing, creating, and editing Templates and their Fields.

- **Watch for:** when you add fields to a template via update, you're touching `Field` (an entity owned by your team but referenced by other teams' future work). Announce schema changes.

### Cross-team dependencies to watch
- Team 3 (templates) ↔ Team 4/7 (resident overview) — selecting which residents a template attaches to needs the resident list (currently `Template` does not link to `Resident` — confirm with PO whether per-resident attachment is in scope for your US)
- Team 7 (RBAC) is foundational for Sprint 2 — coordinate before they ship
- Team 6 (shift planning) introduces `PlanPeriod`, `Shift`, `ShiftAssignment` — entity-change announcements expected

---

## 8. Coding standards (compiled cross-team by KIMM, with reality notes)

These are the rules; reality deviates in a few places. **New code should follow the rule**, not the deviation, unless the human says otherwise.

### Tone
- **English in code identifiers, comments, commits, PR titles, error messages logged to backend.** Danish in user-facing UI strings is fine. **Reality:** several controllers (`UserController.linkResidents`, etc.) return Danish JSON `msg` strings to the frontend. That's user-facing, so it's OK; just keep identifiers and log lines English.
- **Reality deviation in `Resident.java`:** the constructor parameter `User guardian` is unused, suggesting an incomplete refactor. Don't propagate that pattern.

### Naming
- Classes: **PascalCase** — `OrderService`, `ChecklistTemplate`
- Methods & variables: **camelCase**. **Reality:** `User.created_at` and `User.updated_at` are snake_case fields in Java code — wrong by the standard, but pre-existing. Don't break callers; for new entities use `createdAt` / `updatedAt`.
- Constants: **UPPER_SNAKE**
- DB tables & columns: **snake_case**. Real exception: `journal_entry_Answers` table has a capital A — ugly but real, don't "fix" without coordination.
- Test names: `shouldXWhenY` — e.g., `shouldReturnErrorWhenPasswordIsEmpty()`
- **Branch naming (mandatory):** `TEAM-<n>-US-<m>-Task-<k>-<feature-in-kebab>` — e.g., `TEAM-3-US-5-Task-1-create-template-endpoint`
- Branches must NEVER originate from `main` or `developer`. Always branch from your team branch.
- Branches must NEVER be merged into `main` or `developer` directly.

### Style
- Indentation: 4 spaces (project convention; check `eslint.config.js` on the frontend)
- `{` on same line as `if` / method signature; `}` on its own line
- Max line length: ~100–120 chars
- Methods: small, single responsibility, descriptive name
- Early returns; minimize nested `if`s
- 1 blank line minimum between methods (max 2)
- One class = one responsibility (SRP); KISS; DRY; consistency > preference; readability > cleverness

### Layering (the standard)
`Controller → Service → Repository/DAO → Entity`. Controllers thin, services thick, DAOs persistence-only.

**Reality:** the codebase has `Controller → DAO → Entity` with DTO mappers in `services/mappers/`. There is no real service layer. **Don't introduce one for a single PR** — that's a cross-team architectural decision. If the task is small, follow existing pattern (controller calls DAO directly). If the task has real business logic, raise it with the Tech Lead and consider a separate refactor PR.

### Error handling
- Use **specific exceptions** — `ApiRuntimeException(int statusCode, String message)`, `ValidationException`, `NotAuthorizedException` — not bare `Exception`.
- The existing controller pattern is: try { ... } catch (`ApiRuntimeException`) translate to status; catch (Exception) log + 500. The bare-`Exception` catch at the top level is a project convention to avoid leaking stack traces to clients. Keep it; don't swallow errors *inside* business logic.
- No silent failures.
- Meaningful messages.

### Testing
- JUnit 5 + Testcontainers (Postgres 15.3 in Docker) for DAO tests
- REST Assured 5.5 for HTTP-level tests (see `src/test/java/restTest/`)
- **DoD targets 90% coverage**, but CI does not enforce it today — honor system
- Arrange-Act-Assert structure
- Tests must pass before commit; CI must be green before merge

### Comments
- Comment **why**, not **what**
- Complex logic: comment "to perfection"
- Use canonical glossary terms in comments

---

## 9. Definition of Done (cross-team)

A PBI is "Done" when **all** of the following are true:
1. Acceptance criteria for the user story are met, including failure scenarios
2. Naming follows BDD glossary (KIMM-maintained); glossary updated if new terms added
3. Security in place — JWT, role checks, input validation
4. Unit + integration tests written and passing; ~90% coverage; CI green
5. Code peer-reviewed by ≥1 teammate
6. PR reviewed by Tech Lead and PO has reviewed the product
7. Code commented where non-obvious; documentation updated
8. Deployed to test/staging environment successfully

If any of those is false, the code is not deployable.

---

## 10. Pull Request rules

### Core rules
- **Base branch:** the team's branch — **never** `main`, **never** `developer` (this one is non-negotiable)
- **Size:** ~200 lines diff. The source PR-rules doc says *"burde holdes under 200 linjer"* ("should be kept under 200 lines") — it's a guideline, not a hard cap. 230 lines with strong tests is usually fine; 400 lines almost never is. Call out big PRs in the description.
- **Scope:** one concern per PR — feature *or* bugfix *or* refactor, never mixed
- **Title format:** `feature: <what>`, `bugfix: <what>`, `refactor: <what>`
- **Description must include:** what, why, link to user story / issue / task
- **CI must be green** before merge
- **No direct commits to `main`** — ever

### Review etiquette
- Reviewer states **what** to change and **why** the current is not accepted
- Author updates and pushes
- Disagreements → discuss in PR thread; if unresolved, escalate to Discord or in-person; Tech Lead is tiebreaker
- External (cross-team) PR review only when a US directly affects another team's US

### Tooling
- GitHub repo rules enforce branch protection
- Feature branches always
- CI builds + tests on PR
- Backup the branch before opening a PR (not just "remote = backup")

---

## 11. Entity-change protocol

**Any** change or creation of a JPA `@Entity` must be:
1. Posted in the `Entity ændringer` Discord thread
2. Direct-messaged to the team's Tech Lead
3. **Registered in `HibernateConfig.getAnnotationConfiguration()`** — without this, the entity won't be picked up by Hibernate at startup.

The post must contain:
- **What** changed or was created
- **Why** the change was made
- **How** it's used (call sites, migration impact)
- **DDL impact** — because dev runs `hbm2ddl.auto=create`, every dev restart wipes the DB. New fields don't break the schema, they just get re-created. *But* renaming a column in an entity will silently lose dev data. If anyone has dev data they care about, take a Neon snapshot first.

If you change an entity without doing this, you will silently break other teams. This is the single most common cross-team friction. Always assume a teammate from another team is using the entity you're about to touch.

---

## 12. Code freeze

**The last Tuesday of each sprint at 11:00 starts code freeze (pre-merge code freeze).**

During code freeze:
- All new feature development stops
- Tech Leads start merging team branches toward the integration target
- Only bug fixes are accepted
- Any change requires explicit approval

Plan accordingly: don't open a feature PR after code freeze starts.

---

## 13. Common patterns and "how do I…" recipes (verified against the code)

### How to add a new entity (full vertical slice)
1. **Announce it** in `Entity ændringer` thread + DM Tech Lead
2. Add `@Entity` class in `entities/` (use Lombok `@Getter @Setter @NoArgsConstructor @AllArgsConstructor` for new entities — match `Template.java` as the modern reference)
3. **Register the class in `HibernateConfig.getAnnotationConfiguration()`** — `configuration.addAnnotatedClass(YourEntity.class);` (this is essential; without it, Hibernate will not create the table)
4. Add request/response DTOs in `dtos/` (e.g., `CreateXRequestDTO`, `XResponseDTO`, `XDetailedResponseDTO`). Use Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`. If the entity has nested objects, provide a constructor `XResponseDTO(X entity)` that flattens the relevant fields (see `TemplateResponseDTO` for the pattern).
5. Add a DAO singleton in `dao/impl/` implementing `IDAO<X, Long>`. Use the singleton pattern (`getInstance()`), open `EntityManager` with try-with-resources via `emf.createEntityManager()`, manage transactions explicitly with `em.getTransaction().begin()/commit()`. See `UserDAO` for the reference implementation.
6. Optionally add a mapper in `services/mappers/` with static `toDTO` / `toEntity` methods (see `UserMapper`)
7. Add a controller in `controllers/impl/` implementing `IController<X, Long>`. Use the try/catch (`ApiRuntimeException` → translate; `Exception` → log + 500) pattern. Return DTOs (never entities) using `ctx.json(...)`.
8. Add a route class in `routes/` (see `TemplateRoute.java`):
   ```java
   public class XRoute {
       private final XController controller = new XController();
       public EndpointGroup getRoutes() {
           return () -> {
               get("/", controller::readAll, Role.ADMIN);
               get("/{id}", controller::read, Role.ADMIN);
               post("/", controller::create, Role.ADMIN);
               put("/{id}", controller::update, Role.ADMIN);
               delete("/{id}", controller::delete, Role.ADMIN);
           };
       }
   }
   ```
9. Wire the route in `routes/Routes.java`: `path("/your-resource", xRoute.getRoutes());`
10. Update the **BDD glossary** with the new term(s)
11. Tests: a DAO test in `src/test/java/dao/` (Testcontainers + JPA) and a REST test in `src/test/java/restTest/` (REST Assured against a started Javalin)
12. Verify role-based access — pick the appropriate `Role` value and confirm `AccessController.accessHandler` covers your endpoint
13. Update this `CLAUDE.md` if the entity is canonical

### How to add a frontend page
1. New `.jsx` file in `src/pages/` (or under a route group like `(worker)/` for role-scoped pages)
2. Import API client from `src/services/api.js` (it auto-attaches the JWT)
3. Wire the route in `App.jsx` `<Routes>` block; wrap with `<PrivateRoute allowedRoles={[...]}>` if it requires a specific role
4. Components in `src/components/` (or a feature subfolder like `Journal/`)
5. Use react-bootstrap components for UI consistency
6. For role checks, read `getCurrentUser()` from `services/auth.js` and compare role string

### How to handle errors in a controller
Pattern (see any controller in `controllers/impl/`):
```java
try {
    Long id = Long.parseLong(ctx.pathParam("id"));
    X entity = xDAO.read(id);
    if (entity == null) { ctx.status(404).json("{\"msg\":\"X not found\"}"); return; }
    ctx.json(XMapper.toDTO(entity));
} catch (ApiRuntimeException e) {
    ctx.status(e.getErrorCode()).json("{\"msg\":\"" + e.getMessage() + "\"}");
} catch (Exception e) {
    logger.error("read X failed", e);
    ctx.status(500).json("{\"msg\":\"Internal error\"}");
}
```

### How to write a DAO test that touches the DB
- Use `HibernateConfig.getEntityManagerFactoryForTest()` to get the test EMF
- Testcontainers will auto-start Postgres 15.3 via the JDBC URL `jdbc:tc:postgresql:15.3-alpine3.18:///test_db`
- Schema is `create-drop` per session
- Test name: `shouldXWhenY`

### Auth & role checks
- `AccessController.accessHandler` is registered as `app.beforeMatched(...)` and runs before every matched route
- It pulls the `Authorization: Bearer <token>` header, calls `SecurityController.verifyToken(token)`, and stuffs a `JwtUserDTO` into `ctx.attribute("user")`
- Routes declare allowed roles by passing them as the third arg to the route DSL: `get("/{id}", controller::read, Role.ADMIN);`
- For `Role.ANYONE` routes, no JWT is required
- In a controller method, retrieve the authenticated user with `ctx.attribute("user")` and cast to `JwtUserDTO`

---

## 14. What an AI coding assistant should do on this project

These are **defaults**, not iron laws. The human you're working with is the final authority. If they tell you to override one of these for a specific PR or task, do it — and note in the PR description that a standard was relaxed and why, so the Tech Lead can sign off.

1. **Use canonical glossary terms** — `Resident`, not "patient" or "client"; `CareWorker`, not "staff"; `Guardian`, not "parent" generically.
2. **Match the existing layering**, even where it deviates from the standard. Don't introduce a service layer for a single PR. Surface the architectural question instead.
3. **Match style** — PascalCase classes, camelCase methods (except where the entity already uses snake_case fields like `User.created_at` — match what's there), snake_case DB.
4. **Generate tests** alongside any new logic. Use `shouldXWhenY` naming.
5. **Use Lombok** for new code (`@Getter @Setter @NoArgsConstructor @AllArgsConstructor` on entities; `@Data @Builder` on DTOs). **Don't add Lombok to existing hand-written entities** without asking.
6. **Don't hardcode secrets** — env vars only.
7. **Be cautious with `internalEmail`/`internalPhone` exposure** — `UserMapper.toDTO` currently leaks them, and that's a real concern. Surface it when relevant; don't propagate the leak into new mappers.
8. **Always check the route's `Role` argument** matches the actual access intent (don't blindly use `Role.ADMIN` if `CAREWORKER` should access).
9. **Flag entity changes** in your output — remind the human to post in the `Entity ændringer` thread *and* update `HibernateConfig.getAnnotationConfiguration()`.
10. **Respect the ~200-line PR guideline** — propose a split if your change would balloon past it.
11. **English in code identifiers, comments, commits, error logs.** Danish in user-facing JSON `msg` strings is the existing pattern — fine to continue.
12. **Ask before inventing a domain term.** If the glossary doesn't have a name, surface uncertainty.
13. **When you don't know what's already there, look** — read the file you're about to change, run a Glob over the relevant folder, search for similar patterns. The codebase deviates from its own docs in several places, so trust the code over this primer when they conflict, and tell the human about the discrepancy.

### Anti-patterns to refuse / call out (still negotiable with explicit human approval)
- Catching `Exception` and swallowing it (the top-level catch-and-translate is fine; swallowing inside business logic is not)
- Direct field access on entities from controllers (use getters)
- DB queries via string concatenation (use Hibernate JPQL with `setParameter`)
- Returning entities directly from endpoints (always DTO via mapper)
- Logging passwords, hashes, or tokens
- Writing Danish in code identifiers
- Renaming a glossary term locally to make it "fit better" — escalate to KIMM
- Hardcoding role checks in controllers when the route DSL already enforces them — duplication invites drift

---

## 14a. When to ask the human vs. just do it

**Default to asking** when any of these is true:

- The task is **ambiguous** ("add a user feature" — what kind of user? what feature? which permissions?)
- It would **change a JPA entity** — entities have cross-team blast radius; always confirm before touching one (and remind the human about the `Entity ændringer` thread + `HibernateConfig` registration)
- It would **introduce a new domain term** not in the glossary
- It would **cross team boundaries** — affecting another team's user story or files they own
- It would **change DB schema** in a way that loses dev data (renames, type changes)
- It would **touch security** — JWT handling, BCrypt config, role checks, password flows, the access controller
- It would require **breaking the 200-line PR limit** without an obvious split
- The acceptance criteria are **silent** on something you'd otherwise have to invent (error messages, edge cases, validation rules, defaults)
- The user asks "should I…?" — that's already an invitation to discuss
- You'd have to **deviate from a coding standard or DoD item** to complete the task — get explicit human sign-off and document the deviation in the PR
- You discover **the codebase already deviates** from this primer (e.g., the missing service layer) — flag it before assuming the primer is right

**It's fine to just do it** when:

- The change is contained, additive, and follows existing patterns
- It's a refactor that preserves behavior and is covered by tests
- It's a typo, a comment fix, or a stylistic correction within agreed conventions
- The user has already given you the spec in detail
- It's the literal next step in a plan the human just approved

When in doubt, **ask one focused question** rather than producing 200 lines of code that may need to be redone. A 30-second clarification beats a 30-minute revert.

**Phrase questions concretely.** Instead of *"how should I handle this?"*, ask *"AC says 'a CareWorker can edit a template'. Should template edits be visible to other CareWorkers immediately, or stay private until published? I'll go with 'immediately' if you say nothing."* Make it cheap for the human to answer.

---

## 14b. Standards as defaults: how to relax them safely

The standards in this doc are the result of cross-team negotiation and exist for good reasons. They are **not** sacred. The human running the task — usually a developer or the Tech Lead — has the final call. If a standard genuinely doesn't fit a specific situation, it can be relaxed.

When you (the AI) think a standard should be relaxed:

1. **State the standard** that's in tension (e.g., "max 100-char line length")
2. **Explain why** following it would harm the code in this case
3. **Propose the deviation** explicitly
4. **Ask for sign-off** before applying it
5. **Note it in the PR description** so reviewers see the deviation was conscious — e.g.,

   > **Coding-standard deviation:** This PR includes one 142-character line in `JournalEntryService.searchEntries(...)` because breaking it harms readability of the criteria expression. Approved by @ben (Tech Lead).

When **the human** tells you to ignore a rule for this PR: do it without arguing. Confirm what they want, apply the change, add a deviation note to the PR description.

Standards that are **harder to relax** (because they protect users or the system, not just style):
- Don't expose `passwordHash` (BCrypt hash — never returned)
- Don't log secrets/tokens/passwords
- Don't bypass the `accessHandler` JWT + role check on resident-data endpoints
- Don't catch and swallow exceptions silently inside business logic

If the human asks you to do one of *those*, push back once and ask for the reason. If they confirm, do it but make the deviation extremely visible in the PR.

---

## 15. Useful files in this repo bundle

- `CareBridge 2 - funktionelle krav.docx` — full functional requirements
- `BDD Glossary Template - CareBrdige (1).xlsx` — live glossary (KIMM owns)
- `Product Backlog - CareBridge 2.0.xlsx` — sprint plan + team assignments
- `4F26 SYS - Coding Standards - CB 2.0, ny coding standards.pdf` — full coding standards
- `4F26 SYS - DoD - CB 2.0.pdf` — full DoD
- `4F26 SYS - PR Rules - CB 2.0.pdf` — full PR rules
- `CareBridge 4F26 (1).jam` — FigJam board with class diagrams, ER diagram, UI mockups (export as PDF/PNG to make it readable to AI tools)
- Backend repo: `team_3_backend/` — Java/Maven
- Frontend repo: `team_3_frontend/Carebridge-frontend-2026/` — React/Vite

---

## 16. Trust this file vs. trust the code

This primer was verified against the code on 2026-04-29. Things change. If you (the AI) find that the code says one thing and this primer says another:

- **Trust the code.** Do what's consistent with what's already there.
- **Tell the human** in your response: "the primer says X, but `Foo.java` does Y — I followed Y. Want me to update the primer?"
- **Open a tiny doc PR** if appropriate, separate from your feature PR.

This file is maintained by the Tech Lead and rolls forward sprint by sprint. Sections most likely to drift first:
- Section 5 (domain model) — entities get added every week
- Section 7 (sprint boundaries) — moves between sprints
- Section 13 (recipes) — patterns evolve as the service layer question gets resolved

---

## 17. Quick reference card

```
Stack (backend):  Java 21 · Javalin 6.3 · Hibernate 6.4 (auto-DDL: create) · Postgres
                  · Nimbus JOSE JWT · jBCrypt · Lombok · JUnit 5 · Testcontainers · REST Assured
Stack (frontend): React 19 · Vite · React Router 7 · Bootstrap 5 · react-bootstrap · Axios · jwt-decode
Server port:      7070
API base path:    /api
Layering reality: Controller → DAO → Entity (no service layer yet)
Naming:           PascalCase / camelCase / snake_case (DB) / UPPER_SNAKE (constants)
Branch:           TEAM-<n>-US-<m>-Task-<k>-<feature-kebab>
PR limit:         ~200 lines · 1 concern · base = team branch
DoD:              AC met · ~90% coverage · peer review · PO review · glossary updated
Roles in code:    ANYONE · USER · ADMIN · CAREWORKER · GUARDIAN  (NOT yet: PLANNER, RESIDENT, DOCTOR)
Risk:             LOW · MEDIUM · HIGH
EntryType:        DAILY · INCIDENT · MEDICAL · NOTE
FieldType:        TEXTFIELD · CHECKBOX · NUMBERFIELD
Code freeze:      last Tuesday of sprint, 11:00 — bug fixes only after that
Entity change:    announce in Discord + DM Tech Lead + register in HibernateConfig
```

---

*Last reviewed: 2026-04-29 (verified against actual repo state) · Maintained by: Tech Lead, Team 3 · Source-of-truth glossary: KIMM*

> **For AI agents:** if anything in this doc is unclear, contradicted by what you see in the code, or missing for the task you're being asked to do — **ask the human first** rather than guessing. They will appreciate the question.