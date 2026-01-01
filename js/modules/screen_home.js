/**
 * Ana Menü Ekranı
 */

class HomeScreen {
  constructor(stateManager, storageManager, uiManager) {
    this.state = stateManager;
    this.storage = storageManager;
    this.ui = uiManager;
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.loadStats();
  }
  
  /**
   * Event listener'ları kur
   */
  setupEventListeners() {
    // Başla butonu
    const startButton = document.getElementById('btn-start');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
      startButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.startGame();
        }
      });
    }
    
    // Nasıl Oynanır butonu
    const helpButton = document.getElementById('btn-help');
    if (helpButton) {
      helpButton.addEventListener('click', () => {
        this.state.update({ currentScreen: 'help' });
      });
    }
    
    // Hücre Simülasyonu butonu
    const simButton = document.getElementById('btn-sim');
    if (simButton) {
      simButton.addEventListener('click', () => {
        console.log('Hücre Simülasyonu butonu tıklandı');
        if (window.gameConfig && window.gameContent) {
          // Yeni oyun için state'i tamamen sıfırla
          this.state.resetForNewGame();
          
          // Story completed flag'ini false yap
          this.state.update({ storyCompleted: false });
          
          // Oyunu durdur (isRunning false yap)
          this.state.update({ isRunning: false, isPaused: false });
          
          // Sim ekranına geç
          this.state.update({ currentScreen: 'sim' });
        } else {
          console.error('Game config yüklenmemiş');
          alert('Oyun yükleniyor, lütfen bekleyin...');
        }
      });
      // Klavye erişimi
      simButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          simButton.click();
        }
      });
    } else {
      console.error('btn-sim butonu bulunamadı!');
    }
    
    // Rozetler butonu
    const badgesButton = document.getElementById('btn-badges');
    if (badgesButton) {
      badgesButton.addEventListener('click', () => {
        this.state.update({ currentScreen: 'badges' });
      });
    }
  }
  
  /**
   * İstatistikleri yükle ve göster
   */
  loadStats() {
    const savedData = this.storage.loadGameState();
    const stats = savedData.stats || {};
    
    // İstatistikleri göster
    const statsContainer = document.getElementById('home-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Toplam Oyun Süresi:</span>
          <span class="stat-value">${this.formatTime(stats.totalPlayTime || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">En İyi Hayatta Kalma:</span>
          <span class="stat-value">${this.formatTime(stats.bestSurvivalTime || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Kazanılan Rozetler:</span>
          <span class="stat-value">${(savedData.badges || []).length} / 8</span>
        </div>
      `;
    }
  }
  
  /**
   * Oyunu başlat
   */
  startGame() {
    // Config'i yükle (app.js'den gelecek)
    if (window.gameConfig && window.gameContent) {
      // Yeni oyun için state'i sıfırla
      this.state.resetForNewGame();
      // Story ekranına geç
      this.state.update({ currentScreen: 'story' });
    } else {
      alert('Oyun yükleniyor, lütfen bekleyin...');
    }
  }
  
  /**
   * Zamanı formatla
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Ekranı göster
   */
  show() {
    this.loadStats();
    this.ui.showScreen('home');
  }
}

export default HomeScreen;

