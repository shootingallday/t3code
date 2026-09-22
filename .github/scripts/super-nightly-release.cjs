function hasUpdateAssets(release) {
  const assets = new Set(
    release.assets
      .filter((asset) => asset.state === "uploaded" && asset.size > 0)
      .map((asset) => asset.name),
  );
  return (
    assets.has("nightly.yml") &&
    [...assets].some(
      (name) => /^T3-Code-SuperNightly-.+-x64\.exe$/.test(name) && assets.has(`${name}.blockmap`),
    )
  );
}

async function findLatestCompleteRelease({ github, context }) {
  const releases = await github.paginate(github.rest.repos.listReleases, {
    ...context.repo,
    per_page: 100,
  });
  return releases
    .filter(
      (release) =>
        !release.draft &&
        release.published_at &&
        /^v.*-nightly\./.test(release.tag_name) &&
        hasUpdateAssets(release),
    )
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
}

module.exports = { hasUpdateAssets, findLatestCompleteRelease };
