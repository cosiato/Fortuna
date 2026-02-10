---
name: create-commits
description: Analyze unstaged changes and organize them into small, focused conventional commits grouped by related changes.
---

## When to Use

Invoke this skill when:

- There are many unstaged/staged changes across multiple files
- You want to split changes into logical, related commits
- You need help organizing messy working trees into clean git history

## Process

### Phase 1: Analyze Changes

1. Run `git status` to see all modified, added, and deleted files
2. Run `git diff` to inspect the actual content changes in each file
3. Run `git diff --staged` to inspect any already-staged changes
4. Run `git log --oneline -5` to understand the recent commit style

### Phase 2: Group Related Changes

Analyze all changes and group them by logical concern. Grouping criteria (in priority order):

1. **Same feature/functionality** -- files that work together for one feature
2. **Same type of change** -- e.g., all dependency updates, all config changes
3. **Same domain/module** -- changes within the same feature directory

Guidelines for grouping:

- Each commit should be independently meaningful
- A commit should not break the build if checked out alone
- Prefer smaller commits over larger ones
- Keep unrelated changes in separate commits
- Config/dependency changes go in their own commit
- Test changes can go with their corresponding implementation OR in a separate commit

### Phase 3: Plan Commits

Present a numbered plan to the user before executing. For each proposed commit:

- List the files to include
- Show the proposed commit message (conventional format)
- Brief rationale for the grouping

Format:

```
Commit Plan
===========

1. <type>: <description>
   Files: file1.ts, file2.ts
   Reason: <why these belong together>

2. <type>: <description>
   Files: file3.ts
   Reason: <why this is separate>

...
```

Wait for user approval before proceeding.

### Phase 4: Execute Commits

For each approved commit:

1. Stage only the specific files for that commit using `git add <file1> <file2> ...`
2. For partially staged files (where only some changes in a file belong to this commit), use `git add -p` alternatives or stage the whole file in the most logical commit
3. Create the commit with a conventional commit message
4. Verify with `git status` that remaining changes are correct

### Commit Message Format

Follow conventional commits strictly:

```
<type>[optional scope]: <description>

[optional body]
```

Types:

- `feat` -- new feature
- `fix` -- bug fix
- `refactor` -- code restructuring without behavior change
- `style` -- formatting, whitespace, semicolons
- `docs` -- documentation only
- `test` -- adding or updating tests
- `build` -- dependencies, build config, CI
- `perf` -- performance improvements
- `chore` -- maintenance tasks

Rules:

- Description in lowercase, imperative mood ("add" not "added" or "adds")
- No period at the end
- Under 72 characters for the first line
- Add scope when it clarifies the change (e.g., `feat(auth): add password reset redirect`)
- Add exclamtion point before `:` for breaking changes

### Phase 5: Summary

After all commits are created, show:

```
Commits Created
===============
<hash> <type>: <description> (N files)
<hash> <type>: <description> (N files)
...

Total: N commits, M files changed
Remaining unstaged: <count or "none">
```
