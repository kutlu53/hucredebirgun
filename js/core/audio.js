/**
 * Ses yönetimi - Basit bip uyarı sesleri (Web Audio API)
 */

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.init();
  }
  
  /**
   * Audio context'i başlat
   */
  init() {
    try {
      // Web Audio API desteği kontrolü
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Audio context başlatılamadı:', error);
      this.isEnabled = false;
    }
  }
  
  /**
   * Basit bip sesi çal
   */
  playBeep(frequency = 440, duration = 100, type = 'sine') {
    if (!this.isEnabled || !this.audioContext) {
      return;
    }
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Ses çalınamadı:', error);
    }
  }
  
  /**
   * Uyarı sesi (düşük frekans)
   */
  playWarning() {
    this.playBeep(300, 150, 'sine');
  }
  
  /**
   * Başarı sesi (yüksek frekans)
   */
  playSuccess() {
    this.playBeep(600, 100, 'sine');
  }
  
  /**
   * Hata sesi (çift bip)
   */
  playError() {
    this.playBeep(200, 100, 'sawtooth');
    setTimeout(() => {
      this.playBeep(150, 100, 'sawtooth');
    }, 150);
  }
  
  /**
   * Rozet kazanma sesi (melodik)
   */
  playBadge() {
    this.playBeep(523, 100, 'sine'); // C
    setTimeout(() => {
      this.playBeep(659, 100, 'sine'); // E
    }, 100);
    setTimeout(() => {
      this.playBeep(784, 150, 'sine'); // G
    }, 200);
  }
  
  /**
   * Sesleri aç/kapat
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Singleton instance
const audioManager = new AudioManager();

export default audioManager;

