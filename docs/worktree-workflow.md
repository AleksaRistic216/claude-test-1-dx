# Worktree Workflow

This repo uses git worktrees to develop features in isolation, one per task, without disturbing the `master` checkout.

## How a worktree gets created

Worktrees are created with Claude Code's `EnterWorktree` tool (not `git worktree add` by hand). Each one:

- Lives under `.claude/worktrees/<name>` (e.g. `.claude/worktrees/feature+settings-page`)
- Checks out a new branch named `worktree-<name>` (e.g. `worktree-feature+settings-page`)
- Gets pushed and merged back into `master` via a normal PR once the task is done (see PR #1 for an example)

## Shared `node_modules`

`node_modules` is gitignored, so a freshly created worktree has none. Rather than running a full `npm install` in every worktree (slow, and duplicates hundreds of MB per worktree), this repo shares a single `node_modules` by linking each worktree's `node_modules` back to the main worktree's via a Windows directory junction:

```powershell
# run in the main worktree first, to keep the shared modules current
npm i

# then, in the new worktree
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path "node_modules" -Target "C:\Users\aleksa.ristic\source\gh-viewer\node_modules"
```

A directory junction is used instead of a symlink because it doesn't require admin rights or Developer Mode on Windows.

**Implication:** if a task needs to add, remove, or upgrade an npm package, run that `npm install` in the *main* worktree, not inside the task worktree — the task worktree has no `node_modules` of its own, so an install there would just replace the junction with a disconnected copy.

## Automating it: the `worktree-task` agent

`.claude/agents/worktree-task.md` encapsulates this workflow. Ask Claude Code to do something "in a separate worktree" and it creates/enters the worktree, refreshes and junctions `node_modules` as above, then carries out the requested task inside it.
