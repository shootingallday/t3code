# Workflow deviations for this fork

This repository is `shootingallday/t3code`, a private fork that ships "T3 Code (Super Nightly)".
Everything not listed here follows the global workflow.

- Issues, specs, and decisions live on this repository only. Never open issues, discussions, or
  pull requests on `pingdotgg/t3code`.
- `super-nightly` is the default branch and the only branch pull requests target. `main` mirrors
  upstream and is never committed to. Branch mechanics: `docs/operations/super-nightly.md`.
- Upstream CI is disabled here and no check runs on pull requests. Proof is local: focused tests,
  lint, and typecheck for the touched scope, recorded in the pull request body. The daily Super
  Nightly workflow runs the full suite on the rebased branch before it moves `super-nightly`.
- Merge with rebase or squash. Merge commits are disabled so the daily rebase onto upstream stays
  linear.
- After the workflow moves `super-nightly`, local checkouts need `git reset --hard origin/super-nightly`,
  not a pull.
