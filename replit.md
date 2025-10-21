# Katmannames - Replit Project

## Overview

Katmannames is a unique, multiplayer Turkish word-guessing game inspired by Codenames, but it is not the official Codenames game. It features real-time gameplay using WebSocket connections and is designed for deployment on Render. The project aims to provide an engaging, real-time multiplayer experience with a distinct visual style and robust technical foundation.

## User Preferences

I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to folder `shared/`.
Do not make changes to file `server/words.ts`.

## System Architecture

### UI/UX Decisions
The project features a dark navy/grey theme with a blue/red color scheme for the "Katman Koyu" (blue) and "Katman Açık" (red) teams. Unique two-layered modern card designs with distinct gradients and panels for each card type (Dark, Light, Neutral, Assassin) are implemented, including hover and flip animations. The design incorporates 3D card effects (textures, light, shadow), the Poppins font family, and a layered logo design. It is fully responsive for mobile devices and includes dynamic responsive scaling based on viewport size. Particles and light effects enhance the visual atmosphere across all pages.

### Technical Implementations
- **Frontend**: Built with React + TypeScript, Tailwind CSS for styling (custom dark theme), Wouter for lightweight routing, and Shadcn/ui for components. It utilizes a WebSocket client for real-time communication.
- **Backend**: Uses Express for the HTTP server and the `ws` library for real-time game rooms. Game state and room management are handled via in-memory storage. A Turkish word list of over 250 words is included.
- **Shared**: Contains TypeScript schemas and Zod validation for runtime type validation, ensuring consistent data structures between the frontend and backend.
- **WebSocket Management**: A central `WebSocketContext` manages a single, persistent WebSocket connection across page transitions, handling real-time events like `join_room`, `create_room`, `select_team`, `give_clue`, and `reveal_card`. It includes automatic reconnection, error handling, and stale connection cleanup.
- **Game Mechanics**: Features a 5x5 card grid with 25 cards total, including a random distribution of 9 cards for the starting team and 8 for the other, 7 neutral cards, and 1 assassin card. The game tracks revealed cards with a chronological history of the last 5.
- **Room Management**: Supports creating and joining rooms, real-time player lists, team and role selection, bot integration (owner-only), and dynamic team name changes. Password-protected rooms are supported.

### Feature Specifications
- User onboarding with name input.
- Real-time player list, team, and role selection.
- In-game mechanics: clue giving, card revealing, game state tracking, winner determination.
- Persistence across page refreshes.
- Owner-only features: adding bots, returning to lobby.
- Player features: leaving a room.
- Dynamic game elements: random card distribution (9-8 or 8-9), chronological reveal history.
- The UI includes custom background images, particle effects, and radial light effects.

### System Design Choices
- **Deployment Target**: Render, with specified build and start commands, and Node.js 20 environment.
- **Data Flow**: `shared/schema.ts` defines all data models and types for frontend-backend communication, validated by Zod.
- **State Management**: In-memory storage on the backend for game and room states.
- **Modularity**: Separation of concerns into `client/`, `server/`, and `shared/` directories.

## External Dependencies

- **React**: Frontend UI library.
- **TypeScript**: Language for type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **Wouter**: Lightweight React router.
- **Shadcn/ui**: UI component library.
- **Express**: Backend web framework.
- **ws**: WebSocket library for Node.js.
- **Zod**: Schema declaration and validation library.
- **Render**: Cloud platform for deployment.