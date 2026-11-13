# Project guidance

- Application source is under `src/`.
- Ignore generated output in `dist/`, `coverage/`, `.next/` and `node_modules/`.
- Use TypeScript and preserve strict typing.
- Reuse existing utilities and components before creating new ones.
- For UI work, inspect only the affected component, its direct imports and tests.
- Run targeted tests for changed files. Do not run the entire test suite unless requested.
- Do not inspect generated files, minified files, source maps or lock files unless the task requires them.
- Keep responses concise. Do not explain unchanged code.
