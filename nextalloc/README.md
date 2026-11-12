# NextAlloc role-based demonstration

This is the current three-role demonstration, adapted from the teammate project. See [source and license attribution](SOURCE.md).

## Workspaces

| Role | Pages and workflows |
| --- | --- |
| Administrator | Overview and policy launch, verification and NOC review, datasets and scenarios, allocation runs, policy comparisons, reallocation, audit trail, service health, product walkthrough |
| Organisation partner | Organisation overview, capacity and eligible demand, allocation impact, searchable opening cards, new/edit opening forms, pause/reopen/close actions, offers and joining |
| Candidate | Allocation status, offer inbox, recommendations, readiness checklist, searchable internships and eligibility, fit factors and skill guidance, academic/NOC evidence, skills, interests, preferences, resume review |

The frontend uses React 18, Vite, TypeScript and Tailwind. It is a separate application from the original Next.js AllocateAI prototype at the repository root.

## Run locally

Requirements: Node.js 22, Python 3.11, Java 17 JDK and Maven 3.9 or later. All commands below start from this `nextalloc/` directory.

Build the frontend and copy its output to the backend's static directory.

```powershell
npm --prefix app/frontend ci
npm --prefix app/frontend run typecheck
npm --prefix app/frontend test
npm --prefix app/frontend run build
Copy-Item app/frontend/dist/* app/backend/frontend-dist -Recurse -Force
```

Start the AI service in one terminal.

```powershell
cd app/ai-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Start the backend in another terminal.

```powershell
cd app/backend
mvn package -DskipTests
java -jar target/nextalloc-backend.jar
```

Open [http://localhost:8080/login](http://localhost:8080/login). Select a role to prefill its demonstration credentials.

| Role | Email | Demo password |
| --- | --- | --- |
| Administrator | admin@nextalloc.in | Admin@123 |
| Organisation partner | provider@nextalloc.in | Provider@123 |
| Candidate | candidate@nextalloc.in | Candidate@123 |

These are published synthetic demo accounts. Use a configured persistent database and private credentials for a real deployment. The default H2 database is in memory and resets on backend restart, including allocation rounds and offers.

For hot reload, use `npm --prefix app/frontend run dev` with the backend running. Vite opens on port 5173 and proxies API requests to port 8080.

A Docker configuration is supplied at `app/docker-compose.yml`; Docker startup was not verified on this workstation. Run from this directory with `docker compose -f app/docker-compose.yml up --build`.

## Checks and limits

On 12 November 2026, the frontend type check, all nine frontend contract tests, and the production build passed. Browser checks exercised role sign-in, partner search/edit forms and offer listing, candidate search/detail views, fit selection, profile shortcuts, and mobile layouts. Backend/AI test suites and Docker were not rerun for this UI update. Existing suites and evaluation artifacts are included from upstream.

Health endpoints are `/actuator/health` on port 8080 and `/health` on port 8000. The API explorer is `/swagger-ui.html` on port 8080.

This remains a demonstration release. Production rollout still needs deployment configuration, secrets and account lifecycle, persistent storage and backups, operational monitoring, current dependency/security review, and load/accessibility/security acceptance checks. The current default AI path uses deterministic skill processing and optimization; the proposed token-bounded router, worker swarm and blackboard/critic research architecture is not demonstrated as a complete live agent system by these UI changes.
