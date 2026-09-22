const assert = require("node:assert/strict");
const test = require("node:test");
const { hasUpdateAssets, findLatestCompleteRelease } = require("./super-nightly-release.cjs");

const installer = "T3-Code-SuperNightly-0.0.43-nightly.20260922.31-x64.exe";
const complete = {
  tag_name: "v0.0.43-nightly.20260922.31",
  draft: false,
  published_at: "2026-09-22T12:00:00Z",
  assets: [installer, `${installer}.blockmap`, "nightly.yml"].map((name) => ({
    name,
    state: "uploaded",
    size: 100,
  })),
};

test("a complete update requires an installer, its blockmap, and the nightly feed", () => {
  assert.equal(hasUpdateAssets(complete), true);
  for (const missing of complete.assets) {
    assert.equal(
      hasUpdateAssets({
        ...complete,
        assets: complete.assets.filter((asset) => asset !== missing),
      }),
      false,
    );
  }
  assert.equal(
    hasUpdateAssets({
      ...complete,
      assets: complete.assets.map((asset) =>
        asset.name === `${installer}.blockmap` ? { ...asset, name: "other.exe.blockmap" } : asset,
      ),
    }),
    false,
  );
});

test("empty or unfinished uploads do not count as update assets", () => {
  for (const override of [{ size: 0 }, { state: "starter" }]) {
    assert.equal(
      hasUpdateAssets({
        ...complete,
        assets: complete.assets.map((asset) => ({ ...asset, ...override })),
      }),
      false,
    );
  }
});

test("an incomplete newer release or draft does not suppress recovery", async () => {
  const newer = { ...complete, published_at: "2026-09-22T18:00:00Z" };
  const options = {
    context: { repo: { owner: "shootingallday", repo: "t3code" } },
    github: {
      rest: { repos: { listReleases: {} } },
      paginate: async () => [
        { ...newer, draft: true },
        { ...newer, assets: complete.assets.slice(0, 1) },
        { ...newer, tag_name: "v0.0.43" },
        complete,
      ],
    },
  };
  assert.equal(await findLatestCompleteRelease(options), complete);
  options.github.paginate = async () => [{ ...newer, assets: [] }];
  assert.equal(await findLatestCompleteRelease(options), undefined);
});

test("the newest complete release is selected by publication time", async () => {
  const newer = { ...complete, published_at: "2026-09-22T18:00:00Z" };
  const result = await findLatestCompleteRelease({
    context: { repo: { owner: "shootingallday", repo: "t3code" } },
    github: {
      rest: { repos: { listReleases: {} } },
      paginate: async () => [complete, newer],
    },
  });
  assert.equal(result, newer);
});
