/**
 * Simple Sound Service using Web Audio API oscillators
 * Fallback for when MP3 files don't work
 */
export class SimpleSoundService {
  private static instance: SimpleSoundService;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;
  
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
  
  static getInstance(): SimpleSoundService {
    if (!SimpleSoundService.instance) {
      SimpleSoundService.instance = new SimpleSoundService();
    }
    return SimpleSoundService.instance;
  }
  
  /**
   * Initialize the audio context
   */
  async initialize(): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('✅ Simple sound service initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize simple sound service:', error);
    }
  }
  
  /**
   * Create a simple beep sound
   */
  private async playBeep(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    if (!this.isEnabled || !this.audioContext) {
      return;
    }
    
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      // Set volume with fade in/out
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }
  
  // Sound effect methods with different beep patterns
  async playClick(): Promise<void> {
    await this.playBeep(800, 0.05, 'square');
  }
  
  async playDeal(): Promise<void> {
    // Shuffle sound - series of quick beeps
    for (let i = 0; i < 3; i++) {
      await this.playBeep(400 + i * 100, 0.1, 'sawtooth');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  async playNotification(): Promise<void> {
    await this.playBeep(660, 0.15, 'sine');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.playBeep(880, 0.15, 'sine');
  }
  
  async playSendClue(): Promise<void> {
    await this.playBeep(440, 0.2, 'sine');
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playBeep(660, 0.2, 'sine');
  }
  
  async playClueSubmit(): Promise<void> {
    return this.playSendClue();
  }
  
  async playRevealCard(): Promise<void> {
    // Success sound - ascending tone
    await this.playBeep(523, 0.1, 'sine');
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playBeep(659, 0.1, 'sine');
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playBeep(784, 0.15, 'sine');
  }
  
  async playCardReveal(): Promise<void> {
    return this.playRevealCard();
  }
  
  async playWrongGuess(): Promise<void> {
    // Error sound - descending tone
    await this.playBeep(440, 0.15, 'sawtooth');
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playBeep(330, 0.2, 'sawtooth');
  }
  
  async playAssassin(): Promise<void> {
    // Dramatic low tone
    await this.playBeep(110, 0.5, 'sawtooth');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.playBeep(55, 0.8, 'sawtooth');
  }
  
  async playWin(): Promise<void> {
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C, E, G, high C
    for (const note of notes) {
      await this.playBeep(note, 0.15, 'sine');
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }
  
  async playVictory(): Promise<void> {
    return this.playWin();
  }
  
  async playLoss(): Promise<void> {
    // Sad trombone
    await this.playBeep(147, 0.3, 'sawtooth');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.playBeep(139, 0.3, 'sawtooth');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.playBeep(131, 0.3, 'sawtooth');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.playBeep(123, 0.5, 'sawtooth');
  }
  
  async playDefeat(): Promise<void> {
    return this.playLoss();
  }
  
  async playGoodGuess(): Promise<void> {
    await this.playBeep(880, 0.1, 'sine');
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playBeep(1100, 0.1, 'sine');
  }
  
  async playError(): Promise<void> {
    await this.playBeep(220, 0.2, 'square');
  }
  
  async playGameStart(): Promise<void> {
    return this.playDeal();
  }
  
  async playTurnChange(): Promise<void> {
    await this.playBeep(500, 0.1, 'sine');
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playBeep(600, 0.1, 'sine');
  }
  
  async playSound(soundName: string): Promise<void> {
    // Map sound names to methods
    const soundMap: Record<string, () => Promise<void>> = {
      'click': () => this.playClick(),
      'notification': () => this.playNotification(),
      'deal': () => this.playDeal(),
      'sendClue': () => this.playSendClue(),
      'revealCard': () => this.playRevealCard(),
      'wrongGuess': () => this.playWrongGuess(),
      'assassin': () => this.playAssassin(),
      'win': () => this.playWin(),
      'loss': () => this.playLoss(),
      'goodGuess': () => this.playGoodGuess(),
      'error': () => this.playError(),
    };
    
    const playFunc = soundMap[soundName];
    if (playFunc) {
      await playFunc();
    }
  }
  
  // Settings methods
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('gameVolume', this.volume.toString());
  }
  
  getVolume(): number {
    return this.volume;
  }
  
  setEnabled(value: boolean): void {
    this.isEnabled = value;
    localStorage.setItem('soundEnabled', value.toString());
  }
  
  getEnabled(): boolean {
    return this.isEnabled;
  }
  
  isEnabledState(): boolean {
    return this.isEnabled;
  }
  
  toggle(): void {
    this.setEnabled(!this.isEnabled);
  }
  
  toggleMute(): void {
    this.setEnabled(!this.isEnabled);
  }
  
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const simpleSoundService = SimpleSoundService.getInstance();