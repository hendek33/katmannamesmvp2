# Katmannames - Replit Project

## Overview

Katmannames is a unique, multiplayer Turkish word-guessing game inspired by Codenames, but it is not the official Codenames game. It features real-time gameplay using WebSocket connections and is designed for deployment on Render. The project aims to provide an engaging, real-time multiplayer experience with a distinct visual style and robust technical foundation.

## User Preferences

I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to folder `shared/`.
Do not make changes to file `server/words.ts`.

## Recent Updates

### Word Tracking System (November 9, 2025)
- **No Word Repetition**: Once a word appears in a game, it won't appear again in subsequent games in the same room
- **Automatic Reset**: When all available words are used, the system automatically resets and starts fresh
- **Persistent Across Games**: Word tracking persists for the entire room session until all players leave

### Player Kick and Prophet Updates (November 9, 2025)
- **Game Screen Kick**: Room owners can now kick players during active games (not just in lobby)
- **Prophet Visibility Settings**: Room owners can configure what cards prophets can see:
  - **"Sadece Kendi Takımı" (own_team)**: Prophets see 3 random cards from their own team only (default)
  - **"Her İki Takım" (both_teams)**: Prophets see 3 random cards from both teams (not neutral/assassin)
  - **"Tüm Kartlar" (all_cards)**: Prophets see 3 random cards from all cards including neutral and assassin
  - **Lobby Control**: Dropdown selector under Chaos Mode settings (room owners only)
  - **Server Filtering**: Server properly masks cards not in prophet's knownCards array
- **Assassin Selection Block**: Prophet voting is now disabled if the assassin (black card) was selected
- **Opponent Last Card Block**: Prophet voting is disabled if losing team revealed opponent's last card
- **Minimized UI Position**: Minimized Prophet voting UI moved to bottom-left corner for better visibility
- **Removed Legacy UI**: Cleaned up old "Son Şans: Kahin Tahmini" button from header

### Chaos Mode Simplification (November 6, 2025)
- **Prophet Mode Only**: Simplified chaos mode to only include Prophet (Kahin) mode
- **Removed Double Agent**: Temporarily removed Double Agent (Çift Ajan) option for simpler gameplay
- **Automatic Mode Selection**: When chaos mode is enabled, Prophet mode is automatically selected
- **UI Improvements**: Cleaner chaos mode interface with instant activation and clear visual feedback

### Voting System Updates (November 6, 2025)
- **Vote Changing**: Players can now change their votes anytime during introduction phase
- **Clickable Vote Cards**: Like/dislike counts are now clickable cards with particle effects
- **Visual Feedback**: Selected vote shows with highlighted border and "Seçildi ✓" text
- **Removed Vote Lock**: Eliminated the voting lock mechanism for better flexibility

### Introduction UI Enhancements (November 6, 2025)
- **Enhanced Team Headers**: Premium glassmorphism design with animated gradients and pulsing icons
- **Improved Instructions**: Better visual hierarchy for spymaster instructions with glowing effects
- **Cleaner Animations**: Removed distracting background particles from "Tanışma Zamanı" title
- **Extended Display Time**: Introduction title now displays for 3.5 seconds (increased by 1 second)
- **Elegant Hover Animation**: Simplified player name bubble hover to subtle scale and lift effect with team-colored shadows
- **Advanced Like/Dislike Animations**: 
  - Multiple particles spread in circular pattern with rotation and glow effects
  - Spring physics for natural button press feedback with scale and rotation
  - Shadow glow on selected votes for better visual feedback
  - Smooth bounce animation when vote is registered

### Video Performance Optimizations (November 5, 2025)
- **Base64 Video Conversion**: Implemented VideoBase64Converter service to convert all videos to base64 format on app load
- **Inline Video Playback**: Created TurnVideoInline component using useInlineVideo hook for stutter-free video playback
- **Memory-Based Playback**: Videos are loaded into memory as base64 strings, eliminating network delays during playback
- **Multiple Optimization Layers**: SimpleVideoOptimizer, VideoCache, and Base64Converter working together for maximum performance

### Player Introduction Feature (November 5, 2025)
- **Introduction Phase**: New game phase where players introduce themselves before game starts
- **Controller System**: Red team (light) spymaster controls the introduction sequence
- **Interactive Cards**: Beautiful glassmorphism card design with hover effects for player selection
- **Like/Dislike System**: Players can vote on introductions with animated like/dislike badges
- **Visual Polish**: Rich animations, particle effects, team-colored cards with proper theming

## System Architecture

### UI/UX Decisions
The project features a dark navy/grey theme with a blue/red color scheme for the "Katman Koyu" (blue) and "Katman Açık" (red) teams. Unique two-layered modern card designs with distinct gradients and panels for each card type (Dark, Light, Neutral, Assassin) are implemented, including hover and flip animations. The design incorporates 3D card effects (textures, light, shadow), the Poppins font family, and a layered logo design. It is fully responsive for mobile devices and includes dynamic responsive scaling based on viewport size. Particles and light effects enhance the visual atmosphere across all pages.

### Technical Implementations
- **Frontend**: Built with React + TypeScript, Tailwind CSS for styling (custom dark theme), Wouter for lightweight routing, and Shadcn/ui for components. It utilizes a WebSocket client for real-time communication.
- **Backend**: Uses Express for the HTTP server and the `ws` library for real-time game rooms. Game state and room management are handled via in-memory storage. A Turkish word list of over 250 words is included.
- **Shared**: Contains TypeScript schemas and Zod validation for runtime type validation, ensuring consistent data structures between the frontend and backend.
- **WebSocket Management**: A central `WebSocketContext` manages a single, persistent WebSocket connection across page transitions, handling real-time events like `join_room`, `create_room`, `select_team`, `give_clue`, and `reveal_card`. It includes automatic reconnection, error handling, and stale connection cleanup.
- **Game Mechanics**: Features a 5x5 card grid with 25 cards total, including a random distribution of 9 cards for the starting team and 8 for the other, 7 neutral cards, and 1 assassin card. The game tracks revealed cards with a chronological history of the last 5. Cards have 3D hover effects with mouse-tracking tilt animations, shimmer effects on revealed cards.
- **Room Management**: Supports creating and joining rooms, real-time player lists, team and role selection, bot integration (owner-only), and dynamic team name changes. Password-protected rooms are supported.
- **UI Enhancements**: Team panels have hover elevation effects. "Hareket Çek" (taunt) button positioned below the blue team panel for better visibility and future button additions.

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