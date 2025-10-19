# Katmannames - Design Guidelines

## Design Approach
**User-Specified Custom Design** - The interface follows specific thematic requirements centered around a "layer" (katman) concept with distinct visual treatments for each card type.

## Core Design Elements

### A. Color Palette & Theme
**Primary Theme:**
- Dark blue/grayish background (koyu lacivert/grimsi)
- Overall dark mode aesthetic throughout

**Card-Specific Colors:**
- **Katman Koyu (Dark Layer):** Cold blue metallic feel - steel blue tones with metallic sheen
- **Katman Açık (Light Layer):** Turquoise/cyber neon aesthetic - bright cyan/aqua with neon glow effects
- **Tarafsız (Neutral):** Gray with subtle patterned neutral layer feel
- **Yasak (Forbidden):** Red-black contrast with warning/explosive effect styling - high-contrast danger aesthetic

### B. Typography
**Font Selection:**
- Modern, clean fonts: Inter or Poppins
- Text must be clearly readable against card textures and backgrounds
- Logo treatment: "Katmannames" with layer-themed design - thin lines within letters or overlapping structural elements suggesting layered depth

### C. Card Design System

**Surface Treatment (Critical - NOT Plain Flat Colors):**
- Subtle textures and patterns on backgrounds
- Light geometric or abstract layer effects
- Surface should include: texture + light/highlight effects + slight shadow for 3D dimensionality
- Rounded corners on all cards

**Visual Hierarchy:**
- Each card type has unique, distinctive design
- Cards should feel tactile and dimensional, not flat
- Textures must remain visible even when cards are scaled down on mobile

**Interactive States:**
- **Hover:** Card slightly comes forward (elevated), with glow or shimmer effect
- **Click/Reveal:** Flip animation or similar dramatic transition
- Animations should emphasize the layered, dimensional quality

### D. Layout & Spacing
**Game Board:**
- 5×5 grid of word cards
- Cards should have breathing room between them
- Grid must adapt responsively without breaking layout

**Information Hierarchy:**
- Top section: Room code, current turn indicator, remaining card counts
- Main area: Card grid dominates
- Input areas: Clue input for hint-givers positioned accessibly

**Responsive Behavior:**
- Mobile design must maintain textured card appearance
- Even when scaled down, cards retain their distinctive visual characteristics
- Layout adapts without visual degradation

### E. Component Specifications

**Cards:**
- Rounded corners
- Layered visual depth (texture + lighting + shadow)
- Team-specific theming as specified
- Forbidden card must visually demand attention

**Buttons & Controls:**
- Modern, matching overall dark aesthetic
- Clear visual feedback on interaction
- Turkish language for all labels

**Room/Lobby Interface:**
- Display room code prominently (copyable)
- Player list with team assignments visible
- Role selection (İpucu Veren/Hint-Giver vs Tahminci/Guesser) clearly indicated

### F. Animations
**Card Interactions:**
- Hover: Elevation + glow effect
- Click/Reveal: Flip or similar dramatic animation
- Keep animations smooth but not distracting from gameplay

**State Changes:**
- Turn transitions
- Team score updates
- Game end celebration

## Images
No hero images or photographs required. All visuals are generated through card design, textures, and effects.

## Special Requirements
- All text in Turkish
- "Bu oyun resmi Codenames değildir" disclaimer displayed subtly
- Room persistence: Players can rejoin after page refresh using room code + username
- Maintain visual consistency across welcome screen → lobby → game board → end screen