/**
 * Ana Uygulama - Router ve başlatıcı
 */

// Modülleri import et (ES6 modül sistemi)
import gameState from './core/state.js';
import storageManager from './core/storage.js';
import SimulationEngine from './core/sim.js';
import UIManager from './core/ui.js';
import audioManager from './core/audio.js';
import HomeScreen from './modules/screen_home.js';
import StoryScreen from './modules/screen_story.js';
import SimulationScreen from './modules/screen_sim.js';
import BadgesScreen from './modules/screen_badges.js';
import HelpScreen from './modules/screen_help.js';

class App {
  constructor() {
    this.config = null;
    this.content = null;
    this.simEngine = null;
    this.uiManager = null;
    this.screens = {};
    this.isInitialized = false;
    this.currentScreenName = null; // Mevcut ekranı takip et
    this.isChangingScreen = false; // Ekran değişimi sırasında guard
  }
  
  /**
   * Uygulamayı başlat
   */
  async init() {
    try {
      // Veri dosyalarını yükle
      await this.loadData();
      
      // Modülleri başlat
      this.initModules();
      
      // UI elementlerini cache'le
      this.uiManager.cacheElements();
      
      // Ekranları oluştur
      this.initScreens();
      
      // State değişikliklerini dinle
      this.setupStateListener();
      
      // Kayıtlı veriyi yükle
      this.loadSavedData();
      
      // İlk ekranı göster
      this.showScreen('home');
      
      this.isInitialized = true;
      console.log('Oyun başarıyla yüklendi!');
      
    } catch (error) {
      console.error('Uygulama başlatma hatası:', error);
      this.showError('Oyun yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
  }
  
  /**
   * Veri dosyalarını yükle
   */
  async loadData() {
    try {
      const [configRes, contentRes] = await Promise.all([
        fetch('./assets/data/config.json'),
        fetch('./assets/data/content.json')
      ]);
      
      if (!configRes.ok || !contentRes.ok) {
        throw new Error('Veri dosyaları yüklenemedi');
      }
      
      this.config = (await configRes.json()).game;
      this.content = await contentRes.json();
      
      // Global erişim için (ekran modülleri için)
      window.gameConfig = this.config;
      window.gameContent = this.content;
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      throw new Error('Oyun verileri yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    }
  }
  
  /**
   * Modülleri başlat
   */
  initModules() {
    this.uiManager = new UIManager();
    this.simEngine = new SimulationEngine(this.config, this.content);
  }
  
  /**
   * Ekranları oluştur
   */
  initScreens() {
    this.screens = {
      home: new HomeScreen(gameState, storageManager, this.uiManager),
      story: new StoryScreen(gameState, this.uiManager, this.content, this.config),
      sim: new SimulationScreen(
        gameState, 
        this.simEngine, 
        this.uiManager, 
        storageManager, 
        audioManager,
        this.config,
        this.content
      ),
      badges: new BadgesScreen(gameState, storageManager, this.uiManager, this.content),
      help: new HelpScreen(gameState, this.uiManager, this.content)
    };
  }
  
  /**
   * State değişikliklerini dinle
   */
  setupStateListener() {
    gameState.subscribe((state) => {
      // Ekran değişikliği
      if (state.currentScreen && state.currentScreen !== this.currentScreenName && !this.isChangingScreen) {
        this.showScreen(state.currentScreen);
      }
    });
  }
  
  /**
   * Kayıtlı veriyi yükle
   */
  loadSavedData() {
    const savedData = storageManager.loadGameState();
    if (savedData) {
      gameState.update({
        badges: savedData.badges || [],
        stats: savedData.stats || {
          totalPlayTime: 0,
          bestSurvivalTime: 0,
          eventsHandled: 0,
          correctEventChoices: 0,
          actionsTaken: 0
        },
        badgeProgress: savedData.badgeProgress || {}
      });
    }
  }
  
  /**
   * Ekranı göster
   */
  showScreen(screenName) {
    // Zaten o ekrandaysak tekrar gösterme (sonsuz döngüyü önle)
    if (this.currentScreenName === screenName && !this.isChangingScreen) {
      return;
    }
    
    // Guard flag'i set et
    this.isChangingScreen = true;
    
    try {
      // Önceki ekranı gizle (sadece farklı bir ekrandaysak)
      if (this.currentScreenName && this.currentScreenName !== screenName) {
        const previousScreen = this.screens[this.currentScreenName];
        if (previousScreen && typeof previousScreen.hide === 'function') {
          previousScreen.hide();
        }
      }
      
      // Yeni ekranı göster
      if (this.screens[screenName]) {
        this.screens[screenName].show();
        this.currentScreenName = screenName;
      } else if (screenName === 'summary') {
        // Summary ekranı için özel screen instance'ı yok, direkt UI'dan göster
        this.uiManager.showScreen('summary');
        this.currentScreenName = screenName;
      } else {
        console.warn(`Ekran bulunamadı: ${screenName}`);
      }
    } finally {
      // Guard flag'ini kaldır
      this.isChangingScreen = false;
    }
  }
  
  /**
   * Hata mesajı göster
   */
  showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message" role="alert">
          <h2>Hata</h2>
          <p>${message}</p>
          <button onclick="location.reload()">Sayfayı Yenile</button>
        </div>
      `;
      errorContainer.classList.remove('hidden');
    } else {
      alert(message);
    }
  }
}

// Uygulamayı başlat
const app = new App();

// DOM yüklendiğinde başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Global erişim (debug için)
window.app = app;

