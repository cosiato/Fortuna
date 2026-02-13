#!/usr/bin/env node
/**
 * PostToolUse Hook: TypeScript check after editing .ts/.tsx files
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs after Edit tool use on TypeScript files. Walks up from the file's
 * directory to find the nearest tsconfig.json, then runs tsc --noEmit
 * and reports only errors related to the edited file.
 */

import { execFileSync } from "child_process"
import { existsSync } from "fs"
import { resolve, dirname, parse, join, relative, basename } from "path"

const MAX_STDIN = 1024 * 1024 // 1MB limit
let data = ""
process.stdin.setEncoding("utf8")

process.stdin.on("data", (chunk) => {
  if (data.length < MAX_STDIN) {
    data += chunk
  }
})

process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data)
    const filePath = input.tool_input?.file_path

    if (filePath && /\.(ts|tsx)$/.test(filePath)) {
      const resolvedPath = resolve(filePath)
      if (!existsSync(resolvedPath)) {
        process.stdout.write(data)
        process.exit(0)
      }
      // Find nearest tsconfig.json by walking up (max 20 levels to prevent infinite loop)
      let dir = dirname(resolvedPath)
      const root = parse(dir).root
      let depth = 0

      while (dir !== root && depth < 20) {
        if (existsSync(join(dir, "tsconfig.json"))) {
          break
        }
        dir = dirname(dir)
        depth++
      }

      if (existsSync(join(dir, "tsconfig.json"))) {
        try {
          // Use npx.cmd on Windows to avoid shell: true which enables command injection
          const npxBin = process.platform === "win32" ? "npx.cmd" : "npx"
          execFileSync(npxBin, ["tsc", "--noEmit", "--pretty", "false"], {
            cwd: dir,
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 30000,
          })
        } catch (err) {
          // tsc exits non-zero when there are errors — filter to edited file
          const output = (err.stdout || "") + (err.stderr || "")
          // Compute paths that uniquely identify the edited file.
          // tsc output uses paths relative to its cwd (the tsconfig dir),
          // so check for the relative path, absolute path, and original path.
          // Avoid bare basename matching — it causes false positives when
          // multiple files share the same name (e.g., src/utils.ts vs tests/utils.ts).
          const relPath = relative(dir, resolvedPath)
          const candidates = new Set([filePath, resolvedPath, relPath])
          const relevantLines = output
            .split("\n")
            .filter((line) => {
              for (const candidate of candidates) {
                if (line.includes(candidate)) return true
              }
              return false
            })
            .slice(0, 10)

          if (relevantLines.length > 0) {
            console.error("[Hook] TypeScript errors in " + basename(filePath) + ":")
            relevantLines.forEach((line) => console.error(line))
          }
        }
      }
    }
  } catch {
    // Invalid input — pass through
  }

  process.stdout.write(data)
  process.exit(0)
})
