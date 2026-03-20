# /git-checkpoint — Create Git Commit

Save the current progress as a git commit checkpoint.

## Steps

1. Run `git status` — list modified and new files to the user.
   - Skip: `dist/`, `node_modules/`, auto-generated `.d.ts`, `*.jsonl`.

2. If commit message not provided — suggest one based on recent changes.
   - Format: imperative English, `<type>: <short description>`
   - Examples: `feat: add CompareToolbar component`, `fix: sync master ticker on animation change`
   - Ask: "Commit message: `<suggestion>` — підтверджуєш?"

3. Stage relevant files explicitly and commit:
   ```bash
   git add <specific files>
   git commit -m "<message>"
   ```
   - **Never** use `git add .` or `git add -A`
   - **Never** skip hooks (`--no-verify`)

4. Show `git log --oneline -3` to confirm.

## Commit type prefixes

| Prefix | When to use |
|--------|-------------|
| `feat` | New feature or component |
| `fix`  | Bug fix |
| `refactor` | Code cleanup, no behavior change |
| `style` | CSS / formatting only |
| `docs` | README, comments, PLAN.md |
| `chore` | Config, build, dependencies |

## Version bump workflow

If the user says "bump version" or "нова версія":
1. Ask: `patch` (x.x.**X**), `minor` (x.**X**.0), or `major` (**X**.0.0)?
2. Update `version` in `package.json`.
3. Commit: `chore: bump version to x.x.x`
