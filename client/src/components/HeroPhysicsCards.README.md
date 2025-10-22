# HeroPhysicsCards Component

## Overview
An interactive 2D canvas component that displays cards with realistic physics simulation. Cards react to mouse movement, can be blown around with the Space key, and respond to boost mode with Shift.

## Usage

```tsx
import { HeroPhysicsCards } from '@/components/HeroPhysicsCards';

// Basic usage with default card images
<HeroPhysicsCards height={560} />

// With custom card images
<HeroPhysicsCards 
  imagePaths={[
    "/acilmis_kelime_kartlari/card1.png",
    "/acilmis_kelime_kartlari/card2.png",
    // ... more paths
  ]}
  height={600}
/>
```

## Props

- `imagePaths` (optional): Array of image paths for custom card faces. If not provided, generates synthetic cards with Turkish words.
- `height` (optional): Canvas height in pixels. Default: 560px.

## Customization

### Changing Card Count
Edit the `params.count` value in the component (default: 24). On mobile screens (<768px), automatically reduces to 16 cards.

### Modifying Physics Parameters
Adjust these values in the `params` object:
- `pushStrength`: Force of mouse push (0.7)
- `pushRadius`: Area of mouse influence (90px)
- `drag`: Linear friction (0.96)
- `angularDrag`: Rotational friction (0.96)
- `wallBounce`: Wall collision elasticity (0.20)

### Custom Card Images
Place your card images in `public/acilmis_kelime_kartlari/` folder and pass the paths via `imagePaths` prop. Cards are 92x58 pixels.

## Controls

- **Mouse Movement**: Push cards away from cursor
- **Space Key**: Activate blower mode (cards fly randomly)
- **Shift Key**: Boost mode (2x push strength)

## Performance

- Automatically pauses when not visible (tab switching, scrolling)
- Uses requestAnimationFrame for smooth 60fps animation
- Respects `prefers-reduced-motion` accessibility setting
- Optimized for both desktop and mobile devices

## Files Created

- `/client/src/components/HeroPhysicsCards.tsx` - Main component
- `/client/src/components/HeroPhysicsCards.README.md` - This documentation
- `/public/acilmis_kelime_kartlari/` - Directory for custom card images (optional)