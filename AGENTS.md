# Project memory

## Notes

- Git commits are written in English.
- use bun for frontend dependencies and scripts (do not mix in npm/pnpm/yarn).
- shadcn/ui use 'react-aria-components' instead of 'radix-ui'.

## AI workflow rules

- Only make the requested changes: do not refactor, reformat, or "improve" unrelated code.
- Follow the existing code style (indentation, naming, and comment language consistent with the surrounding code).
- Do not add dependencies, configuration, or features that were not asked for.
- Frontend dependencies and scripts must use `bun` (do not mix in npm/pnpm/yarn).
- Verify after changes: `cargo check` for Rust, `bun run typecheck` for the frontend.
- Review the diff before committing: no leftover files or unrelated changes.
