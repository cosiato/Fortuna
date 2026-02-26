# Contributing to Fortuna

Thank you for your interest in contributing to Fortuna! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report, please check the [existing issues](https://github.com/cosiato/Fortuna/issues) to avoid duplicates.

When filing a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Your environment (OS, app version)
- Screenshots if applicable

### Suggesting Features

Feature suggestions are welcome! Please open an [issue](https://github.com/cosiato/Fortuna/issues) first to discuss the idea before starting any work. Include:

- A clear description of the problem you want to solve
- Your proposed solution
- Alternative approaches you considered

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Ensure all tests pass
5. Push to your fork
6. Open a pull request

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/<your-username>/Fortuna.git
cd Fortuna

# Install dependencies
npm install

# Start the development server (Vite + Tauri)
npm run tauri dev
```

### Useful Commands

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `npm run tauri dev`     | Start development (Vite + Tauri) |
| `npm run tauri build`   | Build for production             |
| `npm run test`          | Run tests in watch mode          |
| `npm run test:run`      | Run tests once                   |
| `npm run test:coverage` | Run tests with coverage report   |
| `npm run lint`          | Lint TypeScript/React code       |
| `npm run format`        | Format code with Prettier        |
| `npm run format:check`  | Check code formatting            |

## Development Workflow

We follow a test-driven development approach:

1. **Write tests first** -- Define expected behavior before writing implementation
2. **Run tests** -- Confirm they fail (red)
3. **Implement** -- Write the minimal code to make tests pass (green)
4. **Refactor** -- Clean up while keeping tests green
5. **Verify coverage** -- Aim for 80%+ test coverage

### Running Tests

```bash
# Frontend tests (Vitest)
npm run test:run

# With coverage
npm run test:coverage
```

## Code Style

### General

- Prefer immutability -- never mutate objects or arrays
- Many small files over few large files (200-400 lines typical, 800 max)
- Organize by feature/domain, not by type
- No `console.log` or `console.error` in production code
- Proper error handling with try/catch
- Input validation with Zod (TypeScript) or strong types (Rust)

### TypeScript / React

- Follow existing patterns in the codebase
- ESLint and Prettier are configured -- run `npm run lint` and `npm run format` before committing
- Use async/await with try-catch for error handling
- Use Zod schemas for input validation

### Rust

- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Use `Result` and the `?` operator -- no `unwrap()` or `expect()` in production code
- Parameterized SQL queries only (no string interpolation)

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs`     | Documentation only                                      |
| `test`     | Adding or updating tests                                |
| `perf`     | Performance improvement                                 |
| `build`    | Build system or dependencies                            |
| `style`    | Code style (formatting, missing semicolons, etc.)       |

### Tips

- Keep commits small and focused
- Write clear, descriptive messages
- Split unrelated changes into separate commits

## Pull Request Process

1. **Open an issue first** -- Discuss the change before investing significant time
2. **Branch from `main`** -- Use a descriptive branch name: `feature/my-feature`, `fix/my-bugfix`
3. **Follow the code style** -- Run linting and formatting before pushing
4. **Write tests** -- New features and bug fixes should include tests
5. **Keep PRs focused** -- One feature or fix per pull request
6. **Describe your changes** -- Write a clear PR description explaining what and why

### PR Checklist

- [ ] Code follows the project style guidelines
- [ ] Tests are included and passing
- [ ] No hardcoded secrets or sensitive data
- [ ] Linting and formatting pass
- [ ] Branch is up to date with `main`

## Project Structure

Fortuna is a Tauri v2 desktop application with a Rust backend and React frontend.

```
src-tauri/          # Rust backend (SQLite, IPC commands)
src/                # React frontend
  components/       # UI components (organized by feature)
  hooks/            # Custom React hooks
  lib/              # Utility libraries and API layer
  locales/          # Translation files (en, fr, es, pt)
  types/            # TypeScript type definitions
```

For a detailed file map, see the project's [CLAUDE.md](.claude/CLAUDE.md) file structure section.

## Questions?

If you have questions or need help, feel free to open a [discussion](https://github.com/cosiato/Fortuna/issues) or reach out via an issue.

---

Thank you for contributing to Fortuna!
