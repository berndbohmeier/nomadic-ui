import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  checkVersion,
  formats,
  stageArtifacts,
  validateArtifacts,
} from "./ci.mjs";

const pkg = JSON.stringify({ version: "1.2.3" });
const cargo =
  '[package]\nname = "nomadic"\nversion = "1.2.3"\n[dependencies]\n';

test("validates stable tags and all application versions", () => {
  checkVersion("v1.2.3", pkg, pkg, cargo);
  for (const tag of ["v1.2", "v01.2.3", "v1.2.3-rc.1", "1.2.3"]) {
    assert.throws(() => checkVersion(tag, pkg, pkg, cargo), /stable/);
  }
  assert.throws(
    () => checkVersion("v1.2.4", pkg, pkg, cargo),
    /does not match/,
  );
  assert.throws(
    () => checkVersion("v1.2.3", pkg, pkg, '[package]\nname = "x"'),
    /Cargo/,
  );
  assert.throws(
    () => checkVersion("v1.2.3", pkg, '{"version":"1.0.0"}', cargo),
    /tauri/,
  );
  assert.throws(
    () => checkVersion("v1.2.3", pkg, pkg, cargo.replace("1.2.3", "1.2.4")),
    /Cargo.toml/,
  );
});

test("stages and validates all platform installers", (t) => {
  const root = mkdtempSync(join(tmpdir(), "nomadic-ci-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [platform, extensions] of Object.entries(formats)) {
    const sources = join(root, `source-${platform}`);
    mkdirSync(sources);
    const paths = extensions.map((extension) => {
      const file = join(sources, `installer.${extension}`);
      writeFileSync(file, "installer");
      return file;
    });
    const output = join(root, `bundle-${platform}`);
    assert.throws(
      () => stageArtifacts(platform, paths.slice(1), output),
      /Expected exactly one/,
    );
    assert.throws(
      () => stageArtifacts(platform, [...paths, paths[0]], output),
      /Expected exactly one/,
    );
    stageArtifacts(platform, paths, output);
  }
  const paths = validateArtifacts(root, readdirSync);
  assert.equal(paths.length, 7);
  assert.equal(new Set(paths.map((path) => path.split("/").pop())).size, 7);
  writeFileSync(paths[0], "");
  assert.throws(() => validateArtifacts(root, readdirSync), /nonempty/);
});

test("release creation and reruns never modify a published release", (t) => {
  const root = mkdtempSync(join(tmpdir(), "nomadic-release-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, "bin");
  mkdirSync(bin);
  const log = join(root, "gh.log");
  writeFileSync(
    join(bin, "gh"),
    '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$MOCK_LOG"\nif [ "$1" = api ]; then\n  if [ "$MOCK_STATE" = error ]; then exit 1; fi\n  echo "$MOCK_STATE"\nfi\n',
    { mode: 0o755 },
  );
  const bundles = join(root, "bundles");
  for (const [platform, extensions] of Object.entries(formats)) {
    const directory = join(bundles, `bundle-${platform}`);
    mkdirSync(directory, { recursive: true });
    for (const extension of extensions) {
      writeFileSync(
        join(directory, `${platform}-installer.${extension}`),
        "test",
      );
    }
  }
  const run = (state) => {
    writeFileSync(log, "");
    const result = spawnSync("bash", [".github/scripts/release.sh"], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        TAG: "v1.2.3",
        REPOSITORY: "owner/repo",
        BUNDLE_DIRECTORY: bundles,
        MOCK_LOG: log,
        MOCK_STATE: state,
      },
    });
    return { result, calls: readFileSync(log, "utf8") };
  };
  const created = run("missing");
  assert.equal(created.result.status, 0);
  assert.match(created.calls, /release create v1\.2\.3 .*--draft --verify-tag/);
  const updated = run("draft");
  assert.equal(updated.result.status, 0);
  assert.match(updated.calls, /release upload v1\.2\.3 .*--clobber/);
  for (const state of ["published", "error", "unexpected"]) {
    const blocked = run(state);
    assert.notEqual(blocked.result.status, 0);
    assert.doesNotMatch(blocked.calls, /release (create|upload)/);
  }
  writeFileSync(
    join(bundles, "bundle-linux-x64", "linux-x64-installer.deb"),
    "",
  );
  const invalidAssets = run("missing");
  assert.notEqual(invalidAssets.result.status, 0);
  assert.equal(invalidAssets.calls, "");
});
