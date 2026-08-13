---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-08-13T20:30:15.986Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/main.ts | 9 | Target letter hardcoded to fixed 'A' (tracer slice for DEPLOY-02); Plan 01-02 replaces with random-target selector, same render path | open |  | 2026-08-13T06:23:56.306Z |  |
| 2 | 2 | unrun-verify | src/menu.ts |  | Task 1 human-check not run in this environment: manual browser QA needed for menu render, Letters fullscreen entry, correct/incorrect celebration on real keypress, Escape/external fullscreen exit resync, and ?screen=nonsense fallback | open |  | 2026-08-13T20:30:09.577Z |  |
| 3 | 2 | unrun-verify | src/game-screen.ts |  | Task 2 human-check not run in this environment: manual keyboard QA needed to confirm every physical digit-row key 0-9 (and numeric keypad) registers a match, and non-repeat behavior holds over ~10 rounds | open |  | 2026-08-13T20:30:15.986Z |  |

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
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "2",
    "file": "src/menu.ts",
    "line": null,
    "description": "Task 1 human-check not run in this environment: manual browser QA needed for menu render, Letters fullscreen entry, correct/incorrect celebration on real keypress, Escape/external fullscreen exit resync, and ?screen=nonsense fallback",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-13T20:30:09.577Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "2",
    "file": "src/game-screen.ts",
    "line": null,
    "description": "Task 2 human-check not run in this environment: manual keyboard QA needed to confirm every physical digit-row key 0-9 (and numeric keypad) registers a match, and non-repeat behavior holds over ~10 rounds",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-13T20:30:15.986Z",
    "resolved_at": null
  }
]
````
