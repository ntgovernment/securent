# Deploy to Dev Prompt

## Purpose

Automate the process of deploying changes to the development branch, including staging, summarizing, committing, and pushing changes.

## Steps

1. Stage all changes:
   - `git add .`
2. Generate a summary of all changes made during the current chat session.
3. Commit the changes to the `dev` branch using the generated summary as the commit message.
4. Push the commit to the remote `dev` branch:
   - `git push origin dev`

---

_This prompt is intended for Copilot or other automation agents to streamline the deployment workflow to the development branch._
