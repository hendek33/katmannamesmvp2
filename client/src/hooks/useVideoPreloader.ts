import { useEffect, useState } from 'react';

interface VideoPreloadStatus {
  isLoading: boolean;
  loaded: number;
  total: number;
  error: boolean;
}

export function useVideoPreloader() {
  const [status, setStatus] = useState<VideoPreloadStatus>({
    isLoading: false, // VideoPreloader component handles this now
    loaded: 5,
    total: 5,
    error: false
  });

  return status;
}