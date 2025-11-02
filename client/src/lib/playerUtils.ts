// Utility function to get player display name with fallback to username
export function getPlayerName(player: any): string {
  // Check if player exists and has necessary properties
  if (!player) return "Unknown";
  
  // Use displayName if available, otherwise fallback to username
  return player.displayName || player.username || "Unknown";
}

// Get player name from either player object or separate username/displayName
export function getPlayerDisplayName(username: string, displayName?: string): string {
  return displayName || username || "Unknown";
}