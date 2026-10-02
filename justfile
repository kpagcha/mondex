# Shortcuts for the npm scripts; run `just` to list them.

set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# List the recipes
default:
    @just --list

# Dev server with hot reload (also reachable from a phone on the same Wi-Fi)
dev:
    npm run dev

# Dev server with Vue's per-component timings in the Performance panel (which components re-render; durations inflated)
dev-profile $VITE_PROFILE="true":
    npm run dev

# Type-check and build the production site into dist/
build:
    npm run build

# Build, then serve the production site at http://localhost:4173/mondex/ (profile performance here)
preview: build
    npm run preview
