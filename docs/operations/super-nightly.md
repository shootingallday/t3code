# Super Nightly

> Fork-only. This repository (`shootingallday/t3code`) tracks `pingdotgg/t3code` and ships its own
> Windows build, "T3 Code (Super Nightly)", with the fork's features on top of upstream.

## Branches

- `main` is a mirror of upstream `main`. Never commit to it. The workflow fast-forwards it.
- `super-nightly` is the product. Every fork commit lives here as a linear stack on top of
  upstream `main`. It is the repository's default branch so scheduled workflows run from it.
- `super-nightly-next` is a scratch ref the workflow writes while a candidate is being verified.
  It is deleted after promotion.

## What the workflow does

`.github/workflows/super-nightly.yml` runs daily and on manual dispatch:

1. **Sync.** Fetches upstream, fast-forwards `main`, rebases `super-nightly` onto upstream `main`,
   and pushes the result to `super-nightly-next`. Skips the rest when the tree is identical to the
   last Super Nightly tag.
2. **Quality.** `vp check`, typecheck, and tests on the candidate.
3. **Build.** Windows x64 NSIS installer, unsigned, with the WSL node-pty prebuild bundled.
4. **Release.** Moves `super-nightly` to the candidate, then publishes a GitHub prerelease tagged
   `vX.Y.Z-nightly.YYYYMMDD.N` with the installer, blockmap, and `nightly.yml`.

If the rebase hits conflicts the workflow opens or updates the issue "Upstream sync conflict on
super-nightly" listing the files and stops without touching `super-nightly`. Any later failure opens
or updates "Super Nightly failed". `super-nightly` only moves when everything is green.

Manual dispatch with `skip_sync` builds the current `super-nightly` without rebasing.

## Updates in the installed app

The installer bakes `app-update.yml` pointing at this repository's releases on the `nightly`
channel. Because the repository is private, the build embeds a read-only token so the installed app
can list and download release assets.

Required repository secret:

- `T3CODE_DESKTOP_UPDATE_TOKEN`: a fine-grained personal access token limited to this repository
  with `Contents: Read`. Without it the build still ships, with a warning, but the installed app
  cannot check for updates. Rotate it before it expires and rerun the workflow; the next installed
  update carries the new token.

Repository variables (public identifiers, the same ones `.env.example` documents):

- `T3CODE_CLERK_PUBLISHABLE_KEY`
- `T3CODE_CLERK_JWT_TEMPLATE`
- `T3CODE_CLERK_CLI_OAUTH_CLIENT_ID`
- `T3CODE_RELAY_URL`

## Resolving a sync conflict

```sh
cd <super-nightly worktree>
git fetch upstream main
git rebase upstream/main
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
