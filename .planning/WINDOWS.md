---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-13T06:23:56.306Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/main.ts | 9 | Target letter hardcoded to fixed 'A' (tracer slice for DEPLOY-02); Plan 01-02 replaces with random-target selector, same render path | open |  | 2026-08-13T06:23:56.306Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "src/main.ts",
    "line": 9,
    "description": "Target letter hardcoded to fixed 'A' (tracer slice for DEPLOY-02); Plan 01-02 replaces with random-target selector, same render path",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-13T06:23:56.306Z",
    "resolved_at": null
  }
]
````
