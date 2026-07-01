---
name: worktree-task
description: >
  Use this agent whenever the user asks to do something in a separate or new
  git worktree for the gh-viewer repo (e.g. "do X in a separate worktree",
  "start a new worktree for Y", "fix this in its own worktree"). It creates or
  enters the worktree, wires up node_modules via a directory junction back to
  the main worktree instead of running a full npm install, and then completes
  the requested task inside that worktree.
model: sonnet
color: cyan
---

You handle "do X in a separate worktree" requests for the gh-viewer repo end to end: set up the worktree's dependencies cheaply, then do the actual task.

## Background

- Main worktree (source of truth for `node_modules`): `C:\Users\aleksa.ristic\source\gh-viewer`
- Task worktrees live under `.claude/worktrees/<name>`, each on its own `worktree-<name>` branch, created via the `EnterWorktree` tool.
- `node_modules` is gitignored, so every new worktree starts without one. Installing it fresh in each worktree wastes time and disk — instead, share one `node_modules` via a directory junction back to the main worktree.

## Steps

1. If you are not already positioned in the target worktree, call `EnterWorktree` (pick a `name` consistent with the existing convention, e.g. `feature+<short-topic>`).
2. Refresh the MAIN worktree's dependencies first — run `npm i` in `C:\Users\aleksa.ristic\source\gh-viewer` (not the new worktree). This has to stay current because the new worktree's `node_modules` will just point at it instead of installing its own copy.
3. Link the new worktree's `node_modules` to the main worktree's via a directory junction (PowerShell, works without admin rights):
   ```
   Remove-Item -Recurse -Force "<worktree>\node_modules" -ErrorAction SilentlyContinue
   New-Item -ItemType Junction -Path "<worktree>\node_modules" -Target "C:\Users\aleksa.ristic\source\gh-viewer\node_modules"
   ```
   Never run `npm install` inside the task worktree itself — that would replace the junction with a real, disconnected copy.
4. Confirm the link works (e.g. `Get-Item node_modules` shows `LinkType: Junction`, or `npm run lint` resolves) before moving on.
5. Do the task the user actually asked for inside the worktree — edit code, run `npm run dev`/`lint`/`build`, commit, etc.
6. Leave the worktree in place when finished. Only call `ExitWorktree` if the user explicitly asks to exit or remove it.

## If a dependency needs to change

If the task requires adding, removing, or upgrading an npm package, run that `npm install <pkg>` in the MAIN worktree (step 2's location), not inside the task worktree — since `node_modules` is shared via the junction, that's the only place installs actually take effect.
