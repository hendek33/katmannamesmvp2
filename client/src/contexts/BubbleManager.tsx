import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Bubble {
  id: string;
  type: 'insult' | 'taunt';
  team: 'dark' | 'light';
  index: number;
  createdAt: number;
}

interface BubbleManagerContextType {
  registerBubble: (id: string, type: 'insult' | 'taunt', team: 'dark' | 'light') => number;
  unregisterBubble: (id: string) => void;
  getBubblePosition: (id: string) => number;
}

const BubbleManagerContext = createContext<BubbleManagerContextType | null>(null);

export const useBubbleManager = () => {
  const context = useContext(BubbleManagerContext);
  if (!context) {
    throw new Error('useBubbleManager must be used within BubbleManagerProvider');
  }
  return context;
};

export const BubbleManagerProvider = ({ children }: { children: ReactNode }) => {
  const [bubbles, setBubbles] = useState<Map<string, Bubble>>(new Map());

  // Register a new bubble and return its position index
  const registerBubble = (id: string, type: 'insult' | 'taunt', team: 'dark' | 'light'): number => {
    setBubbles(prev => {
      const newBubbles = new Map(prev);
      
      // Find all bubbles of the same team (regardless of type)
      const sameBubbles = Array.from(newBubbles.values())
        .filter(b => b.team === team)
        .sort((a, b) => a.index - b.index);
      
      // Assign the next available index
      const nextIndex = sameBubbles.length;
      
      newBubbles.set(id, {
        id,
        type,
        team,
        index: nextIndex,
        createdAt: Date.now()
      });
      
      return newBubbles;
    });
    
    // Return the initial position
    const bubble = bubbles.get(id);
    return bubble?.index || 0;
  };

  // Unregister a bubble and update positions of remaining bubbles
  const unregisterBubble = (id: string) => {
    setBubbles(prev => {
      const newBubbles = new Map(prev);
      const removedBubble = newBubbles.get(id);
      
      if (removedBubble) {
        newBubbles.delete(id);
        
        // Update indices for remaining bubbles of the same team (regardless of type)
        Array.from(newBubbles.values())
          .filter(b => b.team === removedBubble.team)
          .sort((a, b) => a.createdAt - b.createdAt)
          .forEach((bubble, index) => {
            bubble.index = index;
          });
      }
      
      return newBubbles;
    });
  };

  // Get current position of a bubble
  const getBubblePosition = (id: string): number => {
    const bubble = bubbles.get(id);
    return bubble?.index || 0;
  };

  return (
    <BubbleManagerContext.Provider value={{ registerBubble, unregisterBubble, getBubblePosition }}>
      {children}
    </BubbleManagerContext.Provider>
  );
};