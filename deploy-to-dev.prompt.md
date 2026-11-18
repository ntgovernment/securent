# Deploy to Dev Prompt

## Purpose

Automate the process of deploying changes to the development branch, including staging, summarizing, committing, and pushing changes.

## Steps

1. Review `git status` and the complete diff. Preserve existing work and include all requested changes.
2. Ensure the local `dev` branch is checked out. If it does not exist, create it from the intended release base; if `origin/dev` exists, synchronize with it before committing. Do not overwrite or force-push remote commits.
3. Run the relevant tests and build, and update directly related documentation.
4. Stage all requested changes:
   - `git add -A`
5. Commit with a concise summary of the complete change set.
6. Push the commit to the remote development branch:
   - `git push -u origin dev`

---

_This prompt is intended for Copilot or other automation agents to streamline the deployment workflow to the development branch._
