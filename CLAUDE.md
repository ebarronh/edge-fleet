# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EdgeFleet is a demo monorepo for edge computing fleet management with real-time WebSocket communication and Supabase integration. **This is for demo purposes with a real Supabase database.**

## Essential Commands

```bash
# Setup and start complete demo
npm install && ./start-demo.sh

# Before marking any task complete, ALWAYS run:
npm run build && npm run lint && npm run type-check && npm test
```

## Task Completion Requirements

**CRITICAL**: Every task must pass ALL checks before completion:
1. `npm run build` - Must build successfully  
2. `npm run lint` - Must pass linting
3. `npm run type-check` - Must pass type checking
4. `npm test` - Must pass all tests
5. Basic UI validation using Puppeteer MCP (if UI changes)

## Testing Framework

**Use Vitest** for all React TypeScript testing:
- Seamless Vite integration with shared configuration
- Jest-compatible API for easy migration
- Built-in TypeScript/JSX support via esbuild
- Fast HMR test iteration

Setup: Add Vitest to each React app's package.json and configure in vite.config.ts with `globals: true`, `environment: 'jsdom'`.

## MCP Integration Capabilities

### Supabase MCP
- **Database Operations**: Create/read/update/delete with advanced filtering
- **Schema Management**: Apply migrations, manage tables via `apply_migration` tool
- **Safety Features**: Three-tier operation safety (safe/write/destructive), read-only mode protection
- **Best Practice**: Use database branching for development to protect production data

### Puppeteer MCP  
- **UI Testing**: Automate browser interactions, form filling, navigation
- **Screenshot Validation**: Capture visual regression testing evidence
- **Console Monitoring**: Access browser logs for debugging
- **Integration**: Use for basic UI validation before task completion

## Architecture

- **Monorepo**: Turborepo with shared Supabase client package
- **Communication**: WebSocket server (3999) + Supabase real-time features
- **Ports**: Fleet Command (3000), Vessels (3001-3003), WebSocket (3999)
- **Dependencies**: Uses `file:` references instead of `workspace:` for npm compatibility

## Development Rules

- Never sign commits with Claude Code
- Always validate UI changes with Puppeteer MCP when applicable
- Use Supabase MCP for safe database operations with proper safety tiers
- Test everything before task completion