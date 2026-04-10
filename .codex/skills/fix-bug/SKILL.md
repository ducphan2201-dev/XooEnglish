---
name: fix-bug
description: Fix a specific bug or error by finding the root cause, applying the smallest safe code change, and updating SESSION.md.
---

# Fix Bug

## Goal
Fix exactly one bug at a time with minimal changes.

## Instructions
1. Read `AGENTS.md`.
2. Read `SESSION.md`.
3. Read the user-provided error, failing behavior, or bug report carefully.
4. Find the smallest set of relevant files.
5. Identify the most likely root cause from the code. Do not guess blindly.
6. Make the smallest safe fix.
7. Run the smallest useful validation:
   - targeted test if available
   - otherwise lint or typecheck for touched files
8. Update `SESSION.md` with:
   - Status
   - Decisions
   - Next step
   - Files touched
9. Reply with:
   - root cause
   - files changed
   - validation run
   - what to test next

## Rules
- Do not refactor unrelated code.
- Do not change architecture for a small bug.
- Do not add dependencies unless absolutely required.
- Prefer minimal diffs.
- If the bug report is vague, first inspect likely files and infer the narrowest safe fix.
