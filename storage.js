/**
 * LocalStorage yönetimi - İlerleme ve rozet kaydı
 */

const STORAGE_KEY = 'cellDayGame';
const STORAGE_VERSION = 1;

class StorageManager {
  constructor() {
    this.key = STORAGE_KEY;
    this.version = STORAGE_VERSION;
  }
  
  /**
   * Veriyi kaydet
   */
  save(data) {
    try {
      const storageData = {
        version: this.version,
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(this.key, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('LocalStorage kayıt hatası:', error);
      return false;
    }
  }
  
  /**
   * Veriyi yükle
   */
  load() {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) {
        return null;
      }
      
      const storageData = JSON.parse(stored);
      
      // Versiyon kontrolü
      if (storageData.version !== this.version) {
        console.warn('Eski versiyon veri tespit edildi, temizleniyor...');
        this.clear();
        return null;
      }
      
      return storageData.data;
    } catch (error) {
      console.error('LocalStorage yükleme hatası:', error);
      return null;
    }
  }
  
  /**
   * Tüm veriyi temizle
   */
  clear() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (error) {
      console.error('LocalStorage temizleme hatası:', error);
      return false;
    }
  }
  
  /**
   * Oyun durumunu kaydet
   */
  saveGameState(state) {
    const saveData = {
      badges: state.badges,
      stats: state.stats,
      badgeProgress: state.badgeProgress
    };
    return this.save(saveData);
  }
  
  /**
   * Oyun durumunu yükle
   */
  loadGameState() {
    const loaded = this.load();
    if (!loaded) {
      return {
        badges: [],
        stats: {
          totalPlayTime: 0,
          bestSurvivalTime: 0,
          eventsHandled: 0,
          correctEventChoices: 0,
          actionsTaken: 0
        },
        badgeProgress: {}
      };
    }
    return loaded;
  }
  
  /**
   * Sadece rozetleri kaydet
   */
  saveBadges(badges) {
    const current = this.loadGameState();
    return this.save({
      ...current,
      badges: badges
    });
  }
  
  /**
   * Sadece istatistikleri kaydet
   */
  saveStats(stats) {
    const current = this.loadGameState();
    return this.save({
      ...current,
      stats: stats
    });
  }
}

// Singleton instance
const storageManager = new StorageManager();

export default storageManager;

