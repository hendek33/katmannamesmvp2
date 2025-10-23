import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface Bubble {
  id: string;
  team: 'dark' | 'light';
  timestamp: number;
  duration: number;
  type: 'taunt' | 'insult';
}

interface BubbleManagerContextType {
  registerBubble: (bubble: Bubble) => number; // Returns vertical offset
  unregisterBubble: (id: string) => void;
  getVerticalOffset: (id: string) => number;
}

const BubbleManagerContext = createContext<BubbleManagerContextType | null>(null);

export function BubbleManagerProvider({ children }: { children: ReactNode }) {
  const [bubbles, setBubbles] = useState<Map<string, Bubble & { offset: number }>>(new Map());
  const offsetsRef = useRef<Map<string, number>>(new Map());

  // Calculate vertical offset for a new bubble
  const registerBubble = (bubble: Bubble): number => {
    const sameSideBubbles = Array.from(bubbles.values())
      .filter(b => b.team === bubble.team)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Calculate offset based on existing bubbles
    let offset = 0;
    for (const existingBubble of sameSideBubbles) {
      // Each bubble adds 120px to the offset (bubble height + spacing)
      offset += existingBubble.type === 'taunt' ? 130 : 90;
    }

    // Store the bubble with its offset
    setBubbles(prev => {
      const newMap = new Map(prev);
      newMap.set(bubble.id, { ...bubble, offset });
      return newMap;
    });

    offsetsRef.current.set(bubble.id, offset);
    
    // Set up auto-removal
    setTimeout(() => {
      unregisterBubble(bubble.id);
    }, bubble.duration);

    return offset;
  };

  // Remove a bubble and update positions of others
  const unregisterBubble = (id: string) => {
    setBubbles(prev => {
      const newMap = new Map(prev);
      const removedBubble = newMap.get(id);
      
      if (removedBubble) {
        newMap.delete(id);
        
        // Get the height of the removed bubble
        const removedHeight = removedBubble.type === 'taunt' ? 130 : 90;
        
        // Update offsets for bubbles from the same team that were below this one
        newMap.forEach((bubble, bubbleId) => {
          if (bubble.team === removedBubble.team && bubble.offset > removedBubble.offset) {
            bubble.offset -= removedHeight;
            offsetsRef.current.set(bubbleId, bubble.offset);
          }
        });
      }
      
      offsetsRef.current.delete(id);
      return newMap;
    });
  };

  const getVerticalOffset = (id: string): number => {
    return offsetsRef.current.get(id) || 0;
  };

  return (
    <BubbleManagerContext.Provider value={{ registerBubble, unregisterBubble, getVerticalOffset }}>
      {children}
    </BubbleManagerContext.Provider>
  );
}

export function useBubbleManager() {
  const context = useContext(BubbleManagerContext);
  if (!context) {
    throw new Error('useBubbleManager must be used within BubbleManagerProvider');
  }
  return context;
}