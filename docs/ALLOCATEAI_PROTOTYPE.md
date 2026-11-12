# AllocateAI

AllocateAI is a local internship allocation application with a Next.js operator interface, a FastAPI service, an OR-Tools CP-SAT optimizer, and SQLite round history.

The operator supplies pre-screened candidate–opportunity matches and integer suitability scores. The optimizer enforces candidate uniqueness, opportunity capacities, and configured minimum group counts. It maximizes placement count first and total suitability second.

The current release is a functional prototype. Authentication uses one shared operator token. Production deployment, user accounts, authoritative seat inventory, and the offer lifecycle remain open.

Read [the implementation and comparison report](STATUS_AND_COMPARISON.md) for the complete assessment.

## Run locally

Use Python 3.11+ and Node.js 22. Dependencies are installed in this project, independently of the PRAGATI checkout.

From PowerShell in the repository root, create the Python environment.

~~~powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm ci
npm run build
~~~

In the first terminal, configure a local operator credential and start FastAPI. Keep the same terminal open. Generate a different credential for each deployment.

~~~powershell
$env:ALLOCATEAI_TOKEN = [guid]::NewGuid().ToString('N')
$env:ALLOCATEAI_DB = 'data/rounds.sqlite3'
Write-Output $env:ALLOCATEAI_TOKEN
.\.venv\Scripts\python.exe -m uvicorn backend:app --host 127.0.0.1 --port 8766
~~~

In a second terminal, start Next.js.

~~~powershell
npm run start -- --hostname 127.0.0.1 --port 3101
~~~

Open http://127.0.0.1:3101 and enter the generated token. Edit the example inputs and select Run allocation. Load recent rounds to inspect saved results.

The default Next.js backend destination is http://127.0.0.1:8766. If changing it, set ALLOCATEAI_BACKEND_URL before building and starting Next.js. Deploy both services together or provide a reachable private backend address.

The browser timeout is 30 seconds. The solver currently has no corresponding execution deadline. Use bounded synthetic scenarios until solver resource controls are implemented.

## API

Send Authorization with the value Bearer followed by the operator token.

| Endpoint | Behavior |
| --- | --- |
| POST /api/allocate | Validate a scenario, solve it, save input and result, and return a round ID |
| GET /api/rounds | Return the latest 25 rounds and their assignments |

A sample input is in example.json. The required top-level fields are capacities, eligible_matches, and minimums. Scores are integers, and group minimums are absolute counts. The caller is responsible for eligibility screening and supplying consistent candidate group membership across matches.

## Project files

| Path | Responsibility |
| --- | --- |
| app/ | Next.js interface and CSS |
| next.config.mjs | Same-origin API proxy configuration |
| backend.py | Validated FastAPI operations and SQLite storage |
| allocator.py | Two-stage allocation optimization and CLI |
| example.json | Synthetic demonstration scenario |
| server.py and index.html | Earlier standalone prototype, retained for history |
| STATUS_AND_COMPARISON.md | Implementation, limitations, comparison, and remaining delivery work |

SQLite files, tokens, logs, dependencies, and build outputs are excluded from Git. The legacy server has no token authentication and should not be used for client deployment.

## Verification

The Next.js production build and local API integration have been exercised. Additional checks cover unauthorized access, malformed requests, quota infeasibility, and saved history. The status report distinguishes these checks from work still awaiting verification.
