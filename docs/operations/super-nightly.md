# Super Nightly

> Fork-only. This repository (`shootingallday/t3code`) tracks `pingdotgg/t3code` and ships its own
> Windows build, "T3 Code (Super Nightly)", with the fork's features on top of upstream.

## Branches

- `main` is a mirror of upstream `main`. Never commit to it. The workflow fast-forwards it.
- `super-nightly` is the product. Every fork commit lives here as a linear stack on top of
  upstream's latest published nightly. It is the default branch so scheduled workflows run from it.
- `super-nightly-next` is a scratch ref the workflow writes while a candidate is being verified.
  It is deleted after promotion.

## What the workflow does

`.github/workflows/super-nightly.yml` checks hourly at :28 UTC and on manual dispatch. Upstream
publishes nightlies at least six hours apart when there are new commits. A check builds only
when the candidate differs from the last Super Nightly release.

1. **Sync.** Fetches upstream, fast-forwards `main`, rebases `super-nightly` onto the latest published upstream nightly,
   and pushes the result to `super-nightly-next`. Skips the rest when the tree is identical to the
   last Super Nightly tag.
2. **Quality.** `vp check`, typecheck, and tests on the candidate.
3. **Build.** Windows x64 NSIS installer, unsigned, with the WSL node-pty prebuild bundled.
4. **Release.** Moves `super-nightly` to the candidate, then publishes a GitHub prerelease tagged
   `vX.Y.Z-nightly.YYYYMMDD.N` with the installer, blockmap, and `nightly.yml`.

If the rebase hits conflicts the workflow opens or updates the issue "Upstream sync conflict on
super-nightly" listing the files and stops without touching `super-nightly`. Any later failure opens
or updates "Super Nightly failed". The candidate is promoted only after quality checks and the
installer build pass. Publication follows promotion; a publication failure can leave the branch
promoted without a new release. Fix the failure and rerun the workflow.

Manual dispatch with `skip_sync` builds the current `super-nightly` without rebasing.

## Updates in the installed app

The installer bakes `app-update.yml` pointing at this repository's releases on the `nightly`
channel. The repository is public, so installed apps download updates without credentials.
An older private-feed installation needs this public-feed installer installed once; subsequent
updates use the normal install-and-restart prompt.

Required repository secrets:

- `SUPER_NIGHTLY_PUSH_TOKEN`: a fine-grained personal access token limited to this repository with
  `Contents: Read and write` and `Workflows: Read and write`. The sync and publish jobs push with it.
  The default Actions token cannot push a commit that changes any file under `.github/workflows`,
  so without this secret the sync fails as soon as upstream edits one of its workflows.

Renew the push token before its expiration and replace the Actions secret. Never embed a token
in a public installer.

Repository variables (public identifiers, the same ones `.env.example` documents):

- `T3CODE_CLERK_PUBLISHABLE_KEY`
- `T3CODE_CLERK_JWT_TEMPLATE`
- `T3CODE_CLERK_CLI_OAUTH_CLIENT_ID`
- `T3CODE_RELAY_URL`

## Resolving a sync conflict

```sh
cd <super-nightly worktree>
git fetch upstream main
git fetch upstream <nightly-commit-from-the-conflict-issue>
git rebase <nightly-commit-from-the-conflict-issue>
# resolve, then
git push --force-with-lease origin super-nightly
gh workflow run "Super Nightly" --field skip_sync=false
```

## After the workflow moved `super-nightly`

The rebase rewrites history, so a local checkout needs a reset rather than a pull:

```sh
git fetch origin
git status --short   # must be clean
git reset --hard origin/super-nightly
```

## Upstream workflows

Upstream's workflows are disabled on this repository. They target self-hosted runners and upstream
infrastructure that do not exist here, and would otherwise queue forever on every push to `main`.
Re-disable any new upstream workflow that appears after a sync:

```sh
gh workflow list --repo shootingallday/t3code
gh workflow disable <name> --repo shootingallday/t3code
```
