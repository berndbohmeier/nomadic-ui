import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { checkVersion } from "./ci.mjs";

const paths = {
  packageJson: "package.json",
  tauriConfig: "src-tauri/tauri.conf.json",
  cargoManifest: "src-tauri/Cargo.toml",
  cargoLockfile: "src-tauri/Cargo.lock",
};
const versionPaths = [
  paths.packageJson,
  paths.tauriConfig,
  paths.cargoManifest,
];
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function components(version) {
  const match = stableVersion.exec(version);
  if (!match)
    throw new Error(`Expected a stable MAJOR.MINOR.PATCH version: ${version}`);
  return match.slice(1).map(BigInt);
}

export function nextVersion(current, choice) {
  const [major, minor, patch] = components(current);
  let next;
  switch (choice) {
    case "major":
      next = [major + 1n, 0n, 0n];
      break;
    case "minor":
      next = [major, minor + 1n, 0n];
      break;
    case "patch":
      next = [major, minor, patch + 1n];
      break;
    default:
      next = components(choice);
  }
  const previous = [major, minor, patch];
  const firstDifference = next.findIndex(
    (value, index) => value !== previous[index],
  );
  if (
    firstDifference === -1 ||
    next[firstDifference] < previous[firstDifference]
  ) {
    throw new Error("The new version must be greater than the current version");
  }
  return next.join(".");
}

function replaceUnique(text, pattern, expected, next, label) {
  const matches = [...text.matchAll(pattern)];
  if (matches.length !== 1 || matches[0][2] !== expected) {
    throw new Error(`Expected exactly one matching version in ${label}`);
  }
  const match = matches[0];
  return (
    text.slice(0, match.index) +
    match[1] +
    next +
    match[3] +
    text.slice(match.index + match[0].length)
  );
}

function replaceJsonVersion(text, expected, next, label) {
  if (JSON.parse(text).version !== expected) {
    throw new Error(`${label} version does not match ${expected}`);
  }
  const properties = [];
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "{" || character === "[") depth++;
    else if (character === "}" || character === "]") depth--;
    else if (character === '"') {
      const start = index;
      while (++index < text.length) {
        if (text[index] === "\\") index++;
        else if (text[index] === '"') break;
      }
      if (
        depth !== 1 ||
        JSON.parse(text.slice(start, index + 1)) !== "version"
      ) {
        continue;
      }
      const rest = text.slice(index + 1);
      const value = /^(\s*:\s*)"([^"\\]*)"/.exec(rest);
      if (value) {
        const valueStart = index + 1 + value[1].length + 1;
        properties.push({
          start: valueStart,
          end: valueStart + value[2].length,
          value: value[2],
        });
      }
    }
  }
  if (properties.length !== 1 || properties[0].value !== expected) {
    throw new Error(`Expected exactly one matching version in ${label}`);
  }
  return (
    text.slice(0, properties[0].start) + next + text.slice(properties[0].end)
  );
}

function replacePackageVersion(text, expected, next, label) {
  const tables = [
    ...text.matchAll(/^\[package\][^\S\r\n]*\r?\n[\s\S]*?(?=^\[|(?![\s\S]))/gm),
  ];
  if (tables.length !== 1) {
    throw new Error(`Expected exactly one package table in ${label}`);
  }
  const table = tables[0];
  const updated = replaceUnique(
    table[0],
    /^(\s*version\s*=\s*")([^"]+)("\s*)$/gm,
    expected,
    next,
    label,
  );
  return (
    text.slice(0, table.index) +
    updated +
    text.slice(table.index + table[0].length)
  );
}

export function prepareContents(original, choice) {
  const current = JSON.parse(original[paths.packageJson]).version;
  components(current);
  checkVersion(
    `v${current}`,
    original[paths.packageJson],
    original[paths.tauriConfig],
    original[paths.cargoManifest],
  );
  const next = nextVersion(current, choice);
  const updated = {
    [paths.packageJson]: replaceJsonVersion(
      original[paths.packageJson],
      current,
      next,
      paths.packageJson,
    ),
    [paths.tauriConfig]: replaceJsonVersion(
      original[paths.tauriConfig],
      current,
      next,
      paths.tauriConfig,
    ),
    [paths.cargoManifest]: replacePackageVersion(
      original[paths.cargoManifest],
      current,
      next,
      paths.cargoManifest,
    ),
  };
  checkVersion(
    `v${next}`,
    updated[paths.packageJson],
    updated[paths.tauriConfig],
    updated[paths.cargoManifest],
  );
  return { current, next, updated };
}

export function prepareRelease(
  root,
  choice,
  io = { readFileSync, writeFileSync, execFileSync },
) {
  const original = Object.fromEntries(
    Object.values(paths).map((path) => [
      path,
      io.readFileSync(resolve(root, path), "utf8"),
    ]),
  );
  const result = prepareContents(original, choice);
  const attempted = [];
  try {
    for (const path of versionPaths) {
      const file = resolve(root, path);
      if (io.readFileSync(file, "utf8") !== original[path]) {
        throw new Error(`${path} changed while preparing the release`);
      }
      attempted.push(path);
      io.writeFileSync(file, result.updated[path]);
    }
    for (const path of versionPaths) {
      if (
        io.readFileSync(resolve(root, path), "utf8") !== result.updated[path]
      ) {
        throw new Error(`Could not verify the updated ${path}`);
      }
    }
    if (
      io.readFileSync(resolve(root, paths.cargoLockfile), "utf8") !==
      original[paths.cargoLockfile]
    ) {
      throw new Error(
        `${paths.cargoLockfile} changed while preparing the release`,
      );
    }
    attempted.push(paths.cargoLockfile);
    io.execFileSync(
      "cargo",
      [
        "update",
        "--workspace",
        "--manifest-path",
        resolve(root, paths.cargoManifest),
      ],
      { cwd: root, stdio: "inherit" },
    );
  } catch (error) {
    const failures = [];
    for (const path of attempted.reverse()) {
      try {
        io.writeFileSync(resolve(root, path), original[path]);
      } catch (restoreError) {
        failures.push(
          new Error(`Could not restore ${path}`, { cause: restoreError }),
        );
      }
    }
    if (failures.length) {
      throw new AggregateError(
        [error, ...failures],
        "Release preparation failed; some files could not be restored",
      );
    }
    throw error;
  }
  return {
    current: result.current,
    next: result.next,
    paths: Object.values(paths),
  };
}

async function main() {
  const root = resolve(import.meta.dirname, "../..");
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let choice;
  try {
    choice = (
      await prompt.question(
        "Choose patch, minor, major, or manual (leave blank to cancel): ",
      )
    )
      .trim()
      .toLowerCase();
    if (!choice) return;
    if (choice === "manual") {
      choice = (
        await prompt.question(
          "Enter a stable MAJOR.MINOR.PATCH version (leave blank to cancel): ",
        )
      ).trim();
      if (!choice) return;
      components(choice);
    } else if (!["patch", "minor", "major"].includes(choice)) {
      throw new Error("Choose patch, minor, major, or manual");
    }
  } finally {
    prompt.close();
  }
  const result = prepareRelease(root, choice);
  console.log(`Prepared ${result.current} -> ${result.next}:`);
  for (const path of result.paths) console.log(`  ${path}`);
  console.log(
    "Changes are local and unstaged; commit, tag, push, and publish separately.",
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === realpathSync(process.argv[1])
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
