#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

const VALID_BUMPS = ["patch", "minor", "major"]

const bumpType = process.argv[2]

if (!bumpType || !VALID_BUMPS.includes(bumpType)) {
  const script = "npm run version:bump"
  process.stderr.write(`Usage: ${script} <patch|minor|major>\n`)
  process.stderr.write(`  patch  0.1.0 -> 0.1.1\n`)
  process.stderr.write(`  minor  0.1.0 -> 0.2.0\n`)
  process.stderr.write(`  major  0.1.0 -> 1.0.0\n`)
  process.exit(1)
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number)
  switch (type) {
    case "major":
      return `${major + 1}.0.0`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Invalid bump type: ${type}`)
  }
}

function updateJsonFile(filePath, newVersion) {
  const content = readFileSync(filePath, "utf-8")
  const json = JSON.parse(content)
  const oldVersion = json.version
  const updated = { ...json, version: newVersion }
  writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n", "utf-8")
  return oldVersion
}

function updateCargoToml(filePath, newVersion) {
  const content = readFileSync(filePath, "utf-8")
  const updated = content.replace(
    /^(version\s*=\s*)"[^"]*"/m,
    `$1"${newVersion}"`,
  )
  writeFileSync(filePath, updated, "utf-8")
}

const packageJsonPath = resolve(root, "package.json")
const tauriConfPath = resolve(root, "src-tauri", "tauri.conf.json")
const cargoTomlPath = resolve(root, "src-tauri", "Cargo.toml")

const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
const oldVersion = pkg.version
const newVersion = bumpVersion(oldVersion, bumpType)

updateJsonFile(packageJsonPath, newVersion)
updateJsonFile(tauriConfPath, newVersion)
updateCargoToml(cargoTomlPath, newVersion)

process.stdout.write(`Bumped version: ${oldVersion} -> ${newVersion}\n`)
process.stdout.write(`  Updated: package.json\n`)
process.stdout.write(`  Updated: src-tauri/tauri.conf.json\n`)
process.stdout.write(`  Updated: src-tauri/Cargo.toml\n`)
process.stdout.write(`\nNext steps:\n`)
process.stdout.write(`  npm run tauri dev          # regenerate Cargo.lock\n`)
process.stdout.write(`  git add -A && git commit -m "chore: bump version to ${newVersion}"\n`)
process.stdout.write(`  git tag v${newVersion}\n`)
process.stdout.write(`  git push && git push --tags\n`)
