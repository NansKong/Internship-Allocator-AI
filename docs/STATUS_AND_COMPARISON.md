# AllocateAI implementation status and PRAGATI comparison

Assessment date 5 November 2026

## Current delivery status

AllocateAI currently implements a functional local operator workflow. A user can edit internship opportunities, capacities, pre-screened candidate matches, suitability scores, and minimum group counts in Next.js. FastAPI validates a submitted scenario, OR-Tools solves it, and SQLite stores the input and result. The user can list recent rounds and reopen assignment results.

Client production delivery remains incomplete. The implementation does not yet support candidate and company portals, identity-based permissions, an authoritative transactional seat inventory, or the complete offer lifecycle. A production build passing establishes that Next.js compiles. It does not establish operational production readiness.

## Implemented functionality

| Capability | Implementation | Practical boundary |
| --- | --- | --- |
| Operator interface | Next.js App Router and React | Single workspace screen |
| Input editing | Editable rows for opportunities, matches, and group minimums | Manual data entry with a small synthetic example |
| Client validation | Required names, integer checks, uniqueness checks, existing opportunity checks | Backend remains authoritative for API acceptance |
| Backend validation | Pydantic schemas reject extra fields, invalid values, duplicate pairs, and unknown opportunities | Candidate attributes are embedded in matches |
| Capacity enforcement | Sum of chosen assignments cannot exceed opportunity capacity | Applies to an individual scenario, not shared inventory across rounds |
| Candidate uniqueness | At most one chosen match per candidate | Per round only |
| Minimum representation | Hard lower bounds for configured groups | Absolute counts only, with no full reservation policy semantics |
| Optimization | Maximize placement count, fix that count, then maximize summed integer suitability | Optimal results only are returned as assignments |
| Infeasibility | Explicit solver status | No minimal conflicting-constraint explanation |
| Access control | Bearer token checked against an environment variable | One shared operator credential |
| Persistence | SQLite stores round ID, timestamp, input JSON, and result JSON | Latest 25 results available through the API |
| Error feedback | Input and service errors displayed in the interface | No comprehensive diagnostics interface |
| Local operation | Next.js proxies requests to a loopback FastAPI service | Hosted deployment pending |

The service limits scenarios to 300 opportunities, 3,000 candidate–opportunity pairs, 100 minimum-group entries, and 32 group labels per match. Seats and minimums are integers from zero to 100,000. Scores are integers from minus 1,000,000 to 1,000,000. The middleware checks the declared Content-Length against a 2 MB threshold. This is not a streaming body-size enforcement mechanism.

## Allocation behavior

The model creates a binary decision for every supplied eligible match. Candidate constraints prevent multiple assignments, capacity constraints limit each opportunity, and group constraints enforce minimum counts.

The first solve maximizes the number of assignments. If it proves optimality, the second solve fixes that count and maximizes summed suitability. This expresses the placement-first objective directly without a fixed score bonus.

If a solve returns a status other than OPTIMAL, the current implementation returns that status with an empty assignment list. It does not return a feasible incumbent, an optimality gap, or an explanation for resource exhaustion.

A group label is currently attached to each match. Contradictory group membership for the same candidate across opportunities is possible and must be prevented in a future candidate data model. The API cannot independently prove that a supplied match is eligible.

## Architecture and storage

Browser requests pass through Next.js rewrites to FastAPI. FastAPI invokes the Python allocator synchronously and writes the completed round in a SQLite transaction. Both the scenario and result are stored, but the history API exposes result summaries and assignments only. There is no detailed input-retrieval endpoint.

Saved rounds represent computed proposals. They do not reserve seats in a shared inventory. Two rounds can independently assign the same candidate or use the same seats. Database persistence of a completed result must not be interpreted as final placement or a seat commitment.

The SQLite schema is created by application code. Schema migration tooling, backup operations, restore testing, and database retention jobs are absent.

## Work missing for client delivery

| Work area | Missing functionality | Acceptance evidence needed |
| --- | --- | --- |
| Identity | Individual accounts, secure sessions, administrator/candidate/company/auditor roles, revocation | Permission tests through UI and API |
| Domain records | Candidate profiles, companies, internships, applications, eligibility evidence | CRUD workflows with ownership and validation |
| Policy engine | Versioned eligibility and reservation rules, upper bounds and overlapping categories | Approved policy fixtures and independent verification |
| Matching | Resume parsing, skill normalization, semantic scoring, explanations | Human-reviewed matching evaluation and provenance |
| Allocation jobs | Execution deadlines, bounded concurrency, cancellation, retries, idempotency | Failure and load tests |
| Reproducibility | Input/policy/model/solver version capture and deterministic tie handling | Replay comparison |
| Seat inventory | Durable holds, expiry, available/held/committed counts, atomic commits | Concurrent last-seat tests and crash recovery |
| Offer lifecycle | Offer issuance, acceptance, decline, joining, waitlists | End-to-end state-transition tests |
| Reallocation | Dependency analysis, affected-subset optimization, full-round verification | Comparison against full reruns |
| Audit | Actor identity, reasons, event history, tamper evidence, signatures | Integrity verification and event coverage tests |
| Product UX | Candidate/company portals, round names and detail pages, imports/exports, actionable conflict diagnosis | Browser tests and client review |
| Operations | HTTPS hosting, secrets management, migrations, backup/restore, structured logs, monitoring | Deployment and recovery rehearsal |
| Quality | Committed automated test suite, CI, browser coverage, accessibility review, dependency maintenance | Repeatable CI artifacts |
| Scale | Representative datasets and performance measurements | Benchmarks with resource use and solver status |

The current token is held in React memory and sent as an Authorization header. There is no login flow, token rotation interface, per-user attribution, rate limiting, or role enforcement. Token checks alone are insufficient for a client identity system.

The frontend times out a request after 30 seconds, while the solver has no configured deadline. An abandoned browser request can leave work running. This requires server-side job management and solver limits.

The interface can reopen historical results beside current editable inputs without loading the original historical input. A round detail page must clearly bind its inputs and outputs before operational use.

## Comparison with PRAGATI

The comparison is based on the downloaded PRAGATI repository at commit 4c506b7 and selected source inspection. PRAGATI's complete stack has not been independently built, executed, load-tested, or certified in this work. Capabilities attributed to it below come from repository documentation and inspected code.

PRAGATI source https://github.com/The-FinalCommit/AI-allocation-engine-for-PM-internship-scheme

| Dimension | AllocateAI current implementation | PRAGATI repository |
| --- | --- | --- |
| Interface | Next.js single operator workspace | React/TypeScript administrator, candidate, and organisation interfaces |
| Application backend | FastAPI | Spring Boot with a separate FastAPI AI/optimizer service |
| Persistence | SQLite completed-round records | JPA/H2 demo storage and documented MySQL production profile |
| Access | Shared bearer token | Documented JWT and role-based demo accounts |
| Candidate records | Match rows only | Candidate profiles, skills, preferences, and resume workflows |
| Suitability | Supplied integer score | Documented weighted factor scoring and skill normalization |
| Optimization | Two separate CP-SAT optimization stages | CP-SAT weighted objective with count bonus |
| Policies | Absolute minimum group counts | Versioned weights, fairness floors, and policy simulations |
| Comparisons | No baseline dashboard | Sequential baseline comparisons |
| Reallocation | Pending | Documented parent/child run differences and reallocation operations |
| Audit/reporting | Input/result snapshots and timestamps | Documented audit trail, explanations, and PDF reports |
| Test evidence | Local checks and production build | Repository includes optimizer and other test files |
| Readiness | Small functional prototype | Broader integrated demo, with production readiness unverified here |

PRAGATI is substantially more complete as an application. AllocateAI's current two-stage objective is a specific correctness distinction, not proof of superior overall allocation quality.

In the inspected PRAGATI optimizer, each chosen pair contributes 10001 plus suitability and preference terms. A fixed constant larger than one pair's score does not necessarily dominate aggregate suitability differences across many assignments. Exact lexicographic priority requires a sufficient aggregate bound or separate solves. This is a source-level issue to test, not a claim that PRAGATI's observed demo outputs are incorrect.

The PRAGATI repository declares an MIT license. Its checkout is excluded from this publication. The AllocateAI implementation uses third-party libraries, whose upstream licenses remain applicable. No proprietary template code was imported.

## Proposed research contribution and present evidence

The original architecture proposes token-budget routing, provisional seat holds, deterministic compliance checks, targeted rollback, shortfall-driven rescoring, and signed hash-chained logs.

The revised direction places hard policy constraints directly in the optimizer. A candidate research contribution is selective reallocation after a decline, expiry, or inventory change, while preserving unaffected assignments and verifying global compliance.

Neither the original hold-and-repair protocol nor the revised selective reallocation mechanism is implemented in this release. Patent novelty and research novelty have not been established. They require prior-art review and measurable experimental evidence.

Experiments should compare the same eligible match graph and policies under a greedy baseline, score-priority baseline, full optimization, and selective reallocation. Measure coverage, suitability, preference satisfaction, violations, moved assignments, time, resource use, and solver optimality status. No national-scale performance or real-world fairness claims are supported by the current sample.

## Verification record

Previous local execution checked the Next.js production build, homepage delivery, solver calls through the Next.js proxy, token rejection, malformed scenario rejection, saved history, and quota infeasibility.

These were local checks rather than a committed automated regression suite. Browser interaction testing, deployment testing, large-scale benchmarking, independent compliance verification, and complete PRAGATI execution remain pending.

The repository setup uses a project-local Python environment. Earlier demo sessions used the sibling PRAGATI virtual environment as a temporary runtime; that dependency is not required by the published setup.

## Recommended implementation sequence

1. Add identity-based access and durable candidate, opportunity, application, and policy records.
2. Introduce managed allocation jobs, replay metadata, independent validation, and round detail pages.
3. Build transactional seat holds and the offer lifecycle with idempotent state transitions.
4. Implement selective reallocation and compare it with full optimization.
5. Complete student and company portals, browser QA, CI, deployment, and recovery testing.

## Publication scope

The repository contains AllocateAI application source, the Node lockfile, the synthetic example, setup instructions, and this report. Local credentials, SQLite files, logs, dependency folders, build output, the PRAGATI checkout, and unpublished patent documents are excluded. The legacy standalone HTML/Python prototype is retained for traceability and is not the supported authenticated entry point.
