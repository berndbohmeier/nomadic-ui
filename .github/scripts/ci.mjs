import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const formats = {
  "linux-x64": ["deb", "rpm", "AppImage"],
  "windows-x64": ["msi", "exe"],
  "macos-arm64": ["dmg"],
  "macos-x64": ["dmg"],
};

/**
 * Validate a stable vMAJOR.MINOR.PATCH tag against all three application versions.
 *
 * @param {string} tag - Git tag including the leading "v".
 * @param {string} packageJson - Contents of package.json.
 * @param {string} tauriJson - Contents of tauri.conf.json.
 * @param {string} cargoToml - Contents of Cargo.toml.
 * @throws {Error} If the tag, configuration, or versions are invalid.
 */
export function checkVersion(tag, packageJson, tauriJson, cargoToml) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error(`Expected a stable vMAJOR.MINOR.PATCH tag, got ${tag}`);
  }
  // Match the package section without crossing into the next TOML table.
  const section = cargoToml
    .split(/^\[/m)
    .find((part) => part.startsWith("package]"));
  const cargoVersion = section?.match(/^version\s*=\s*"([^"]+)"\s*$/m)?.[1];
  if (!section || !cargoVersion) {
    throw new Error("Could not read the Cargo package version");
  }
  const version = tag.slice(1);
  for (const [source, actual] of Object.entries({
    "package.json": JSON.parse(packageJson).version,
    "tauri.conf.json": JSON.parse(tauriJson).version,
    "Cargo.toml": cargoVersion,
  })) {
    if (actual !== version) {
      throw new Error(`${source} version ${actual} does not match ${tag}`);
    }
  }
}

/**
 * Copy one nonempty installer per required format into a staging directory.
 * Copied filenames are prefixed with the platform to avoid release asset collisions.
 *
 * @param {string} platform - A platform key from formats.
 * @param {string[]} paths - Artifact paths returned by tauri-action.
 * @param {string} outputDir - Directory for the staged copies.
 * @throws {Error} If the platform or required installers are invalid, or copying fails.
 */
export function stageArtifacts(platform, paths, outputDir) {
  const extensions = formats[platform];
  if (!extensions || !Array.isArray(paths)) {
    throw new Error(`Invalid platform or artifact paths: ${platform}`);
  }
  mkdirSync(outputDir, { recursive: true });
  for (const extension of extensions) {
    const matches = paths.filter((path) => path.endsWith(`.${extension}`));
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one .${extension} file for ${platform}`,
      );
    }
    const file = matches[0];
    const stat = statSync(file);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Installer is not a nonempty file: ${file}`);
    }
    copyFileSync(file, join(outputDir, `${platform}-${basename(file)}`));
  }
}

/**
 * Validate installers downloaded into bundle-<platform> directories for release.
 *
 * @param {string} root - Parent directory containing the downloaded bundles.
 * @param {(directory: string) => string[]} directoryEntries - Directory listing function.
 * @returns {string[]} Paths to the required nonempty installer files.
 * @throws {Error} If a required installer is missing, duplicated, or invalid.
 */
export function validateArtifacts(root, directoryEntries) {
  const files = [];
  for (const [platform, extensions] of Object.entries(formats)) {
    const directory = join(root, `bundle-${platform}`);
    const entries = directoryEntries(directory);
    for (const extension of extensions) {
      const matches = entries.filter(
        (name) =>
          name.startsWith(`${platform}-`) && name.endsWith(`.${extension}`),
      );
      if (matches.length !== 1) {
        throw new Error(
          `Expected exactly one .${extension} artifact for ${platform}`,
        );
      }
      const file = join(directory, matches[0]);
      const stat = statSync(file);
      if (!stat.isFile() || stat.size === 0) {
        throw new Error(`Artifact is not a nonempty file: ${file}`);
      }
      files.push(file);
    }
  }
  return files;
}

/**
 * Dispatch the version, stage, or validate CLI command using process arguments.
 * Stage reads TAURI_ARTIFACT_PATHS; validate prints one release asset path per line.
 *
 * @throws {Error} If the command or its inputs are invalid.
 */
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "version") {
    checkVersion(
      args[0],
      readFileSync("package.json", "utf8"),
      readFileSync("src-tauri/tauri.conf.json", "utf8"),
      readFileSync("src-tauri/Cargo.toml", "utf8"),
    );
    console.log(`Validated ${args[0]}`);
  } else if (command === "stage") {
    stageArtifacts(
      args[0],
      JSON.parse(process.env.TAURI_ARTIFACT_PATHS),
      args[1],
    );
  } else if (command === "validate") {
    for (const file of validateArtifacts(args[0], readdirSync))
      console.log(file);
  } else {
    throw new Error(`Unknown CI command: ${command}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
