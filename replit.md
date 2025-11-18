# Katmannames - Replit Projesi

## Overview
Katmannames is a real-time, multiplayer Turkish word-guessing game inspired by Codenames, designed for deployment on Render using WebSocket connections. The project aims to deliver an engaging, real-time multiplayer experience with a distinct visual style and robust technical foundation. It features a unique game experience with a strong emphasis on modern UI/UX and dynamic gameplay mechanics.

## User Preferences
Detaylı açıklamaları tercih ediyorum.
Tekrarlı geliştirme istiyorum.
Büyük değişiklikler yapmadan önce sor.

## System Architecture

### UI/UX Decisions
The project features a dark navy/grey theme with a blue/red color scheme for "Katman Koyu" (blue) and "Katman Açık" (red) teams. It incorporates unique two-layered modern card designs with distinct gradients and panels for each card type (Dark, Light, Neutral, Assassin), including hover and flip animations. The design includes 3D card effects (textures, light, shadow), the Poppins font family, and a layered logo. It is fully responsive for mobile devices with dynamic scaling based on viewport size. Particles and light effects enhance the visual atmosphere across all pages. Recent enhancements include glassmorphism design for voting windows and advanced animation sequences for in-game events.

### Technical Implementations
- **Frontend**: Built with React + TypeScript, styled using Tailwind CSS (custom dark theme), Wouter for lightweight routing, and Shadcn/ui for components. It utilizes a WebSocket client for real-time communication.
- **Backend**: Employs Express for the HTTP server and the `ws` library for real-time game rooms. Game state and room management are handled with in-memory storage. Includes a Turkish word list of over 250 words.
- **Shared**: Contains TypeScript schemas and Zod validation for consistent data structures between frontend and backend, ensuring runtime type validation.
- **WebSocket Management**: A central `WebSocketContext` manages a single, persistent WebSocket connection across page transitions, handling real-time events like `join_room`, `create_room`, `select_team`, `give_clue`, and `reveal_card`. It includes automatic reconnection, error handling, and cleanup of stale connections.
- **Game Mechanics**: Features a 5x5 card grid with 25 cards, including random distribution (9-8 or 8-9 for teams), 7 neutral, and 1 assassin card. The game tracks revealed cards with a chronological history of the last 5. Cards have 3D hover effects with mouse-tracked tilt animations and sparkle effects on revealed cards.
- **Room Management**: Supports room creation and joining, real-time player lists, team and role selection, bot integration (owner-only), and dynamic team name changes. Password-protected rooms are supported.
- **In-game Features**: Includes a player introduction phase with interactive glassmorphism cards and a like/dislike/boo/applaud reaction system with unique particle effects. A word tracking system prevents word repetition within the same room until all words are used, then resets. Room owners can kick players during active games and configure spymaster visibility settings ("Own Team", "Both Teams", "All Cards"). Spymaster voting is disabled if the assassin card is picked or the opposing team reveals the last card.

### Feature Specifications
- User registration with name input.
- Real-time player list, team, and role selection.
- In-game mechanics: clue giving, card revealing, game state tracking, winner determination.
- Persistence across page refreshes.
- Owner-only features: adding bots, returning to lobby.
- Player features: leaving a room.
- Dynamic game elements: random card distribution, chronological reveal history.
- UI includes custom background images, particle effects, and radial light effects.

### System Design Choices
- **Deployment Target**: Render, with specified build and start commands, and a Node.js 20 environment.
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
- **Zod**: Schema definition and validation library.
- **Render**: Cloud platform for deployment.