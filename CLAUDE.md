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
- **React Router DOM 7.10.1** for routing
- **ESLint** with TypeScript ESLint, React Hooks, and React Refresh plugins
- **FSD (Feature-Sliced Design)** - architectural methodology for organizing code by features/slices

### Project Structure

```
src/
├── pages/          # Page-level components (Profile, Exchange)
├── widgets/        # Complex UI components (Header)
├── shared/
│   ├── types/      # TypeScript type definitions
│   ├── lib/        # Business logic utilities (agentClient, companyManager)
│   └── contexts/   # React contexts (ThemeContext)
└── App.tsx         # Main application router
```

### Key Application Flow

1. **User Onboarding Flow** (`/` - Profile page):
   - User enters profile page with chatbot interface (similar to 1.png)
   - AI assistant conducts conversation to gather company information
   - User provides information about their team, capabilities, and portfolio
   - When profile is complete, backend returns JSON with `company_id` and `completion_token: "<TASK_DONE>"`
   - Company profile is saved to localStorage
   - "Start search" button appears to navigate to exchange page
   - Users can switch between multiple saved company profiles

2. **Order Matching Flow** (`/exchange` - Exchange page):
   - User selects a company profile (passed via navigation state)
   - AI agent receives `company_id` in message metadata
   - Backend processes profile data and returns matching government orders
   - Orders are displayed as cards within the chat interface with match scores
   - Users can filter orders through natural language queries

### Backend Integration

**API Endpoint**: `https://dfa652ee-bdb5-4b20-9cc8-ebe111228af2-agent.ai-agent.inference.cloud.ru` (proxied via `/api` in development)

The application communicates with an AI agent backend using a custom protocol:

- **Request Format**: JSON-RPC style with `id`, `params.message`, and `params.metadata`
- **Message Structure**: Messages have `role`, `parts` (text content), and `messageId`
- **Metadata**: Includes `session_id` (generated UUID) and optional `company_id`
- **Response Format**: Returns `result.history` array of messages
- **Special Responses**:
  - Company profile creation returns JSON with `company_id` and `completion_token: "<TASK_DONE>"`
  - Agent may include `<think>` tags (should be stripped from display)
  - Agent may include `<NEED_USER_INPUT>` markers

See `src/shared/lib/agentClient.ts` for full implementation details.

### State Management

- **Theme**: Global dark/light theme via `ThemeContext`, persisted to localStorage
- **Company Profiles**: Managed via `CompanyManager` utility, persisted to localStorage
- **Session Management**: Each page instance generates a unique `session_id` for agent conversations
- **Navigation State**: Company selection is passed between pages via React Router's location state

### TypeScript Configuration
- Uses project references with separate configs for app (`tsconfig.app.json`) and Node tooling (`tsconfig.node.json`)
- Main config is a composite that references both
- Strict mode enabled with additional linting rules

### Build Process
The build command (`npm run build`) runs in sequence:
1. TypeScript compiler check (`tsc -b`)
2. Vite production build

## Development Notes

- Mock data is available in `src/shared/lib/mockData.ts` for development
- The agent's text responses may contain `<think>` tags that should be cleaned before display
- Company profiles are stored in localStorage and persist across sessions
- Each chat session has a unique `session_id` generated on component mount
- When implementing new features, follow FSD principles for code organization
