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

## Docker Deployment

The project includes Docker support for both development and production environments.

### Development Mode (with hot reload)

```bash
# Start development server with hot reload
docker-compose -f docker-compose.dev.yml up

# Access application at http://localhost:5173
```

**Features:**
- Vite dev server with hot module replacement (HMR)
- Source code volume mounting for instant updates
- API proxy to backend configured
- File watching with polling (works on Windows/Mac/Linux)

### Production Mode

```bash
# Build and start production server
docker-compose up -d

# Access application at http://localhost:8080

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

**Features:**
- Nginx serving optimized static build
- Gzip compression enabled
- Static asset caching (1 year expiry)
- SPA routing configured
- API proxy to backend
- Health check endpoint at `/health`
- Security headers (X-Content-Type-Options, X-Frame-Options)

### Environment Variables

The project uses environment variables for configuration. Create a `.env` file in the project root:

```env
VITE_AGENT_BASE_URL=https://dddaf9c8-180e-4976-8a95-0cb1a1958523-agent.ai-agent.inference.cloud.ru
```

For development mode, the `.env` file is automatically mounted. For production, the backend URL is configured in `nginx.conf`.

### Docker Architecture

- **Multi-stage Dockerfile** with 4 stages:
  1. `base` - Install Node.js dependencies
  2. `development` - Dev server setup
  3. `builder` - Production build
  4. `production` - Nginx with static files
- **Development image**: ~300MB (includes Node.js and source)
- **Production image**: <50MB (only Nginx and static files)

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

**API Endpoint**: `https://dddaf9c8-180e-4976-8a95-0cb1a1958523-agent.ai-agent.inference.cloud.ru` (proxied via `/api` in development)

The application uses the **official @a2a-js/sdk** package to communicate with the A2A agent backend:

- **SDK**: `@a2a-js/sdk` (official A2A JavaScript SDK)
- **Client**: `A2AClient` class handles all protocol details automatically
- **Agent Card**: Fetched from `/.well-known/agent-card.json` on initialization
- **URL Override**: Agent card's internal URL is overridden with the public endpoint
- **Lazy Initialization**: Client is initialized on first message send
- **Message Format**: Uses `MessageSendParams` type from SDK with:
  - `message`: Contains user text in `parts` array with `messageId`
  - `configuration`: Blocking mode, accepted output modes
  - `metadata`: Includes `session_id` (generated UUID) and optional `company_id`
- **Response Types**: SDK-provided `Message` and `Task` types
- **Protocol**: Automatic JSON-RPC 2.0 handling by SDK
- **Features**: Streaming support, task management, artifact handling
- **Special Responses**:
  - Company profile creation returns JSON with `company_id` and `completion_token: "<TASK_DONE>"`
  - Agent may include `<think>` tags (should be stripped from display)
  - Agent may include `<NEED_USER_INPUT>` markers

See `src/shared/lib/agentClient.ts` for implementation using `A2AClient` with agent card URL override.

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
