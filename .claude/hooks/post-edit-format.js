#!/usr/bin/env node
/**
 * PostToolUse Hook: Auto-format JS/TS/JSON/CSS files with Prettier after edits
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs after Edit/Write tool use. If the edited file matches supported
 * extensions, formats it with the project-local Prettier binary.
 * Falls back to npx if local binary is not found.
 * Fails silently if Prettier isn't installed.
 */

import { execFileSync } from "child_process"
import { dirname, resolve, join } from "path"
import { existsSync } from "fs"

const SUPPORTED_EXTENSIONS = /\.(ts|tsx|js|jsx|json|css)$/
const MAX_STDIN = 1024 * 1024 // 1MB limit
let data = ""
process.stdin.setEncoding("utf8")

process.stdin.on("data", (chunk) => {
  if (data.length < MAX_STDIN) {
    data += chunk
  }
})

/**
 * Walk up from a directory to find the nearest node_modules/.bin/prettier
 */
function findLocalPrettier(startDir) {
  let dir = startDir
  while (dir !== dirname(dir)) {
    const ext = process.platform === "win32" ? ".cmd" : ""
    const candidate = join(dir, "node_modules", ".bin", `prettier${ext}`)
    if (existsSync(candidate)) {
      return { bin: candidate, cwd: dir }
    }
    dir = dirname(dir)
  }
  return null
}

process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data)
    const filePath = input.tool_input?.file_path

    if (filePath && SUPPORTED_EXTENSIONS.test(filePath)) {
      try {
        const fileDir = dirname(resolve(filePath))
        const local = findLocalPrettier(fileDir)

        if (local) {
          execFileSync(local.bin, ["--write", filePath], {
            cwd: local.cwd,
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 15000,
          })
        } else {
          const npxBin = process.platform === "win32" ? "npx.cmd" : "npx"
          execFileSync(npxBin, ["prettier", "--write", filePath], {
            cwd: fileDir,
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 15000,
          })
        }
      } catch {
        // Prettier not installed, file missing, or failed -- non-blocking
      }
    }
  } catch {
    // Invalid input -- pass through
  }

  process.stdout.write(data)
  process.exit(0)
})
