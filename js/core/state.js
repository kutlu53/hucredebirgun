/**
 * Oyun durumu yönetimi - Tek kaynak (Source of Truth)
 * Immutable yaklaşım ile state güncellemeleri
 */

class GameState {
  constructor() {
    this.state = {
      // Oyun durumu
      isRunning: false,
      isPaused: false,
      currentScreen: 'home',
      gameStartTime: null,
      elapsedTime: 0,
      
      // Simülasyon değerleri
      atp: 70,
      waste: 20,
      stress: 10,
      protein: 30,
      
      // Organel sağlıkları
      organelles: {
        mitochondria: 100,
        ribosome: 100,
        lysosome: 100,
        golgi: 100,
        nucleus: 100
      },
      
      // Ek organeller için health map (ER, vacuole, centrosome)
      organelleHealth: {
        er: 100,
        vacuole: 100,
        centrosome: 100
      },
      
      // Zaman kontrolü
      timeScale: 1.0,
      
      // Aksiyon cooldown'ları
      actionCooldowns: {
        takeNutrient: 0,
        cleanWaste: 0,
        produceProtein: 0,
        repairOrganelle: 0
      },
      
      // Aktif olay kartı
      activeEvent: null,
      eventEffects: {},
      
      // Grafik verileri
      graphData: {
        atp: [],
        timestamps: []
      },
      
      // Rozet durumu
      badges: [],
      badgeProgress: {},
      
      // İstatistikler
      stats: {
        totalPlayTime: 0,
        bestSurvivalTime: 0,
        eventsHandled: 0,
        correctEventChoices: 0,
        actionsTaken: 0
      },
      
      // Seçili organel (onarım için)
      selectedOrganelle: null,
      
      // Story durumu
      storyCompleted: false
    };
    
    this.listeners = [];
  }
  
  /**
   * State değişikliği dinleyicisi ekle
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Dinleyicilere bildirim gönder
   */
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('State listener hatası:', error);
      }
    });
  }
  
  /**
   * State'i güncelle (immutable)
   */
  update(updates, skipNotify = false) {
    this.state = {
      ...this.state,
      ...updates
    };
    if (!skipNotify) {
      this.notify();
    }
  }
  
  /**
   * State'i al
   */
  get() {
    return { ...this.state };
  }
  
  /**
   * Belirli bir değeri al
   */
  getValue(key) {
    return this.state[key];
  }
  
  /**
   * Oyunu başlat
   */
  startGame(initialValues) {
    // Story tamamlandıysa mevcut değerleri kullan, yoksa config'den al
    const currentState = this.state;
    const useStoryValues = currentState.storyCompleted;
    
    this.update({
      isRunning: true,
      isPaused: false,
      gameStartTime: Date.now(),
      elapsedTime: 0,
      // Story tamamlandıysa mevcut değerleri kullan, yoksa initialValues'ı kullan
      atp: useStoryValues ? currentState.atp : initialValues.atp,
      waste: useStoryValues ? currentState.waste : initialValues.waste,
      stress: useStoryValues ? currentState.stress : initialValues.stress,
      protein: useStoryValues ? currentState.protein : initialValues.protein,
      organelles: { ...initialValues.organelles },
      organelleHealth: {
        er: 100,
        vacuole: 100,
        centrosome: 100
      },
      timeScale: 1.0,
      actionCooldowns: {
        takeNutrient: 0,
        cleanWaste: 0,
        produceProtein: 0,
        repairOrganelle: 0
      },
      activeEvent: null,
      eventEffects: {},
      graphData: {
        atp: [],
        timestamps: []
      },
      selectedOrganelle: null
    });
  }
  
  /**
   * Story'yi tamamlandı olarak işaretle
   */
  markStoryCompleted() {
    this.update({
      storyCompleted: true
    });
  }
  
  /**
   * Yeni oyun için state'i sıfırla
   */
  resetForNewGame() {
    const config = window.gameConfig;
    const initialValues = config ? config.initialValues : {
      atp: 70,
      waste: 20,
      stress: 10,
      protein: 30,
      organelles: {
        mitochondria: 100,
        ribosome: 100,
        lysosome: 100,
        golgi: 100,
        nucleus: 100
      }
    };
    
    this.update({
      storyCompleted: false,
      isRunning: false,
      isPaused: false,
      atp: initialValues.atp,
      waste: initialValues.waste,
      stress: initialValues.stress,
      protein: initialValues.protein,
      organelles: { ...initialValues.organelles },
      organelleHealth: {
        er: 100,
        vacuole: 100,
        centrosome: 100
      }
    });
  }
  
  /**
   * Oyunu durdur
   */
  stopGame() {
    const stats = this.state.stats;
    const elapsed = this.state.elapsedTime;
    
    // State'i güncelle ama listener'ı tetikleme (ekran değişimi sırasında sonsuz döngüyü önle)
    this.update({
      isRunning: false,
      isPaused: false,
      stats: {
        ...stats,
        totalPlayTime: stats.totalPlayTime + elapsed,
        bestSurvivalTime: Math.max(stats.bestSurvivalTime, elapsed)
      }
    }, true); // skipNotify = true
  }
  
  /**
   * Oyunu duraklat/devam ettir
   */
  togglePause() {
    this.update({
      isPaused: !this.state.isPaused
    });
  }
  
  /**
   * Zaman ölçeğini güncelle
   */
  setTimeScale(scale) {
    this.update({
      timeScale: Math.max(0.5, Math.min(2.0, scale))
    });
  }
  
  /**
   * Grafik verisine nokta ekle
   */
  addGraphPoint(atpValue) {
    const now = Date.now();
    const graphData = { ...this.state.graphData };
    
    graphData.atp.push(atpValue);
    graphData.timestamps.push(now);
    
    // Maksimum nokta sayısını aşarsa eski verileri sil
    const maxPoints = 120;
    if (graphData.atp.length > maxPoints) {
      graphData.atp.shift();
      graphData.timestamps.shift();
    }
    
    this.update({ graphData });
  }
  
  /**
   * Rozet ekle
   */
  addBadge(badgeId) {
    if (!this.state.badges.includes(badgeId)) {
      this.update({
        badges: [...this.state.badges, badgeId]
      });
      return true; // Yeni rozet
    }
    return false; // Zaten var
  }
  
  /**
   * Rozet ilerlemesini güncelle
   */
  updateBadgeProgress(badgeId, progress) {
    const badgeProgress = { ...this.state.badgeProgress };
    badgeProgress[badgeId] = progress;
    this.update({ badgeProgress });
  }
  
  /**
   * Delta değerlerini state'e uygula (0-100 aralığında clamp)
   */
  applyDelta(delta) {
    const updates = {};
    
    // ATP
    if (delta.atp !== undefined) {
      updates.atp = Math.max(0, Math.min(100, this.state.atp + delta.atp));
    }
    
    // Waste
    if (delta.waste !== undefined) {
      updates.waste = Math.max(0, Math.min(100, this.state.waste + delta.waste));
    }
    
    // Stress
    if (delta.stress !== undefined) {
      updates.stress = Math.max(0, Math.min(100, this.state.stress + delta.stress));
    }
    
    // Protein
    if (delta.protein !== undefined) {
      updates.protein = Math.max(0, Math.min(100, this.state.protein + delta.protein));
    }
    
    this.update(updates);
    return updates;
  }
}

// Singleton instance
const gameState = new GameState();

// Debug modu için global erişim (D tuşu ile açılır)
if (typeof window !== 'undefined') {
  window.__gameState = gameState;
}

export default gameState;

