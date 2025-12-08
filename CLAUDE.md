# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GosLance** is a government contractor freelance platform that connects teams with government orders (EIS outsourcing). Built with React 19 + TypeScript + Vite, using Feature-Sliced Design (FSD) architecture.

The application consists of two main pages:
1. **Profile/Onboarding** - Chatbot interface where an AI assistant asks leading questions to understand the user's team, capabilities, and portfolio
2. **Orders Exchange** - AI-powered matching system that displays suitable government contract opportunities

**Design Theme**: Modern, minimalist black and blue color scheme (see 1.png and 2.png for reference designs)

## Development Commands

```bash
# Development server with HMR
npm run dev

# Build for production (runs TypeScript check + Vite build)
npm run build

# Lint all TypeScript files
npm run lint

# Preview production build locally
npm run preview
```

## Architecture & Structure

### Technology Stack
- **React 19.2.0** with TypeScript
- **Vite 7.2.4** for build tooling and dev server
- **ESLint** with TypeScript ESLint, React Hooks, and React Refresh plugins
- **FSD (Feature-Sliced Design)** - architectural methodology for organizing code by features/slices

### Key Application Flow

1. **User Onboarding Flow**:
   - User enters profile page with chatbot interface (similar to 1.png)
   - Assistant asks sequential questions:
     - "Write down who you are (who your team is, what you do). Your project portfolio."
     - "What is your current employment, what are you currently working on?"
   - After all questions answered, "Start search" button appears above chat input
   - All answers are sent to neural network endpoint in batch

2. **Order Matching Flow**:
   - After clicking "Start search", user is redirected to exchange page
   - Neural network processes user profile data
   - Displays government orders ranked by relevance (interface similar to 2.png)

### TypeScript Configuration
- Uses project references with separate configs for app (`tsconfig.app.json`) and Node tooling (`tsconfig.node.json`)
- Main config is a composite that references both

### Build Process
The build command (`npm run build`) runs in sequence:
1. TypeScript compiler check (`tsc -b`)
2. Vite production build

## Development Notes

- This is a new project (initial commit only) - the boilerplate React + Vite app needs to be replaced with the GosLance feature implementation
- Mock data should be used for the assistant's questions during development
- Neural network integration endpoint needs to be implemented to receive user profile data and return matched government orders
- When implementing components, follow FSD principles for code organization
