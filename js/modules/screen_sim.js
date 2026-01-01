/**
 * Simülasyon Ekranı - Ana oyun ekranı
 */

class SimulationScreen {
  constructor(stateManager, simEngine, uiManager, storageManager, audioManager, config, content) {
    this.state = stateManager;
    this.sim = simEngine;
    this.ui = uiManager;
    this.storage = storageManager;
    this.audio = audioManager;
    this.config = config;
    this.content = content;
    
    this.tickInterval = null;
    this.lastTickTime = Date.now();
    this.badgeCheckInterval = null;
    this.speechSynthesis = null;
    this.currentUtterance = null;
    this.welcomeShown = false;
    
    this.init();
  }
  
  init() {
    this.setupOrganelleConfig();
    this.setupCellScene();
    this.setupEventListeners();
    this.initSpeechSynthesis();
  }
  
  /**
   * Text-to-speech başlat
   */
  initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }
  
  /**
   * Metni seslendir
   */
  speakText(text, onEndCallback = null) {
    if (!this.speechSynthesis) return;
    
    // Mevcut seslendirmeyi durdur
    this.stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9; // Biraz yavaş
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onerror = (e) => {
      // "interrupted" hatası normal bir durum (seslendirme durdurulduğunda)
      // Sadece gerçek hataları logla
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.log('Seslendirme hatası:', e.error);
      }
    };
    
    // Seslendirme bitince callback çağır
    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEndCallback) {
        onEndCallback();
      }
    };
    
    this.currentUtterance = utterance;
    
    // Kısa bir gecikme ile başlat (bazı tarayıcılarda gerekli)
    setTimeout(() => {
      if (this.speechSynthesis) {
        this.speechSynthesis.speak(utterance);
      }
    }, 100);
  }
  
  /**
   * Seslendirmeyi durdur
   */
  stopSpeaking() {
    if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }
  
  /**
   * Organel konfigürasyonunu oluştur
   */
  setupOrganelleConfig() {
    this.organelleConfig = [
      {
        id: 'nucleus',
        normalSrc: 'resimler/nucleus_normal.png',
        damagedSrc: 'resimler/nucleus_damaged.png',
        initialPos: { x: 50, y: 50 }, // Merkez
        size: { width: 'clamp(120px, 20%, 180px)', height: 'clamp(120px, 20%, 180px)' },
        stateKey: 'nucleus',
        count: 1
      },
      {
        id: 'mitochondria',
        normalSrc: 'resimler/mitochondria_normal.png',
        damagedSrc: 'resimler/mitochondria_damaged.png',
        initialPos: { x: 25, y: 40 }, // Sol-orta
        size: { width: 'clamp(90px, 18%, 150px)', height: 'clamp(90px, 18%, 150px)' },
        stateKey: 'mitochondria',
        count: 4 // Gerçekçi: 3-5 arası
      },
      {
        id: 'golgi',
        normalSrc: 'resimler/golgi_normal.png',
        damagedSrc: 'resimler/golgi_damaged.png',
        initialPos: { x: 75, y: 50 }, // Sağ-orta
        size: { width: 'clamp(85px, 17%, 135px)', height: 'clamp(85px, 17%, 135px)' },
        stateKey: 'golgi',
        count: 1
      },
      {
        id: 'er',
        normalSrc: 'resimler/er_normal.png',
        damagedSrc: 'resimler/er_damaged.png',
        initialPos: { x: 65, y: 70 }, // Çekirdeğin sağ altı
        size: { width: 'clamp(105px, 19%, 165px)', height: 'clamp(60px, 12%, 90px)' },
        stateKey: null,
        count: 1
      },
      {
        id: 'lysosome',
        normalSrc: 'resimler/lysosome_normal.png',
        damagedSrc: 'resimler/lysosome_damaged.png',
        initialPos: { x: 80, y: 25 }, // Sağ üst
        size: { width: 'clamp(70px, 14%, 110px)', height: 'clamp(70px, 14%, 110px)' },
        stateKey: 'lysosome',
        count: 3 // Gerçekçi: 2-3 arası
      },
      {
        id: 'vacuole',
        normalSrc: 'resimler/vacuole_normal.png',
        damagedSrc: 'resimler/vacuole_damaged.png',
        initialPos: { x: 20, y: 75 }, // Sol alt
        size: { width: 'clamp(90px, 18%, 150px)', height: 'clamp(90px, 18%, 150px)' },
        stateKey: null,
        count: 2 // Gerçekçi: 1-2 arası
      },
      {
        id: 'ribosome',
        normalSrc: 'resimler/ribosome_normal.png',
        damagedSrc: 'resimler/ribosome_damaged.png',
        initialPos: { x: 0, y: 0 }, // Random pozisyonlar kullanılacak
        size: { width: 'clamp(50px, 10%, 80px)', height: 'clamp(50px, 10%, 80px)' },
        stateKey: 'ribosome',
        count: 4 // 3-5 arası, 4 seçtik
      }
    ];
    
    // Centrosome opsiyonel
    if (this.config.organelles && this.config.organelles.centrosome !== undefined) {
      this.organelleConfig.push({
        id: 'centrosome',
        normalSrc: 'resimler/centrosome_normal.png',
        damagedSrc: 'resimler/centrosome_damaged.png',
        initialPos: { x: 30, y: 50 },
        size: { width: 'clamp(60px, 12%, 100px)', height: 'clamp(60px, 12%, 100px)' },
        stateKey: null,
        count: 1
      });
    }
  }
  
  /**
   * Hücre sahnesini kur
   */
  setupCellScene() {
    const cellScene = document.getElementById('cell-scene');
    if (!cellScene) return;
    
    // Organelleri render et
    this.renderOrganelles();
    
    // Organel tıklama event'lerini kur
    this.setupOrganelleClickHandlers();
  }
  
  /**
   * Organelleri DOM'a render et
   */
  renderOrganelles() {
    const cellScene = document.getElementById('cell-scene');
    if (!cellScene) return;
    
    // Mevcut organelleri temizle (yeniden render için)
    const existingOrganelles = cellScene.querySelectorAll('.organelle-item');
    existingOrganelles.forEach(el => el.remove());
    
    const state = this.state.get();
    
    // Her organel için DOM elementi oluştur
    this.organelleConfig.forEach(config => {
      const count = config.count || 1;
      
      // Çoklu organeller için (ribosome, mitochondria, lysosome, vacuole)
      if (count > 1) {
        for (let i = 0; i < count; i++) {
          this.createOrganelleElement(cellScene, config, state, i);
        }
      } else {
        // Tek organel için
        this.createOrganelleElement(cellScene, config, state, 0);
      }
    });
  }
  
  /**
   * Organel DOM elementi oluştur
   */
  createOrganelleElement(cellScene, config, state, index = 0) {
    const organelleEl = document.createElement('div');
    organelleEl.className = 'organelle-item';
    
    // Ribosome için index ekle
    const organelleId = config.count > 1 && index > 0 
      ? `${config.id}-${index}` 
      : config.id;
    
    organelleEl.id = `organelle-${organelleId}`;
    organelleEl.setAttribute('data-organelle-id', config.id);
    organelleEl.setAttribute('data-organelle-index', index);
    organelleEl.setAttribute('role', 'button');
    organelleEl.setAttribute('tabindex', '0');
    organelleEl.setAttribute('aria-label', `${config.id} organeli`);
    
    // Pozisyon ve boyut
    let posX = config.initialPos.x;
    let posY = config.initialPos.y;
    
    // Çoklu organeller için random pozisyon (merkeze yakın, aralarında mesafe)
    if (config.count > 1) {
      if (config.id === 'ribosome') {
        // Ribosome için çember şeklinde dağıt
        const angle = (index * (360 / config.count)) * (Math.PI / 180);
        const radius = 10 + Math.random() * 8;
        posX = 50 + Math.cos(angle) * radius;
        posY = 50 + Math.sin(angle) * radius;
      } else if (config.id === 'mitochondria') {
        // Mitokondri için başlangıç pozisyonu etrafında dağıt
        const baseX = config.initialPos.x;
        const baseY = config.initialPos.y;
        const offsetX = (Math.random() - 0.5) * 15; // ±7.5% offset
        const offsetY = (Math.random() - 0.5) * 15;
        posX = baseX + offsetX;
        posY = baseY + offsetY;
      } else if (config.id === 'lysosome') {
        // Lizozom için başlangıç pozisyonu etrafında dağıt
        const baseX = config.initialPos.x;
        const baseY = config.initialPos.y;
        const offsetX = (Math.random() - 0.5) * 12; // ±6% offset
        const offsetY = (Math.random() - 0.5) * 12;
        posX = baseX + offsetX;
        posY = baseY + offsetY;
      } else if (config.id === 'vacuole') {
        // Koful için başlangıç pozisyonu etrafında dağıt
        const baseX = config.initialPos.x;
        const baseY = config.initialPos.y;
        const offsetX = (Math.random() - 0.5) * 10; // ±5% offset
        const offsetY = (Math.random() - 0.5) * 10;
        posX = baseX + offsetX;
        posY = baseY + offsetY;
      }
    }
    
    organelleEl.style.left = `${posX}%`;
    organelleEl.style.top = `${posY}%`;
    organelleEl.style.width = config.size.width;
    organelleEl.style.height = config.size.height;
    organelleEl.style.transform = 'translate(-50%, -50%)';
    
    // Görsel
    const img = document.createElement('img');
    img.className = 'organelle-image';
    img.alt = `${config.id} organeli`;
    organelleEl.appendChild(img);
    
    // Health bar overlay (sadece ilk kopya için veya tek kopya için)
    if (index === 0 || config.count === 1) {
      const healthBarContainer = document.createElement('div');
      healthBarContainer.className = 'organelle-health-bar';
      const healthBarFill = document.createElement('div');
      healthBarFill.className = 'organelle-health-fill';
      healthBarContainer.appendChild(healthBarFill);
      organelleEl.appendChild(healthBarContainer);
    }
    
    cellScene.appendChild(organelleEl);
    
    // İlk görsel güncellemesi
    this.updateOrganelleVisual(organelleId, state, config);
  }
  
  /**
   * Organel görselini güncelle (health'e göre)
   */
  updateOrganelleVisual(organelleId, state, config = null) {
    // Ribosome için index'i kaldır
    const baseId = organelleId.split('-')[0];
    const organelleEl = document.getElementById(`organelle-${organelleId}`);
    if (!organelleEl) return;
    
    if (!config) {
      config = this.organelleConfig.find(c => c.id === baseId);
      if (!config) return;
    }
    
    // Health değerini al
    let health = 100;
    if (config.stateKey && state.organelles && state.organelles[config.stateKey] !== undefined) {
      health = state.organelles[config.stateKey];
    } else if (state.organelleHealth && state.organelleHealth[organelleId] !== undefined) {
      health = state.organelleHealth[organelleId];
    }
    
    // Görseli güncelle
    const img = organelleEl.querySelector('.organelle-image');
    if (img) {
      img.src = health < 40 ? config.damagedSrc : config.normalSrc;
    }
    
    // Animasyon class'ını güncelle
    organelleEl.classList.remove('normal', 'damaged');
    if (health < 40) {
      organelleEl.classList.add('damaged');
    } else {
      organelleEl.classList.add('normal');
    }
    
    // Health bar'ı güncelle
    const healthBarFill = organelleEl.querySelector('.organelle-health-fill');
    if (healthBarFill) {
      healthBarFill.style.width = `${health}%`;
      healthBarFill.classList.remove('low', 'medium', 'high');
      if (health < 40) {
        healthBarFill.classList.add('low');
      } else if (health < 70) {
        healthBarFill.classList.add('medium');
      } else {
        healthBarFill.classList.add('high');
      }
    }
  }
  
  /**
   * Organel tıklama handler'larını kur
   */
  setupOrganelleClickHandlers() {
    const cellScene = document.getElementById('cell-scene');
    if (!cellScene) return;
    
    cellScene.addEventListener('click', (e) => {
      const organelleEl = e.target.closest('.organelle-item');
      if (!organelleEl) return;
      
      const organelleId = organelleEl.getAttribute('data-organelle-id');
      if (!organelleId) return;
      
      this.selectOrganelle(organelleId);
    });
    
    // Klavye erişimi
    cellScene.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const organelleEl = e.target.closest('.organelle-item');
        if (organelleEl) {
          e.preventDefault();
          const organelleId = organelleEl.getAttribute('data-organelle-id');
          if (organelleId) {
            this.selectOrganelle(organelleId);
          }
        }
      }
    });
  }
  
  /**
   * Organel seç
   */
  selectOrganelle(organelleId) {
    // Base ID'yi al (ribosome-1 -> ribosome)
    const baseId = organelleId.split('-')[0];
    
    // Önceki seçimi kaldır
    const previousSelected = document.querySelectorAll('.organelle-item.selected');
    previousSelected.forEach(el => el.classList.remove('selected'));
    
    // Aynı organelin tüm kopyalarını seç (ribosome için)
    const allOrganelles = document.querySelectorAll(`[data-organelle-id="${baseId}"]`);
    allOrganelles.forEach(el => el.classList.add('selected'));
    
    // State'te seçili organeli güncelle
    const config = this.organelleConfig.find(c => c.id === baseId);
    if (config && config.stateKey) {
      this.state.update({ selectedOrganelle: config.stateKey });
    } else {
      this.state.update({ selectedOrganelle: baseId });
    }
    
    // Organel bilgisini göster
    const state = this.state.get();
    const organelleContent = this.content.organelles[config?.stateKey || baseId];
    if (organelleContent) {
      let health = 100;
      if (config?.stateKey && state.organelles && state.organelles[config.stateKey] !== undefined) {
        health = state.organelles[config.stateKey];
      }
      
      this.ui.showOrganelleInfo({
        ...organelleContent,
        health: health
      });
    }
  }
  
  /**
   * Event listener'ları kur
   */
  setupEventListeners() {
    // Aksiyon butonları
    document.getElementById('action-take-nutrient')?.addEventListener('click', () => this.handleAction('takeNutrient'));
    document.getElementById('action-clean-waste')?.addEventListener('click', () => this.handleAction('cleanWaste'));
    document.getElementById('action-produce-protein')?.addEventListener('click', () => this.handleAction('produceProtein'));
    document.getElementById('action-repair-organelle')?.addEventListener('click', () => this.handleAction('repairOrganelle'));
    
    // Zaman kontrolü
    const timeScale = document.getElementById('time-scale');
    if (timeScale) {
      timeScale.addEventListener('input', (e) => {
        this.state.setTimeScale(parseFloat(e.target.value));
        this.ui.updateTimeScale(parseFloat(e.target.value));
      });
    }
    
    // Duraklat butonu
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.state.togglePause();
      const state = this.state.get();
      this.ui.updatePauseButton(state.isPaused);
    });
    
    // Menüye dön
    document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
      this.stop();
      this.state.update({ currentScreen: 'home' });
    });
    
    // Olay kartı seçenekleri
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('event-option')) {
        const optionIndex = parseInt(e.target.getAttribute('data-option-index'));
        this.handleEventChoice(optionIndex);
      }
    });
    
    // Debug panel (D tuşu)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const state = this.state.get();
          this.ui.toggleDebugPanel(state);
        }
      }
    });
  }
  
  /**
   * Aksiyon işle
   */
  handleAction(actionType) {
    const state = this.state.get();
    
    // Cooldown kontrolü
    if (state.actionCooldowns[actionType] > 0) {
      this.audio.playWarning();
      return;
    }
    
    const actionConfig = this.config.actions[actionType];
    if (!actionConfig) return;
    
    // ATP kontrolü (onarım hariç)
    if (actionType !== 'takeNutrient' && state.atp < actionConfig.atpCost) {
      this.ui.showToast('Yetersiz ATP!', 'error');
      this.audio.playError();
      return;
    }
    
    // Aksiyonu uygula
    let updates = {};
    
    switch (actionType) {
      case 'takeNutrient':
        updates.atp = Math.min(100, state.atp + actionConfig.atpGain);
        updates.waste = Math.min(100, state.waste + actionConfig.wasteCost);
        break;
        
      case 'cleanWaste':
        updates.atp = Math.max(0, state.atp - actionConfig.atpCost);
        updates.waste = Math.max(0, state.waste - actionConfig.wasteReduction);
        break;
        
      case 'produceProtein':
        updates.atp = Math.max(0, state.atp - actionConfig.atpCost);
        updates.protein = Math.min(100, state.protein + actionConfig.proteinGain);
        updates.waste = Math.min(100, state.waste + actionConfig.wasteCost);
        break;
        
      case 'repairOrganelle':
        if (!state.selectedOrganelle) {
          this.ui.showToast('Önce bir organel seçin!', 'warning');
          return;
        }
        updates.atp = Math.max(0, state.atp - actionConfig.atpCost);
        updates.stress = Math.min(100, state.stress + actionConfig.stressCost);
        const organelles = { ...state.organelles };
        organelles[state.selectedOrganelle] = Math.min(100, 
          organelles[state.selectedOrganelle] + actionConfig.healthGain);
        updates.organelles = organelles;
        break;
    }
    
    // Cooldown ekle
    updates.actionCooldowns = { ...state.actionCooldowns };
    updates.actionCooldowns[actionType] = actionConfig.cooldown;
    
    // İstatistik güncelle
    updates.stats = { ...state.stats };
    updates.stats.actionsTaken = (updates.stats.actionsTaken || 0) + 1;
    
    this.state.update(updates);
    this.audio.playSuccess();
    this.ui.showToast('Aksiyon uygulandı!', 'success');
  }
  
  /**
   * Olay seçeneğini işle
   */
  handleEventChoice(optionIndex) {
    const state = this.state.get();
    if (!state.activeEvent) return;
    
    const effects = this.sim.processEventChoice(state.activeEvent, optionIndex);
    if (effects) {
      this.state.update({
        eventEffects: effects,
        activeEvent: null,
        stats: {
          ...state.stats,
          eventsHandled: (state.stats.eventsHandled || 0) + 1,
          correctEventChoices: state.activeEvent.correctOption === optionIndex 
            ? (state.stats.correctEventChoices || 0) + 1 
            : state.stats.correctEventChoices || 0
        }
      });
      
      this.ui.hideEventCard();
      this.audio.playSuccess();
      
      // Doğru seçim rozeti kontrolü
      if (state.activeEvent.correctOption === optionIndex) {
        this.checkBadge('event_master');
      }
    }
  }
  
  /**
   * Oyunu başlat
   * Not: startGame() fonksiyonu storyCompleted flag'ini kontrol eder
   * Eğer story tamamlandıysa mevcut state değerlerini kullanır
   */
  start() {
    const initialValues = this.config.initialValues;
    
    // Eğer zaten bir interval varsa temizle
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.badgeCheckInterval) {
      clearInterval(this.badgeCheckInterval);
      this.badgeCheckInterval = null;
    }
    
    // Oyunu başlat
    this.state.startGame(initialValues);
    
    // State'i kontrol et
    const state = this.state.get();
    if (!state || !state.isRunning) {
      return;
    }
    
    // Tick döngüsünü başlat
    this.lastTickTime = Date.now();
    const tickIntervalMs = this.config.tickInterval || 500;
    
    // Tick fonksiyonunu bağla
    const tickFunction = () => {
      this.tick();
    };
    
    // İlk tick'i hemen çalıştır (setTimeout ile asenkron)
    setTimeout(() => {
      tickFunction();
    }, 0);
    
    // Sonraki tick'ler için interval başlat
    this.tickInterval = setInterval(tickFunction, tickIntervalMs);
    
    // Rozet kontrolünü başlat
    if (this.checkBadges) {
      this.badgeCheckInterval = setInterval(() => this.checkBadges(), 1000);
    }
    
    // İlk UI güncellemesi
    this.updateUI(state);
    
    // Canvas animasyonu
    if (this.startCanvasAnimation) {
      this.startCanvasAnimation();
    }
    
    // Grafik animasyonu
    if (this.startGraphAnimation) {
      this.startGraphAnimation();
    }
  }
  
  /**
   * Tick işle
   */
  tick() {
    const state = this.state.get();
    if (!state) {
      console.warn('Tick: state null');
      return;
    }
    
    if (!state.isRunning) {
      return;
    }
    
    if (state.isPaused) {
      return;
    }
    
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;
    
    // DeltaTime çok büyükse (örneğin sayfa sekmede kaldıysa) sınırla
    const maxDeltaTime = 2000; // 2 saniye
    const safeDeltaTime = Math.min(deltaTime, maxDeltaTime);
    
    // DeltaTime çok küçükse veya 0 ise atla
    if (safeDeltaTime <= 0) {
      return;
    }
    
    try {
      // Simülasyonu çalıştır
      const newState = this.sim.processTick(state, safeDeltaTime);
      
      if (!newState) {
        console.warn('Tick: processTick null döndü');
        return;
      }
      
      // State'i güncelle (skipNotify ile, çünkü UI'ı manuel güncelliyoruz)
      this.state.update(newState, true);
      
      // Grafik verisine ekle
      if (this.state.addGraphPoint) {
        this.state.addGraphPoint(newState.atp);
      }
      
      // Olay kontrolü
      if (this.sim.shouldTriggerEvent && this.sim.shouldTriggerEvent(newState)) {
        const event = this.sim.generateEvent();
        if (event) {
          this.state.update({ activeEvent: event });
          this.ui.showEventCard(event);
          if (this.audio && this.audio.playWarning) {
            this.audio.playWarning();
          }
        }
      }
      
      // Oyun bitiş kontrolü
      if (this.sim.checkGameOver) {
        const gameOverReasons = this.sim.checkGameOver(newState);
        if (gameOverReasons) {
          this.handleGameOver(gameOverReasons);
          return; // Oyun bitti, daha fazla tick işleme
        }
      }
      
      // UI güncelle - newState'i kullan
      this.updateUI(newState);
      
    } catch (error) {
      console.error('Tick işleme hatası:', error, error.stack);
    }
  }
  
  /**
   * UI'ı güncelle
   */
  updateUI(state) {
    if (!state) {
      console.warn('updateUI: state null');
      return;
    }
    
    // Progress bar'ları güncelle - değerleri doğrudan kullan
    try {
      const atp = typeof state.atp === 'number' ? state.atp : 0;
      const waste = typeof state.waste === 'number' ? state.waste : 0;
      const stress = typeof state.stress === 'number' ? state.stress : 0;
      const protein = typeof state.protein === 'number' ? state.protein : 0;
      
      // Doğrudan DOM'dan elementleri al ve güncelle
      const atpBar = document.getElementById('progress-atp');
      const atpValue = document.getElementById('value-atp');
      if (atpBar) {
        atpBar.style.width = `${Math.max(0, Math.min(100, atp))}%`;
        atpBar.setAttribute('aria-valuenow', Math.round(atp));
      }
      if (atpValue) {
        atpValue.textContent = Math.round(atp);
      }
      
      const wasteBar = document.getElementById('progress-waste');
      const wasteValue = document.getElementById('value-waste');
      if (wasteBar) {
        wasteBar.style.width = `${Math.max(0, Math.min(100, waste))}%`;
        wasteBar.setAttribute('aria-valuenow', Math.round(waste));
      }
      if (wasteValue) {
        wasteValue.textContent = Math.round(waste);
      }
      
      const stressBar = document.getElementById('progress-stress');
      const stressValue = document.getElementById('value-stress');
      if (stressBar) {
        stressBar.style.width = `${Math.max(0, Math.min(100, stress))}%`;
        stressBar.setAttribute('aria-valuenow', Math.round(stress));
      }
      if (stressValue) {
        stressValue.textContent = Math.round(stress);
      }
      
      const proteinBar = document.getElementById('progress-protein');
      const proteinValue = document.getElementById('value-protein');
      if (proteinBar) {
        proteinBar.style.width = `${Math.max(0, Math.min(100, protein))}%`;
        proteinBar.setAttribute('aria-valuenow', Math.round(protein));
      }
      if (proteinValue) {
        proteinValue.textContent = Math.round(protein);
      }
      
    } catch (error) {
      console.error('Progress bar güncelleme hatası:', error);
    }
    
    // Buton cooldown'ları
    if (state.actionCooldowns) {
      Object.keys(state.actionCooldowns).forEach(action => {
        const maxCooldown = this.config.actions[action]?.cooldown || 0;
        this.ui.updateButtonCooldown(action, state.actionCooldowns[action], maxCooldown);
      });
    }
    
    // Zaman gösterimi - elapsedTime milisaniye cinsinden, saniyeye çevir
    const timeDisplay = document.getElementById('game-time');
    if (timeDisplay) {
      if (state.elapsedTime !== undefined && state.elapsedTime !== null) {
        const seconds = Math.floor(state.elapsedTime / 1000);
        timeDisplay.textContent = this.ui.formatTime(seconds);
      } else {
        timeDisplay.textContent = '0:00';
      }
    }
    
    // Kritik uyarılar
    if (state.atp < this.config.thresholds.atpCritical && 
        state.eventEffects && 
        !state.eventEffects.atpWarningShown) {
      this.ui.showToast('⚠️ Enerji Krizi! ATP kritik seviyede.', 'warning');
      if (this.audio && this.audio.playWarning) {
        this.audio.playWarning();
      }
      this.state.update({ 
        eventEffects: { 
          ...state.eventEffects, 
          atpWarningShown: true 
        } 
      });
    }
  }
  
  /**
   * Organel görsel güncelleme animasyonu
   */
  startCanvasAnimation() {
    const animate = () => {
      const state = this.state.get();
      if (!state.isRunning) return;
      
      // Tüm organellerin görsellerini güncelle
      this.organelleConfig.forEach(config => {
        this.updateOrganelleVisual(config.id, state);
      });
      
      // Stres efekti uygula
      const cellScene = document.getElementById('cell-scene');
      if (cellScene) {
        if (state.stress > 70) {
          cellScene.classList.add('stress-high');
        } else {
          cellScene.classList.remove('stress-high');
        }
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  /**
   * Grafik animasyonu
   */
  startGraphAnimation() {
    const graphCanvas = document.getElementById('graph-canvas');
    if (!graphCanvas) return;
    
    const ctx = graphCanvas.getContext('2d');
    const drawGraph = () => {
      const state = this.state.get();
      const graphData = state.graphData;
      
      const width = graphCanvas.width = graphCanvas.offsetWidth;
      const height = graphCanvas.height = graphCanvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      if (graphData.atp.length < 2) return;
      
      // Grid çiz
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // ATP çizgisi
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const maxPoints = graphData.atp.length;
      const stepX = width / (maxPoints - 1);
      
      graphData.atp.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value / 100) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    };
    
    const animate = () => {
      drawGraph();
      if (this.state.get().isRunning) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }
  
  /**
   * Rozetleri kontrol et
   */
  checkBadges() {
    const state = this.state.get();
    if (!state.isRunning) return;
    
    // 3 dakika hayatta kal
    this.checkBadge('survivor_3min', () => state.elapsedTime >= 180);
    
    // ATP 60+ seviyede 45 saniye tut
    if (state.atp >= 60) {
      const progress = (state.badgeProgress.atp_master || 0) + 1;
      this.state.updateBadgeProgress('atp_master', progress);
      this.checkBadge('atp_master', () => progress >= 45);
    } else {
      // ATP düşerse ilerlemeyi sıfırla
      if (state.badgeProgress.atp_master > 0) {
        this.state.updateBadgeProgress('atp_master', 0);
      }
    }
    
    // Atık 30 altına 3 kez düşür (sadece eşik geçildiğinde say)
    const currentWaste = state.waste;
    const prevWaste = state.prevWaste || currentWaste;
    
    // Eşik geçişi kontrolü (30'un üstünden altına düştüyse)
    if (prevWaste >= 30 && currentWaste < 30) {
      const wasteCount = (state.badgeProgress.waste_cleaner || 0) + 1;
      this.state.updateBadgeProgress('waste_cleaner', wasteCount);
      this.checkBadge('waste_cleaner', () => wasteCount >= 3);
    }
    
    // Önceki değeri kaydet
    this.state.update({ prevWaste: currentWaste });
    
    // Mitokondri 90+ health ile bitir (oyun bitince kontrol edilecek)
    if (state.organelles.mitochondria >= 90) {
      this.checkBadge('mito_guardian', () => false); // Oyun bitince kontrol edilecek
    }
    
    // Stres 20 altında 60 saniye
    if (state.stress < 20) {
      const progress = (state.badgeProgress.calm_cell || 0) + 1;
      this.state.updateBadgeProgress('calm_cell', progress);
      this.checkBadge('calm_cell', () => progress >= 60);
    } else {
      if (state.badgeProgress.calm_cell > 0) {
        this.state.updateBadgeProgress('calm_cell', 0);
      }
    }
    
    // Organel koruyucusu - 5 dakika hiç organel kaybetmeden
    const allOrganellesAlive = Object.values(state.organelles).every(h => h > 0);
    if (allOrganellesAlive) {
      this.checkBadge('organelle_protector', () => state.elapsedTime >= 300);
    }
    
    // Denge ustası - oyun bitince kontrol edilecek (handleGameOver'da)
  }
  
  /**
   * Tek bir rozeti kontrol et
   */
  checkBadge(badgeId, condition) {
    if (condition()) {
      const state = this.state.get();
      if (!state.badges.includes(badgeId)) {
        const isNew = this.state.addBadge(badgeId);
        if (isNew) {
          const badge = this.content.badges.find(b => b.id === badgeId);
          if (badge) {
            this.ui.showToast(`🏆 Rozet kazanıldı: ${badge.name}!`, 'success', 5000);
            this.audio.playBadge();
            this.storage.saveGameState(this.state.get());
          }
        }
      }
    }
  }
  
  /**
   * Oyun bitişini işle
   */
  handleGameOver(reasons) {
    this.stop();
    
    const state = this.state.get();
    
    // Son rozet kontrolleri
    // Mitokondri 90+ health ile bitir
    if (state.organelles.mitochondria >= 90) {
      this.checkBadge('mito_guardian', () => true);
    }
    
    // Denge ustası - tüm barlar 40-80 aralığında
    const allInRange = 
      state.atp >= 40 && state.atp <= 80 &&
      state.waste >= 40 && state.waste <= 80 &&
      state.stress >= 40 && state.stress <= 80 &&
      state.protein >= 40 && state.protein <= 80;
    this.checkBadge('balance_master', () => allInRange);
    
    // Oyun bitiş ekranı göster
    const gameOverModal = document.getElementById('game-over-modal');
    if (gameOverModal) {
      gameOverModal.classList.remove('hidden');
      const reasonsEl = document.getElementById('game-over-reasons');
      if (reasonsEl) {
        reasonsEl.innerHTML = reasons.map(r => `<li>${r}</li>`).join('');
      }
      
      // İpuçları
      const hintsEl = document.getElementById('game-over-hints');
      if (hintsEl) {
        hintsEl.innerHTML = `
          <li>ATP seviyesini yüksek tutmaya çalışın</li>
          <li>Atık birikimini önlemek için düzenli temizlik yapın</li>
        `;
      }
    }
    
    // İstatistikleri kaydet
    this.storage.saveGameState(this.state.get());
  }
  
  /**
   * Oyunu durdur
   */
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.badgeCheckInterval) {
      clearInterval(this.badgeCheckInterval);
      this.badgeCheckInterval = null;
    }
    this.state.stopGame();
  }
  
  /**
   * Ekranı göster
   */
  show() {
    this.ui.showScreen('sim');
    
    // UI elementlerini yeniden cache'le (ekran gösterildikten sonra)
    this.ui.cacheElements();
    
    // Organelleri render et (eğer henüz render edilmediyse)
    this.renderOrganelles();
    
    const state = this.state.get();
    
    // İlk açılışta hoş geldin mesajı göster
    if (!this.welcomeShown) {
      this.showWelcomeMessage();
      this.welcomeShown = true;
    }
    
    // Her zaman oyunu başlat (yeni oyun veya devam)
    // Önce mevcut interval'ları temizle
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.badgeCheckInterval) {
      clearInterval(this.badgeCheckInterval);
      this.badgeCheckInterval = null;
    }
    
    // Eğer oyun çalışmıyorsa başlat
    if (!state.isRunning) {
      this.start();
    } else if (state.isPaused) {
      // Oyun duraklatılmışsa devam ettir
      this.state.update({ isPaused: false });
      // Interval'ları yeniden başlat
      this.lastTickTime = Date.now();
      const tickIntervalMs = this.config.tickInterval || 500;
      const tickFunction = () => {
        this.tick();
      };
      this.tickInterval = setInterval(tickFunction, tickIntervalMs);
      if (this.checkBadges) {
        this.badgeCheckInterval = setInterval(() => this.checkBadges(), 1000);
      }
    } else {
      // Oyun zaten çalışıyor, sadece UI'ı güncelle
      this.updateUI(state);
    }
  }
  
  /**
   * Hoş geldin mesajı göster ve seslendir
   */
  showWelcomeMessage() {
    // Mesaj metni (ortaokul seviyesi)
    const welcomeText = `Hücre simülasyonuna hoş geldin! Burada hücreyi yöneteceksin. Sol tarafta hücre ve organelleri görüyorsun. Sağ tarafta ise ATP, Atık, Stres ve Protein seviyelerini takip edebilirsin. Organelleri tıklayarak bilgi alabilir, butonlarla aksiyonlar yapabilirsin. Amacın hücreyi hayatta tutmak ve organeller arası dengeyi korumak. Başarılar!`;
    
    // Toast mesajı göster
    this.ui.showToast('🎮 Hücre Simülasyonu Başladı!', 'info', 5000);
    
    // Ekranda bilgi kutusu göster (önce modal göster)
    this.showInfoModal(welcomeText);
    
    // Seslendirme (modal gösterildikten sonra)
    setTimeout(() => {
      this.speakText(welcomeText, () => {
        // Seslendirme bittiğinde modal'ı kapat
        const modal = document.getElementById('sim-welcome-modal');
        if (modal && !modal.classList.contains('fade-out')) {
          setTimeout(() => {
            if (modal.parentNode) {
              modal.classList.add('fade-out');
              setTimeout(() => {
                modal.remove();
              }, 300);
            }
          }, 2000); // 2 saniye bekle, sonra kapat
        }
      });
    }, 500);
  }
  
  /**
   * Bilgi modalı göster
   */
  showInfoModal(text) {
    // Mevcut modal varsa kaldır
    const existingModal = document.getElementById('sim-welcome-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Modal oluştur
    const modal = document.createElement('div');
    modal.id = 'sim-welcome-modal';
    modal.className = 'sim-welcome-modal';
    modal.innerHTML = `
      <div class="sim-welcome-content">
        <h3>🎮 Hücre Simülasyonu</h3>
        <p>${text}</p>
        <button id="sim-welcome-close" class="btn btn-primary">Anladım</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Kapat butonu
    const closeBtn = modal.querySelector('#sim-welcome-close');
    closeBtn.addEventListener('click', () => {
      this.stopSpeaking(); // Seslendirmeyi durdur
      modal.classList.add('fade-out');
      setTimeout(() => {
        modal.remove();
      }, 300);
    });
    
    // Fallback: 30 saniye sonra otomatik kapat (seslendirme çalışmazsa veya çok uzun sürerse)
    setTimeout(() => {
      if (modal.parentNode && !modal.classList.contains('fade-out')) {
        modal.classList.add('fade-out');
        setTimeout(() => {
          modal.remove();
        }, 300);
      }
    }, 30000); // 30 saniye güvenlik süresi
  }
  
  /**
   * Ekranı gizle
   */
  hide() {
    this.stopSpeaking();
    this.stop();
    
    // Welcome modal'ı kaldır
    const modal = document.getElementById('sim-welcome-modal');
    if (modal) {
      modal.remove();
    }
  }
}

export default SimulationScreen;

