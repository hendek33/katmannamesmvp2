/**
 * Audio Service for managing game sound effects
 * Uses the original Codenames sound effects with specific timecodes
 */
export class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private gainNode: GainNode | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.7;
  private loadingPromise: Promise<void> | null = null;
  
  // Sound effect definitions with start and duration in seconds
  private soundEffects = {
    deal: { start: 0.0, duration: 2.365 },
    click: { start: 3.0, duration: 0.2 },
    notification: { start: 4.0, duration: 2.0 },
    click2: { start: 6.0, duration: 0.11 },
    select: { start: 6.5, duration: 0.2 },
    dealCard: { start: 7.0, duration: 0.25 },
    nextRound: { start: 8.0, duration: 1.5 },
    sendClue: { start: 11.0, duration: 2.889 },
    revealCard: { start: 14.0, duration: 1.4 },
    wrongGuess: { start: 18.0, duration: 3.447 },
    assassin: { start: 22.0, duration: 3.841 },
    win: { start: 26.0, duration: 4.477 },
    goodGuess: { start: 30.5, duration: 1.2 },
    error: { start: 32.0, duration: 2.0 },
    loss: { start: 34.5, duration: 4.144 }
  };
  
  private constructor() {
    // Load saved preferences
    const savedVolume = localStorage.getItem('gameVolume');
    const savedEnabled = localStorage.getItem('soundEnabled');
    
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
    
    if (savedEnabled !== null) {
      this.isEnabled = savedEnabled === 'true';
    }
  }
  
  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
  
  /**
   * Initialize the audio context and load the sound effects file
   */
  async initialize(): Promise<void> {
    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    this.loadingPromise = this.loadAudio();
    return this.loadingPromise;
  }
  
  private async loadAudio(): Promise<void> {
    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create and connect gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = this.volume;
      }
      
      // Load the sound effects file
      const response = await fetch('/effects.mp3');
      if (!response.ok) {
        throw new Error(`Failed to load sound effects: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log('✅ Sound effects loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load sound effects:', error);
      // Don't throw - game should work without sounds
    }
  }
  
  /**
   * Play a specific sound effect
   */
  async playSound(effectName: keyof typeof AudioService.prototype.soundEffects): Promise<void> {
    // Don't play if disabled or not loaded
    if (!this.isEnabled || !this.audioContext || !this.audioBuffer || !this.gainNode) {
      return;
    }
    
    const effect = this.soundEffects[effectName];
    if (!effect) {
      console.warn(`Unknown sound effect: ${effectName}`);
      return;
    }
    
    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Create a new buffer source for this playback
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;
      source.connect(this.gainNode);
      
      // Play the specific portion of the audio
      const startTime = 0; // Start immediately
      const offset = effect.start; // Start offset in the buffer
      const duration = effect.duration; // Duration to play
      
      source.start(startTime, offset, duration);
    } catch (error) {
      console.error(`Failed to play sound effect ${effectName}:`, error);
    }
  }
  
  /**
   * Play click sound for UI interactions
   */
  async playClick(): Promise<void> {
    return this.playSound('click');
  }
  
  /**
   * Play card reveal sound based on card type
   */
  async playCardReveal(cardType: 'correct' | 'wrong' | 'neutral' | 'assassin'): Promise<void> {
    switch(cardType) {
      case 'correct':
        return this.playSound('goodGuess');
      case 'wrong':
        return this.playSound('wrongGuess');
      case 'neutral':
        return this.playSound('revealCard');
      case 'assassin':
        return this.playSound('assassin');
    }
  }
  
  /**
   * Play turn change sound
   */
  async playTurnChange(): Promise<void> {
    return this.playSound('nextRound');
  }
  
  /**
   * Play clue submission sound
   */
  async playClueSubmit(): Promise<void> {
    return this.playSound('sendClue');
  }
  
  /**
   * Play game start sound
   */
  async playGameStart(): Promise<void> {
    return this.playSound('deal');
  }
  
  /**
   * Play victory sound
   */
  async playVictory(): Promise<void> {
    return this.playSound('win');
  }
  
  /**
   * Play defeat sound
   */
  async playDefeat(): Promise<void> {
    return this.playSound('loss');
  }
  
  /**
   * Play error sound
   */
  async playError(): Promise<void> {
    return this.playSound('error');
  }
  
  /**
   * Play notification sound
   */
  async playNotification(): Promise<void> {
    return this.playSound('notification');
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('gameVolume', this.volume.toString());
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }
  
  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
  
  /**
   * Enable/disable sound
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }
  
  /**
   * Check if sound is enabled
   */
  isEnabledState(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Toggle sound on/off
   */
  toggle(): void {
    this.setEnabled(!this.isEnabled);
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.audioBuffer = null;
    this.gainNode = null;
  }
}

// Export singleton instance
export const audioService = AudioService.getInstance();