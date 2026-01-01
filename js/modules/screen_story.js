/**
 * Story Ekranı - Hikâye adımlarını gösterir
 */

class StoryScreen {
  constructor(stateManager, uiManager, content, config) {
    this.state = stateManager;
    this.ui = uiManager;
    this.content = content;
    this.config = config;
    
    this.currentStepIndex = 0;
    this.currentPhase = 'intro'; // intro, tour, startDay
    this.allSteps = [];
    this.eventListeners = [];
    this.speechBubble = null;
    this.selectedOption = null; // Decision adımlarında seçilen seçenek
    this.decisionsMade = []; // Yapılan kararların listesi {step, option}
    this.speechSynthesis = null; // Text-to-speech için
    this.currentUtterance = null; // Mevcut okuma
    this.currentSpeakingOrganelle = null; // Şu anda konuşan organel
    
    this.init();
  }
  
  init() {
    this.prepareSteps();
    this.setupOrganelleConfig();
    this.setupEventListeners();
    this.speechBubble = this.ui.createSpeechBubble();
    this.initSpeechSynthesis();
    
    // Organel pozisyon haritası (ekran yüzdesi olarak)
    this.organellePositions = {
      nucleus: { x: 50, y: 50 },      // Merkez
      mitochondria: { x: 25, y: 35 }, // Sol-orta
      ribosome: { x: 75, y: 35 },     // Sağ-orta
      er: { x: 50, y: 25 },           // Üst-orta
      golgi: { x: 75, y: 65 },        // Sağ-alt
      lysosome: { x: 20, y: 70 },     // Sol-alt
      vacuole: { x: 50, y: 75 }       // Alt-orta
    };
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
   * Metni sesli oku
   */
  speakText(text) {
    // Önceki okumayı durdur
    this.stopSpeaking();
    
    if (!text) return;
    
    // Web Speech API kontrolü
    if (!this.speechSynthesis) {
      console.warn('Web Speech API desteklenmiyor');
      return;
    }
    
    // SpeechSynthesis hazır olmayabilir, kısa bir gecikme ekle
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    
    // Utterance oluştur
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9; // Biraz yavaş
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Hata yakalama
    utterance.onerror = (event) => {
      console.error('Seslendirme hatası:', event.error);
    };
    
    // Kelime takibi için: metni kelimelere böl
    const words = this.parseWords(text);
    let boundaryWorking = false;
    
    // Boundary event: hangi karakter söyleniyor takip et (birincil yöntem)
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        boundaryWorking = true;
        const charIndex = event.charIndex;
        
        // Hangi kelime söyleniyor bul
        const currentWord = words.find(w => 
          charIndex >= w.startIndex && charIndex < w.endIndex
        );
        
        if (currentWord) {
          // Kelimeyi normalize et (büyük/küçük harf duyarsız)
          const normalizedWord = currentWord.text.toLowerCase().replace(/[.,!?]/g, '');
          
          // İlgili progress bar'ı highlight et
          this.highlightProgressBar(normalizedWord);
        }
      }
    };
    
    // Fallback: Eğer boundary event çalışmazsa, kelime bazlı zamanlama kullan
    // 2 saniye sonra kontrol et, eğer boundary çalışmamışsa alternatif yöntemi kullan
    setTimeout(() => {
      if (!boundaryWorking && this.currentUtterance === utterance) {
        // Kelime zamanlamalarını hesapla
        const estimatedDuration = (text.length / utterance.rate) * 1000; // ms
        const wordTimings = this.calculateWordTimings(words, text, estimatedDuration);
        
        // Her kelime için highlight zamanlaması
        wordTimings.forEach((timing, index) => {
          setTimeout(() => {
            if (this.currentUtterance === utterance) {
              const normalizedWord = words[index].text.toLowerCase().replace(/[.,!?]/g, '');
              this.highlightProgressBar(normalizedWord);
            }
          }, timing.startTime);
        });
      }
    }, 2000);
    
    // Seslendirme bittiğinde tüm highlight'ları kaldır
    utterance.onend = () => {
      this.removeAllProgressHighlights();
      
      // Eğer organel adımındaysak, organel highlight'ını da kaldır
      if (this.currentSpeakingOrganelle) {
        this.removeAllHighlights();
        this.currentSpeakingOrganelle = null;
      }
    };
    
    this.currentUtterance = utterance;
    
    // Kısa bir gecikme ile başlat (DOM hazır olsun)
    setTimeout(() => {
      try {
        this.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Seslendirme başlatma hatası:', error);
      }
    }, 100);
  }
  
  /**
   * Metni kelimelere böl ve pozisyonları hesapla
   */
  parseWords(text) {
    const words = [];
    // Türkçe karakterleri de içeren kelime regex'i
    const regex = /\b[\wçğıöşüÇĞIİÖŞÜ]+\b/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      words.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return words;
  }
  
  /**
   * Kelime zamanlamalarını hesapla (tahmini)
   */
  calculateWordTimings(words, fullText, totalDuration) {
    const timings = [];
    let currentTime = 0;
    
    words.forEach((word, index) => {
      // Kelime uzunluğuna göre tahmini süre (kelime başına ~200-300ms)
      const wordDuration = Math.max(200, word.text.length * 50);
      const startTime = currentTime;
      
      timings.push({
        startTime: startTime,
        endTime: startTime + wordDuration
      });
      
      currentTime += wordDuration;
    });
    
    return timings;
  }
  
  /**
   * Progress bar'ı highlight et
   */
  highlightProgressBar(word) {
    // Önce tüm highlight'ları kaldır
    this.removeAllProgressHighlights();
    
    // Kelime eşleştirmeleri
    const wordMap = {
      'atp': 'atp',
      'atık': 'waste',
      'stres': 'stress',
      'protein': 'protein'
    };
    
    const barType = wordMap[word];
    if (!barType) return;
    
    // Progress bar container'ı bul (progress-item)
    const progressItems = document.querySelectorAll('#screen-story .progress-item');
    progressItems.forEach(item => {
      const bar = item.querySelector(`.progress-bar.${barType}`);
      if (bar) {
        // Progress item'a highlight class ekle
        item.classList.add('highlighted');
      }
    });
  }
  
  /**
   * Tüm progress bar highlight'larını kaldır
   */
  removeAllProgressHighlights() {
    const progressItems = document.querySelectorAll('#screen-story .progress-item');
    progressItems.forEach(item => {
      item.classList.remove('highlighted');
    });
  }
  
  /**
   * Sesli okumayı durdur
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
        initialPos: { x: 25, y: 35 }, // Sol üst, daha uzak
        size: { width: 'clamp(90px, 18%, 150px)', height: 'clamp(90px, 18%, 150px)' },
        stateKey: 'mitochondria',
        count: 4 // Gerçekçi: 3-5 arası
      },
      {
        id: 'golgi',
        normalSrc: 'resimler/golgi_normal.png',
        damagedSrc: 'resimler/golgi_damaged.png',
        initialPos: { x: 75, y: 65 }, // Sağ alt, daha uzak
        size: { width: 'clamp(85px, 17%, 135px)', height: 'clamp(85px, 17%, 135px)' },
        stateKey: 'golgi',
        count: 1
      },
      {
        id: 'er',
        normalSrc: 'resimler/er_normal.png',
        damagedSrc: 'resimler/er_damaged.png',
        initialPos: { x: 50, y: 25 }, // Üst orta, daha uzak
        size: { width: 'clamp(105px, 19%, 165px)', height: 'clamp(60px, 12%, 90px)' },
        stateKey: null,
        count: 1
      },
      {
        id: 'lysosome',
        normalSrc: 'resimler/lysosome_normal.png',
        damagedSrc: 'resimler/lysosome_damaged.png',
        initialPos: { x: 20, y: 70 }, // Sol alt, daha uzak
        size: { width: 'clamp(70px, 14%, 110px)', height: 'clamp(70px, 14%, 110px)' },
        stateKey: 'lysosome',
        count: 3 // Gerçekçi: 2-3 arası
      },
      {
        id: 'vacuole',
        normalSrc: 'resimler/vacuole_normal.png',
        damagedSrc: 'resimler/vacuole_damaged.png',
        initialPos: { x: 80, y: 40 }, // Sağ üst, daha uzak
        size: { width: 'clamp(90px, 18%, 150px)', height: 'clamp(90px, 18%, 150px)' },
        stateKey: null,
        count: 2 // Gerçekçi: 1-2 arası
      },
      {
        id: 'ribosome',
        normalSrc: 'resimler/ribosome_normal.png',
        damagedSrc: 'resimler/ribosome_damaged.png',
        initialPos: { x: 50, y: 50 }, // Merkez (random pozisyonlar kullanılacak)
        size: { width: 'clamp(50px, 10%, 80px)', height: 'clamp(50px, 10%, 80px)' },
        stateKey: 'ribosome',
        count: 4
      }
    ];
  }
  
  /**
   * Hücre sahnesini kur
   */
  setupCellScene() {
    const cellScene = document.getElementById('story-cell-scene');
    if (!cellScene) return;
    
    // Organelleri render et
    this.renderOrganelles();
  }
  
  /**
   * Organelleri DOM'a render et
   */
  renderOrganelles() {
    const cellScene = document.getElementById('story-cell-scene');
    if (!cellScene) return;
    
    // Mevcut organelleri temizle
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
    
    const organelleId = config.count > 1 && index > 0 
      ? `${config.id}-${index}` 
      : config.id;
    
    organelleEl.id = `story-organelle-${organelleId}`;
    organelleEl.setAttribute('data-organelle-id', config.id);
    
    let posX = config.initialPos.x;
    let posY = config.initialPos.y;
    
    // Çoklu organeller için random pozisyon (merkeze yakın, aralarında mesafe)
    if (config.count > 1) {
      if (config.id === 'ribosome') {
        // Ribosome için çember şeklinde dağıt
        const angle = (index * (360 / config.count)) * (Math.PI / 180);
        const radius = 12 + Math.random() * 8; // 12-20% yarıçap
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
    
    const img = document.createElement('img');
    img.className = 'organelle-image';
    img.alt = `${config.id} organeli`;
    organelleEl.appendChild(img);
    
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
   * Organel görselini güncelle
   */
  updateOrganelleVisual(organelleId, state, config = null) {
    const baseId = organelleId.split('-')[0];
    const organelleEl = document.getElementById(`story-organelle-${organelleId}`);
    if (!organelleEl) return;
    
    if (!config) {
      config = this.organelleConfig.find(c => c.id === baseId);
      if (!config) return;
    }
    
    let health = 100;
    if (config.stateKey && state.organelles && state.organelles[config.stateKey] !== undefined) {
      health = state.organelles[config.stateKey];
    } else if (state.organelleHealth && state.organelleHealth[organelleId] !== undefined) {
      health = state.organelleHealth[organelleId];
    }
    
    const img = organelleEl.querySelector('.organelle-image');
    if (img) {
      img.src = health < 40 ? config.damagedSrc : config.normalSrc;
    }
    
    organelleEl.classList.remove('normal', 'damaged');
    if (health < 40) {
      organelleEl.classList.add('damaged');
    } else {
      organelleEl.classList.add('normal');
    }
    
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
   * Progress barları güncelle
   */
  updateProgressBars() {
    const state = this.state.get();
    
    // ATP - state'ten direkt oku (vars değil)
    const atpValue = Math.round(state.atp || 70);
    const atpBar = document.getElementById('story-progress-atp');
    const atpValueEl = document.getElementById('story-value-atp');
    if (atpBar) {
      atpBar.style.width = `${atpValue}%`;
      atpBar.setAttribute('aria-valuenow', atpValue);
    }
    if (atpValueEl) atpValueEl.textContent = atpValue;
    
    // Waste
    const wasteValue = Math.round(state.waste || 20);
    const wasteBar = document.getElementById('story-progress-waste');
    const wasteValueEl = document.getElementById('story-value-waste');
    if (wasteBar) {
      wasteBar.style.width = `${wasteValue}%`;
      wasteBar.setAttribute('aria-valuenow', wasteValue);
    }
    if (wasteValueEl) wasteValueEl.textContent = wasteValue;
    
    // Stress
    const stressValue = Math.round(state.stress || 10);
    const stressBar = document.getElementById('story-progress-stress');
    const stressValueEl = document.getElementById('story-value-stress');
    if (stressBar) {
      stressBar.style.width = `${stressValue}%`;
      stressBar.setAttribute('aria-valuenow', stressValue);
    }
    if (stressValueEl) stressValueEl.textContent = stressValue;
    
    // Protein
    const proteinValue = Math.round(state.protein || 30);
    const proteinBar = document.getElementById('story-progress-protein');
    const proteinValueEl = document.getElementById('story-value-protein');
    if (proteinBar) {
      proteinBar.style.width = `${proteinValue}%`;
      proteinBar.setAttribute('aria-valuenow', proteinValue);
    }
    if (proteinValueEl) proteinValueEl.textContent = proteinValue;
  }
  
  /**
   * Tüm adımları hazırla
   */
  prepareSteps() {
    const story = this.content.story;
    if (!story) return;
    
    // Önem sırasına göre organel adımları zaten content.json'da sıralı
    this.allSteps = [
      ...story.introSteps,
      ...story.tourSteps, // Organel tanıtımları burada (önem sırasına göre)
      ...story.decisionSteps,
      ...story.startDaySteps
    ];
    
    // Debug: Organel adımlarını kontrol et
    const organelSteps = this.allSteps.filter(s => s.type === 'organel');
    console.log('Organel tanıtım adımları:', organelSteps.length, 'adet');
    organelSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.title} (${step.focusOrg})`);
    });
  }
  
  /**
   * Event listener'ları kur
   */
  setupEventListeners() {
    // Event delegation kullan (butonlar her zaman mevcut)
    const storyCard = document.getElementById('story-card');
    const storyScreen = document.getElementById('screen-story');
    
    // Story screen'e event listener ekle (story-card gizli olsa bile çalışsın)
    if (storyScreen) {
      const clickHandler = (e) => {
        const target = e.target;
        console.log('Click event:', target.id, target.className);
        
        if (target.id === 'story-next' || target.closest('#story-next')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = document.getElementById('story-next');
          console.log('Next buton tıklandı, disabled:', btn?.disabled);
          if (btn && !btn.disabled) {
            this.nextStep();
          } else {
            console.warn('Next buton disabled veya bulunamadı');
          }
        } else if (target.id === 'story-prev' || target.closest('#story-prev')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = document.getElementById('story-prev');
          if (btn && !btn.disabled) {
            this.prevStep();
          }
        }
      };
      storyScreen.addEventListener('click', clickHandler);
      this.eventListeners.push({ element: storyScreen, event: 'click', handler: clickHandler });
    }
    
    // Story card'a da ekle (geriye dönük uyumluluk)
    if (storyCard) {
      const clickHandler = (e) => {
        const target = e.target;
        if (target.id === 'story-next' || target.closest('#story-next')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = document.getElementById('story-next');
          if (btn && !btn.disabled) {
            this.nextStep();
          }
        } else if (target.id === 'story-prev' || target.closest('#story-prev')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = document.getElementById('story-prev');
          if (btn && !btn.disabled) {
            this.prevStep();
          }
        }
      };
      storyCard.addEventListener('click', clickHandler);
      this.eventListeners.push({ element: storyCard, event: 'click', handler: clickHandler });
    }
    
    // Klavye navigasyonu
    const keyboardHandler = (e) => {
      // Sadece story ekranı aktifken çalışsın
      const storyScreen = document.getElementById('screen-story');
      if (!storyScreen || storyScreen.classList.contains('hidden')) {
        return;
      }
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        const btn = document.getElementById('story-next');
        if (btn && !btn.disabled) {
          this.nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const btn = document.getElementById('story-prev');
        if (btn && !btn.disabled) {
          this.prevStep();
        }
      }
    };
    document.addEventListener('keydown', keyboardHandler);
    this.eventListeners.push({ element: document, event: 'keydown', handler: keyboardHandler });
  }
  
  /**
   * Event listener'ları temizle
   */
  cleanupEventListeners() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
  
  /**
   * Sonraki adıma geç
   */
  nextStep() {
    const step = this.allSteps[this.currentStepIndex];
    console.log(`nextStep çağrıldı: Mevcut adım ${this.currentStepIndex}, tip: ${step?.type}`);
    
    // Decision adımında seçim yapılmadıysa geçiş yapma
    if (step && step.type === 'decision' && !this.selectedOption) {
      console.log('Decision adımında seçim yapılmadı, geçiş yapılamıyor');
      return;
    }
    
    // Mevcut sesi durdur
    this.stopSpeaking();
    
    // Son adımdaysa özet ekranına geç
    if (this.currentStepIndex >= this.allSteps.length - 1) {
      console.log('Son adıma ulaşıldı, özet ekranına geçiliyor');
      // Story bitti, storyCompleted flag'ini set et
      this.state.markStoryCompleted();
      // Özet ekranına geç
      this.showSummary();
      return;
    }
    
    // Sonraki adıma geç
    this.currentStepIndex++;
    const newStep = this.allSteps[this.currentStepIndex];
    console.log(`Sonraki adıma geçildi: ${this.currentStepIndex}, tip: ${newStep?.type}, başlık: ${newStep?.title}`);
    
    // Yeni adım decision ise seçimi sıfırla (yeni bir decision için)
    // Yeni adım decision değilse de seçimi sıfırla
    if (!newStep || newStep.type !== 'decision') {
      this.selectedOption = null;
    } else {
      // Yeni adım da decision ise, önceki seçimi sıfırla (yeni decision için)
      this.selectedOption = null;
      console.log('Yeni decision adımına geçildi, seçim sıfırlandı');
    }
    
    // Progress barları güncelle
    this.updateProgressBars();
    
    // Yeni adımı render et (sesli okuma otomatik başlar)
    this.render();
  }
  
  /**
   * Önceki adıma dön
   */
  prevStep() {
    if (this.currentStepIndex > 0) {
      // Mevcut sesi durdur
      this.stopSpeaking();
      
      this.currentStepIndex--;
      this.selectedOption = null; // Seçimi sıfırla
      
      // Progress barları güncelle
      this.updateProgressBars();
      
      // Yeni adımı render et (sesli okuma otomatik başlar)
      this.render();
    }
  }
  
  /**
   * Story kartını render et
   */
  render() {
    const container = document.getElementById('screen-story');
    if (!container) {
      console.error('Story container bulunamadı');
      return;
    }
    
    const step = this.allSteps[this.currentStepIndex];
    if (!step) {
      console.error(`Adım bulunamadı: index ${this.currentStepIndex}`);
      return;
    }
    
    console.log(`Render: Adım ${this.currentStepIndex + 1}/${this.allSteps.length} - ${step.type} - ${step.title}`);
    
    const storyCard = document.getElementById('story-card');
    if (!storyCard) {
      console.error('Story card bulunamadı');
      return;
    }
    
    // Decision adımlarında story-card'ı göster, diğer durumlarda ikinci mesajdan sonra gizle
    if (step.type === 'decision') {
      // Decision adımlarında story-card'ı göster
      storyCard.classList.remove('hidden');
      
      // Başlık
      const titleEl = storyCard.querySelector('.story-title');
      if (titleEl) {
        titleEl.textContent = step.title;
      }
      
      // Metin
      const textEl = storyCard.querySelector('.story-text');
      if (textEl) {
        textEl.textContent = step.text;
      }
    } else if (this.currentStepIndex >= 1) {
      // İkinci mesajdan sonra (index >= 1) story-card'ı gizle (decision değilse)
      storyCard.classList.add('hidden');
    } else {
      // İlk mesajda story-card'ı göster
      storyCard.classList.remove('hidden');
      
      // Başlık
      const titleEl = storyCard.querySelector('.story-title');
      if (titleEl) {
        titleEl.textContent = step.title;
      }
      
      // Metin
      const textEl = storyCard.querySelector('.story-text');
      if (textEl) {
        textEl.textContent = step.text;
      }
    }
    
    // Organel adımlarında özel işlemler
    console.log(`Adım tipi kontrolü: ${step.type}, focusOrg: ${step.focusOrg}`);
    if (step.type === 'organel' && step.focusOrg) {
      console.log(`=== ORGANEL TANITIMI BAŞLIYOR: ${step.title} (${step.focusOrg}) ===`);
      
      // Organel elementlerinin DOM'da olduğundan emin ol
      // Önce hücre sahnesini kontrol et
      const cellScene = document.getElementById('story-cell-scene');
      if (!cellScene) {
        console.error('Hücre sahnesi bulunamadı, oluşturuluyor...');
        this.setupCellScene();
      }
      
      // Organel elementini bul
      let organelleEl = document.getElementById(`story-organelle-${step.focusOrg}`);
      if (!organelleEl) {
        // Tüm organel elementlerini kontrol et
        const allOrganelles = document.querySelectorAll('#story-cell-scene .organelle-item');
        console.log(`Organel elementleri aranıyor: ${allOrganelles.length} adet bulundu`);
        organelleEl = Array.from(allOrganelles).find(el => 
          el.getAttribute('data-organelle-id') === step.focusOrg
        );
        
        if (!organelleEl) {
          console.warn(`Organel elementi bulunamadı: ${step.focusOrg}, yeniden render ediliyor...`);
          // Organelleri yeniden render et
          this.renderOrganelles();
          
          // Tekrar dene
          organelleEl = document.getElementById(`story-organelle-${step.focusOrg}`);
          if (!organelleEl) {
            const allOrganelles2 = document.querySelectorAll('#story-cell-scene .organelle-item');
            organelleEl = Array.from(allOrganelles2).find(el => 
              el.getAttribute('data-organelle-id') === step.focusOrg
            );
          }
        }
      }
      
      if (organelleEl) {
        console.log(`Organel elementi bulundu: ${step.focusOrg}`);
      } else {
        console.warn(`Organel elementi hala bulunamadı: ${step.focusOrg}, fallback kullanılacak`);
      }
      
      // Önce organel ışıldasın (hemen görünsün)
      this.highlightOrganelle(step.focusOrg);
      // Şu anda konuşan organeli kaydet (sesli okuma bitince highlight kaldırılacak)
      this.currentSpeakingOrganelle = step.focusOrg;
      
      // Kısa bir gecikme ile konuşma balonu göster (organel elementleri hazır olsun)
      setTimeout(() => {
        console.log(`Konuşma balonu gösteriliyor: ${step.title}`);
        this.showOrganelleSpeechBubble(step);
      }, 500);
      
      // Organel metnini sesli oku (biraz gecikme ile, balon hazır olsun)
      // Işıldama sesli okuma bitene kadar devam edecek
      setTimeout(() => {
        console.log(`Sesli okuma başlatılıyor: ${step.title}`);
        this.speakText(step.text);
      }, 800);
    } else {
      // Organel adımı değilse
      if (this.speechBubble) {
        this.speechBubble.hide();
      }
      
      // Tüm organel highlight'larını kaldır
      this.removeAllHighlights();
      
      // İlk mesajdan itibaren sesli okuma (narration ve decision için)
      if (step.type === 'narration' || step.type === 'decision') {
        const textToSpeak = `${step.title}. ${step.text}`;
        // Seslendirmeyi biraz geciktir (DOM hazır olsun)
        setTimeout(() => {
          this.speakText(textToSpeak);
        }, 300);
      }
    }
    
    // Decision adımları - ÖNCE renderDecisionStep çağrılmalı
    if (step.type === 'decision') {
      console.log('Decision adımı tespit edildi, renderDecisionStep çağrılıyor');
      // Decision adımında story-card'ı göster (yukarıda yapıldı)
      // Önceki decision'dan kalan UI'ı temizle
      this.hideDecisionUI();
      // Şimdi decision step'i render et (seçenekler gösterilecek)
      this.renderDecisionStep(step);
    } else {
      console.log('Decision adımı değil, UI gizleniyor');
      // Decision olmayan adımlarda decision UI'ı gizle
      this.hideDecisionUI();
      // Decision olmayan adımlarda seçimi sıfırla
      this.selectedOption = null;
    }
    
    // İleri butonu - her zaman güncelle
    const nextButton = document.getElementById('story-next');
    if (nextButton) {
      // Decision adımında seçim yapılmadıysa buton pasif
      if (step.type === 'decision' && !this.selectedOption) {
        nextButton.disabled = true;
        nextButton.textContent = step.nextLabel || 'Devam';
        nextButton.setAttribute('aria-disabled', 'true');
      } else {
        // Buton aktif
        nextButton.disabled = false;
        nextButton.removeAttribute('aria-disabled');
        nextButton.textContent = step.nextLabel || 'İleri';
        // Son adımda buton metni değişir
        if (this.currentStepIndex === this.allSteps.length - 1) {
          nextButton.textContent = 'Oyunu Başlat';
        }
      }
    }
    
    // Geri butonu
    const prevButton = document.getElementById('story-prev');
    if (prevButton) {
      prevButton.disabled = this.currentStepIndex === 0;
    }
    
    // Progress
    const progressEl = storyCard.querySelector('.story-progress');
    if (progressEl) {
      progressEl.textContent = `${this.currentStepIndex + 1} / ${this.allSteps.length}`;
    }
  }
  
  /**
   * Decision adımını render et
   */
  renderDecisionStep(step) {
    console.log('renderDecisionStep çağrıldı:', step);
    const storyCard = document.getElementById('story-card');
    if (!storyCard) {
      console.error('Story card bulunamadı!');
      return;
    }
    
    // Story card'ın görünür olduğundan emin ol
    storyCard.classList.remove('hidden');
    
    // Seçenekler container'ı
    let optionsContainer = storyCard.querySelector('.story-options');
    if (!optionsContainer) {
      console.log('Options container oluşturuluyor...');
      optionsContainer = document.createElement('div');
      optionsContainer.className = 'story-options';
      
      // Text elementini bul veya story-card'ın sonuna ekle
      const textEl = storyCard.querySelector('.story-text');
      if (textEl && textEl.parentNode) {
        textEl.parentNode.insertBefore(optionsContainer, textEl.nextSibling);
      } else {
        // Text elementi yoksa story-card'ın sonuna ekle
        storyCard.appendChild(optionsContainer);
      }
      console.log('Options container eklendi');
    }
    
    // Eğer seçim yapılmadıysa seçenekleri göster
    if (!this.selectedOption) {
      console.log('Seçenekler gösteriliyor, seçenek sayısı:', step.options?.length);
      optionsContainer.innerHTML = '';
      optionsContainer.classList.remove('hidden');
      
      if (step.options && step.options.length > 0) {
        step.options.forEach((option, index) => {
          const optionButton = document.createElement('button');
          optionButton.className = 'story-option-btn';
          optionButton.textContent = option.label;
          optionButton.setAttribute('data-option-id', option.id);
          optionButton.setAttribute('aria-label', `Seçenek ${index + 1}: ${option.label}`);
          optionButton.addEventListener('click', () => {
            console.log('Seçenek tıklandı:', option.label);
            this.selectOption(step, option);
          });
          optionsContainer.appendChild(optionButton);
          console.log(`Seçenek butonu eklendi: ${option.label}`);
        });
      } else {
        console.error('Step.options bulunamadı veya boş!', step);
      }
      
      // Feedback ve sonuç alanlarını gizle
      this.hideDecisionResult();
    } else {
      // Seçim yapıldıysa seçenekleri gizle, sonucu göster
      console.log('Seçim yapıldı, sonuç gösteriliyor');
      optionsContainer.classList.add('hidden');
      this.showDecisionResult(step, this.selectedOption);
    }
  }
  
  /**
   * Seçenek seçildiğinde
   */
  selectOption(step, option) {
    this.selectedOption = option;
    
    // Kararı kaydet
    this.decisionsMade.push({
      stepId: step.id,
      stepTitle: step.title,
      stepText: step.text,
      optionLabel: option.label,
      optionFeedback: option.feedback,
      delta: option.delta
    });
    
    // Delta değerlerini state'e uygula
    const updates = this.state.applyDelta(option.delta);
    console.log('Delta uygulandı, güncellemeler:', updates);
    
    // Progress barlarını güncelle (sağ paneldeki göstergeler)
    this.updateProgressBars();
    
    // Seçenek butonlarını pasif yap
    const optionButtons = document.querySelectorAll('.story-option-btn');
    optionButtons.forEach(btn => {
      btn.disabled = true;
      if (btn.getAttribute('data-option-id') === option.id) {
        btn.classList.add('selected');
      }
    });
    
    // Karar penceresini gizle (organel animasyonu görünsün)
    const storyCard = document.getElementById('story-card');
    if (storyCard) {
      storyCard.classList.add('hidden');
    }
    
    // İlgili organeli tespit et ve animasyon göster
    const relatedOrganelle = this.detectRelatedOrganelle(option.label, step.text);
    console.log('İlgili organel tespit edildi:', relatedOrganelle, 'Seçenek:', option.label, 'Adım:', step.text);
    if (relatedOrganelle) {
      // Kısa bir gecikme ile animasyonu başlat (DOM güncellemesi için)
      setTimeout(() => {
        this.animateOrganelleActivity(relatedOrganelle);
      }, 100);
    } else {
      console.warn('İlgili organel tespit edilemedi');
    }
    
    // 2 saniye sonra pencereyi tekrar göster ve feedback'i göster
    setTimeout(() => {
      if (storyCard) {
        storyCard.classList.remove('hidden');
      }
      
      // Feedback göster
      this.showDecisionResult(step, option, updates);
      
      // Sesli dönüt ver (kısa ama açıklayıcı)
      this.speakDecisionFeedback(option, updates);
      
      // İleri butonunu aktif et
      const nextButton = document.getElementById('story-next');
      if (nextButton) {
        nextButton.disabled = false;
      }
    }, 2000); // 2 saniye (organel animasyonu süresi)
  }
  
  /**
   * Seçenek label'ından ilgili organeli tespit et
   * Her karar seçeneği için spesifik eşleştirme
   */
  detectRelatedOrganelle(optionLabel, stepText) {
    const label = optionLabel.toLowerCase();
    const text = stepText.toLowerCase();
    const combined = label + ' ' + text;
    
    // Decision 1: "Hücreye besin geldi"
    if (text.includes('hücreye besin geldi')) {
      if (label.includes('atık temizle') || label.includes('temizle')) {
        return 'lysosome';
      }
      // "Hemen besin al" -> koful (depolama)
      if (label.includes('besin al')) {
        return 'vacuole';
      }
    }
    
    // Decision 2: "Mitokondri çok çalışıyor"
    if (text.includes('mitokondri çok çalışıyor')) {
      return 'mitochondria';
    }
    
    // Decision 3: "Ribozomlar protein üretmek istiyor"
    if (text.includes('ribozomlar protein üretmek istiyor')) {
      if (label.includes('protein üret')) {
        return 'ribosome';
      }
      if (label.includes('atp biriktir') || label.includes('enerji biriktir')) {
        return 'mitochondria';
      }
    }
    
    // Decision 4: "Oksijen seviyesi düştü. Mitokondri etkileniyor"
    if (text.includes('oksijen seviyesi düştü') || text.includes('mitokondri etkileniyor')) {
      return 'mitochondria';
    }
    
    // Decision 5: "Atık seviyesi kritik"
    if (text.includes('atık seviyesi kritik')) {
      if (label.includes('lizozom') || label.includes('aktifleştir')) {
        return 'lysosome';
      }
      // "Bekle, kendiliğinden azalsın" -> ER (atık yönetimi)
      if (label.includes('bekle') || label.includes('kendiliğinden')) {
        return 'er';
      }
    }
    
    // Decision 6: "Bir organel hasar gördü"
    if (text.includes('organel hasar gördü')) {
      if (label.includes('onar')) {
        // Onarım için çekirdek (kontrol merkezi) veya genel
        return 'nucleus';
      }
      if (label.includes('enerji topla') || label.includes('atp')) {
        return 'mitochondria';
      }
    }
    
    // Decision 7: "Stres seviyesi yükseliyor"
    if (text.includes('stres seviyesi yükseliyor')) {
      // Sistem yönetimi -> çekirdek (kontrol merkezi)
      if (label.includes('sistemleri yavaşlat') || label.includes('yavaşlat')) {
        return 'nucleus';
      }
      // Normal çalışma -> genel (null)
      return null;
    }
    
    // Decision 8: "Besin kıtlığı"
    if (text.includes('besin kıtlığı') || text.includes('besin gelmiyor')) {
      if (label.includes('enerji tasarrufu') || label.includes('tasarruf')) {
        return 'mitochondria';
      }
      // "Mevcut kaynakları kullan" -> koful (depolama)
      if (label.includes('kaynakları kullan') || label.includes('mevcut')) {
        return 'vacuole';
      }
    }
    
    // Decision 9: "Fazla şeker"
    if (text.includes('fazla şeker') || text.includes('aşırı şeker')) {
      // Şeker işleme -> mitokondri (enerji üretimi)
      return 'mitochondria';
    }
    
    // Decision 10: "Hücre büyümesi"
    if (text.includes('hücre büyümesi') || text.includes('büyümek istiyor')) {
      if (label.includes('büyümeyi destekle') || label.includes('destekle')) {
        // Büyüme için protein -> ribosome ve golgi
        // Önce ribosome, sonra golgi işler
        if (label.includes('protein') || text.includes('protein')) {
          return 'ribosome';
        }
        return 'golgi';
      }
      // "Mevcut durumu koru" -> genel
      return null;
    }
    
    // Genel fallback (yukarıdaki spesifik eşleştirmeler çalışmazsa)
    if (combined.includes('lizozom') || (combined.includes('atık temizle') && !combined.includes('bekle'))) {
      return 'lysosome';
    }
    if (combined.includes('ribozom') || (combined.includes('protein üret') && !combined.includes('atp'))) {
      return 'ribosome';
    }
    if (combined.includes('mitokondri') || (combined.includes('atp üret') && !combined.includes('tasarruf'))) {
      return 'mitochondria';
    }
    if (combined.includes('golgi') || combined.includes('paketle')) {
      return 'golgi';
    }
    if (combined.includes('çekirdek') || combined.includes('nucleus') || combined.includes('dna')) {
      return 'nucleus';
    }
    if (combined.includes('endoplazmik') || (combined.includes('er') && !combined.includes('enerji'))) {
      return 'er';
    }
    if (combined.includes('koful') || combined.includes('vacuole') || combined.includes('depolama')) {
      return 'vacuole';
    }
    
    return null;
  }
  
  /**
   * Özet ekranını göster
   */
  showSummary() {
    // Özet ekranını göster
    const summaryScreen = document.getElementById('screen-summary');
    if (summaryScreen) {
      // Karar analizini göster
      this.renderSummaryAnalysis();
      
      // Karar listesini göster
      this.renderDecisionsList();
      
      // Event listener ekle
      const startSimBtn = document.getElementById('btn-start-sim');
      if (startSimBtn) {
        // Önceki listener'ı kaldır
        const newBtn = startSimBtn.cloneNode(true);
        startSimBtn.parentNode.replaceChild(newBtn, startSimBtn);
        
        // Yeni listener ekle
        newBtn.addEventListener('click', () => {
          this.state.update({ currentScreen: 'sim' });
        });
      }
      
      // Tüm ekranları gizle
      const allScreens = document.querySelectorAll('.screen');
      allScreens.forEach(screen => {
        screen.classList.add('hidden');
      });
      
      // Özet ekranını göster
      summaryScreen.classList.remove('hidden');
      
      console.log('Özet ekranı gösterildi');
    } else {
      console.error('Özet ekranı bulunamadı!');
    }
  }
  
  /**
   * Karar analizini render et
   */
  renderSummaryAnalysis() {
    const analysisEl = document.getElementById('summary-analysis');
    if (!analysisEl) return;
    
    if (this.decisionsMade.length === 0) {
      analysisEl.innerHTML = '<p class="summary-empty">Henüz karar verilmedi.</p>';
      return;
    }
    
    // Mevcut state değerlerini al
    const state = this.state.get();
    const atp = Math.round(state.atp || 0);
    const waste = Math.round(state.waste || 0);
    const stress = Math.round(state.stress || 0);
    const protein = Math.round(state.protein || 0);
    
    // Karar sayısı
    const totalDecisions = this.decisionsMade.length;
    
    // Delta toplamları
    let totalAtpDelta = 0;
    let totalWasteDelta = 0;
    let totalStressDelta = 0;
    let totalProteinDelta = 0;
    
    this.decisionsMade.forEach(decision => {
      totalAtpDelta += decision.delta.atp || 0;
      totalWasteDelta += decision.delta.waste || 0;
      totalStressDelta += decision.delta.stress || 0;
      totalProteinDelta += decision.delta.protein || 0;
    });
    
    // Analiz metni oluştur
    let analysisText = `<p><strong>${totalDecisions} karar</strong> verdin. `;
    
    // Genel durum değerlendirmesi
    const isBalanced = atp >= 40 && atp <= 80 && waste <= 50 && stress <= 50;
    const isAtpGood = atp >= 60;
    const isWasteLow = waste <= 40;
    const isStressLow = stress <= 40;
    
    if (isBalanced) {
      analysisText += `Kararların dengeli görünüyor. `;
    } else if (atp < 40) {
      analysisText += `ATP seviyesi düşük, enerji üretimine dikkat et. `;
    } else if (waste > 60) {
      analysisText += `Atık seviyesi yüksek, temizlik önemli. `;
    } else if (stress > 60) {
      analysisText += `Stres seviyesi yüksek, sistemleri yavaşlatmayı düşün. `;
    }
    
    // Delta analizi
    if (totalAtpDelta > 0) {
      analysisText += `Toplamda <strong>+${totalAtpDelta} ATP</strong> kazandın. `;
    } else if (totalAtpDelta < 0) {
      analysisText += `Toplamda <strong>${totalAtpDelta} ATP</strong> harcadın. `;
    }
    
    if (totalWasteDelta > 0) {
      analysisText += `Atık <strong>+${totalWasteDelta}</strong> arttı. `;
    } else if (totalWasteDelta < 0) {
      analysisText += `Atık <strong>${totalWasteDelta}</strong> azaldı. `;
    }
    
    // Son durum
    analysisText += `Şu anki durumun: ATP ${atp}, Atık ${waste}, Stres ${stress}, Protein ${protein}. `;
    
    // Öneri
    if (!isAtpGood && atp < 50) {
      analysisText += `Oyun sırasında ATP üretimine öncelik ver. `;
    }
    if (!isWasteLow && waste > 50) {
      analysisText += `Atık temizliğini unutma. `;
    }
    if (!isStressLow && stress > 50) {
      analysisText += `Stres yönetimi önemli. `;
    }
    
    analysisText += `Organeller arası dengeyi korumaya çalış!</p>`;
    
    analysisEl.innerHTML = analysisText;
  }
  
  /**
   * Karar listesini render et
   */
  renderDecisionsList() {
    const decisionsListEl = document.getElementById('summary-decisions-list');
    if (!decisionsListEl) return;
    
    // Listeyi temizle
    decisionsListEl.innerHTML = '';
    
    if (this.decisionsMade.length === 0) {
      decisionsListEl.innerHTML = '<p class="summary-empty">Henüz karar verilmedi.</p>';
      return;
    }
    
    // Her kararı göster
    this.decisionsMade.forEach((decision, index) => {
      const decisionItem = document.createElement('div');
      decisionItem.className = 'summary-decision-item';
      
      // Delta değerlerini formatla
      const deltaText = [];
      if (decision.delta.atp !== 0) {
        deltaText.push(`ATP ${decision.delta.atp > 0 ? '+' : ''}${decision.delta.atp}`);
      }
      if (decision.delta.waste !== 0) {
        deltaText.push(`Atık ${decision.delta.waste > 0 ? '+' : ''}${decision.delta.waste}`);
      }
      if (decision.delta.stress !== 0) {
        deltaText.push(`Stres ${decision.delta.stress > 0 ? '+' : ''}${decision.delta.stress}`);
      }
      if (decision.delta.protein !== 0) {
        deltaText.push(`Protein ${decision.delta.protein > 0 ? '+' : ''}${decision.delta.protein}`);
      }
      
      decisionItem.innerHTML = `
        <div class="decision-item-header">
          <span class="decision-number">${index + 1}</span>
          <div class="decision-title-group">
            <h4 class="decision-title">${decision.stepTitle}</h4>
            <p class="decision-question">${decision.stepText}</p>
          </div>
        </div>
        <div class="decision-item-choice">
          <strong>Seçimin:</strong> ${decision.optionLabel}
        </div>
        <div class="decision-item-feedback">
          ${decision.optionFeedback}
        </div>
        ${deltaText.length > 0 ? `<div class="decision-item-delta">Etkiler: ${deltaText.join(', ')}</div>` : ''}
      `;
      
      decisionsListEl.appendChild(decisionItem);
    });
  }
  
  /**
   * Özet ekranındaki progress bar'ı güncelle
   */
  updateSummaryProgress(type, value) {
    const barEl = document.getElementById(`summary-${type}-bar`);
    if (barEl) {
      barEl.style.width = `${Math.max(0, Math.min(100, value))}%`;
    }
  }
  
  /**
   * Organel aktivite animasyonu göster
   */
  animateOrganelleActivity(organelleId) {
    console.log(`Organel aktivite animasyonu: ${organelleId}`);
    
    // Önce tüm highlight'ları kaldır
    this.removeAllHighlights();
    
    // Organel config'ini bul
    const config = this.organelleConfig.find(c => c.id === organelleId);
    if (!config) {
      console.warn(`Organel config bulunamadı: ${organelleId}`);
      return;
    }
    
    const count = config.count || 1;
    console.log(`Organel sayısı: ${count}`);
    
    // Tüm organel kopyalarını bul ve animasyon ekle
    const organelleElements = [];
    
    // İlk organel (index 0)
    const firstEl = document.getElementById(`story-organelle-${organelleId}`);
    if (firstEl) {
      console.log(`İlk organel bulundu: story-organelle-${organelleId}`);
      organelleElements.push(firstEl);
    } else {
      console.warn(`İlk organel bulunamadı: story-organelle-${organelleId}`);
    }
    
    // Diğer kopyalar (index 1, 2, 3, ...)
    for (let i = 1; i < count; i++) {
      const el = document.getElementById(`story-organelle-${organelleId}-${i}`);
      if (el) {
        console.log(`Organel kopyası bulundu: story-organelle-${organelleId}-${i}`);
        organelleElements.push(el);
      } else {
        console.warn(`Organel kopyası bulunamadı: story-organelle-${organelleId}-${i}`);
      }
    }
    
    // Eğer ID ile bulunamazsa, data-organelle-id attribute'u ile dene
    if (organelleElements.length === 0) {
      console.log('ID ile bulunamadı, data-organelle-id ile deneniyor...');
      const allOrganelles = document.querySelectorAll('#story-cell-scene .organelle-item');
      allOrganelles.forEach(el => {
        const dataId = el.getAttribute('data-organelle-id');
        if (dataId === organelleId || dataId?.startsWith(organelleId)) {
          console.log(`Data attribute ile bulundu: ${dataId}`);
          organelleElements.push(el);
        }
      });
    }
    
    console.log(`Toplam ${organelleElements.length} organel elementi bulundu`);
    
    // Her organel elementine aktivite animasyonu ekle
    organelleElements.forEach((el, index) => {
      console.log(`Animasyon ekleniyor: ${index + 1}/${organelleElements.length}`);
      
      // Önce diğer animasyon class'larını kaldır (çakışmayı önle)
      el.classList.remove('normal', 'damaged', 'speaking');
      
      // Kısa bir gecikme ile active class'ı ekle (DOM güncellemesi için)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add('active');
          console.log(`Active class eklendi, element:`, el);
          console.log(`Element computed styles:`, window.getComputedStyle(el).animation);
          
          // 2 saniye sonra animasyonu kaldır
          setTimeout(() => {
            el.classList.remove('active');
            // Normal/damaged class'ları geri ekle
            const health = el.getAttribute('data-health');
            if (health && parseFloat(health) < 40) {
              el.classList.add('damaged');
            } else {
              el.classList.add('normal');
            }
            console.log(`Animasyon kaldırıldı: ${index + 1}`);
          }, 2000);
        });
      });
    });
    
    if (organelleElements.length === 0) {
      console.error(`Hiç organel elementi bulunamadı: ${organelleId}`);
    }
  }
  
  /**
   * Karar sonrası sesli dönüt
   */
  speakDecisionFeedback(option, updates) {
    if (!this.speechSynthesis) return;
    
    // Önce mevcut sesi durdur
    this.stopSpeaking();
    
    // Sadece feedback metnini al (delta değerlerini söyleme)
    const feedbackText = option.feedback || '';
    
    // Kısa bir gecikme ile sesli okuma başlat
    setTimeout(() => {
      this.speakText(feedbackText);
    }, 300);
  }
  
  /**
   * Decision sonucunu göster
   */
  showDecisionResult(step, option, updates = null) {
    const storyCard = document.getElementById('story-card');
    if (!storyCard) return;
    
    // Feedback container
    let feedbackContainer = storyCard.querySelector('.story-feedback');
    if (!feedbackContainer) {
      feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'story-feedback';
      const optionsContainer = storyCard.querySelector('.story-options');
      if (optionsContainer && optionsContainer.parentNode) {
        optionsContainer.parentNode.insertBefore(feedbackContainer, optionsContainer.nextSibling);
      }
    }
    
    feedbackContainer.classList.remove('hidden');
    
    // Feedback metni
    let feedbackText = feedbackContainer.querySelector('.story-feedback-text');
    if (!feedbackText) {
      feedbackText = document.createElement('div');
      feedbackText.className = 'story-feedback-text';
      feedbackContainer.appendChild(feedbackText);
    }
    feedbackText.textContent = option.feedback;
    
    // After text (varsa)
    if (step.afterText) {
      let afterTextEl = feedbackContainer.querySelector('.story-after-text');
      if (!afterTextEl) {
        afterTextEl = document.createElement('div');
        afterTextEl.className = 'story-after-text';
        feedbackContainer.appendChild(afterTextEl);
      }
      afterTextEl.textContent = step.afterText;
    }
    
    // Delta değerleri göster
    if (updates && option.delta) {
      let deltaContainer = feedbackContainer.querySelector('.story-delta');
      if (!deltaContainer) {
        deltaContainer = document.createElement('div');
        deltaContainer.className = 'story-delta';
        feedbackContainer.appendChild(deltaContainer);
      }
      
      deltaContainer.innerHTML = this.renderDeltaValues(option.delta);
    }
  }
  
  /**
   * Delta değerlerini render et
   */
  renderDeltaValues(delta) {
    const icons = {
      atp: '⚡',
      waste: '🗑️',
      stress: '⚠️',
      protein: '🧬'
    };
    
    const labels = {
      atp: 'ATP',
      waste: 'Atık',
      stress: 'Stres',
      protein: 'Protein'
    };
    
    let html = '<div class="delta-values">';
    
    Object.keys(delta).forEach(key => {
      if (delta[key] !== 0) {
        const value = delta[key];
        const sign = value > 0 ? '+' : '';
        const className = value > 0 ? 'delta-positive' : 'delta-negative';
        html += `
          <div class="delta-item ${className}">
            <span class="delta-icon">${icons[key] || ''}</span>
            <span class="delta-label">${labels[key] || key}:</span>
            <span class="delta-value">${sign}${value}</span>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }
  
  /**
   * Decision UI'ı gizle
   */
  hideDecisionUI() {
    const optionsContainer = document.querySelector('.story-options');
    if (optionsContainer) {
      optionsContainer.classList.add('hidden');
    }
    this.hideDecisionResult();
  }
  
  /**
   * Decision sonucunu gizle
   */
  hideDecisionResult() {
    const feedbackContainer = document.querySelector('.story-feedback');
    if (feedbackContainer) {
      feedbackContainer.classList.add('hidden');
    }
  }
  
  /**
   * Organel konuşma balonunu göster
   */
  showOrganelleSpeechBubble(step) {
    if (!this.speechBubble || !step.focusOrg) {
      console.warn('Konuşma balonu gösterilemedi:', { speechBubble: !!this.speechBubble, focusOrg: step.focusOrg });
      return;
    }
    
    // Organel elementini bul (gerçek pozisyon için)
    // Önce ana ID'yi dene
    let organelleEl = document.getElementById(`story-organelle-${step.focusOrg}`);
    
    // Eğer bulunamazsa, tüm organel elementlerini kontrol et
    if (!organelleEl) {
      const allOrganelles = document.querySelectorAll('#story-cell-scene .organelle-item');
      allOrganelles.forEach(el => {
        const dataId = el.getAttribute('data-organelle-id');
        if (dataId === step.focusOrg) {
          organelleEl = el;
        }
      });
    }
    
    let anchorRect;
    
    if (organelleEl) {
      // Gerçek organel pozisyonunu kullan
      const rect = organelleEl.getBoundingClientRect();
      anchorRect = {
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
      console.log(`Organel bulundu: ${step.focusOrg}`, anchorRect);
    } else {
      // Fallback: pozisyon haritasından
      const pos = this.organellePositions[step.focusOrg];
      if (!pos) {
        console.warn(`Organel pozisyonu bulunamadı: ${step.focusOrg}`);
        // Tüm organel elementlerini listele (debug için)
        const allOrganelles = document.querySelectorAll('#story-cell-scene .organelle-item');
        console.log('Mevcut organel elementleri:', Array.from(allOrganelles).map(el => ({
          id: el.id,
          dataId: el.getAttribute('data-organelle-id')
        })));
        return;
      }
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      anchorRect = {
        left: (pos.x / 100) * viewportWidth,
        top: (pos.y / 100) * viewportHeight,
        width: 0,
        height: 0
      };
      console.log(`Organel pozisyonu (fallback): ${step.focusOrg}`, anchorRect);
    }
    
    // Konuşma metni (step.text kullanılır)
    if (this.speechBubble && this.speechBubble.show) {
      this.speechBubble.show(step.text, anchorRect);
    } else {
      console.error('Speech bubble show metodu bulunamadı');
    }
  }
  
  /**
   * Organel ışıldama efekti ekle
   */
  highlightOrganelle(organelleId) {
    // Önce tüm highlight'ları kaldır
    this.removeAllHighlights();
    
    // Ribosome için tüm kopyaları highlight et
    if (organelleId === 'ribosome') {
      // İlk ribosome (index 0)
      const firstRibo = document.getElementById('story-organelle-ribosome');
      if (firstRibo) {
        firstRibo.classList.add('speaking');
      }
      // Diğer ribosome kopyaları (index 1, 2, 3)
      for (let i = 1; i < 4; i++) {
        const riboEl = document.getElementById(`story-organelle-ribosome-${i}`);
        if (riboEl) {
          riboEl.classList.add('speaking');
        }
      }
    } else {
      // Diğer organeller için tek element
      const organelleEl = document.getElementById(`story-organelle-${organelleId}`);
      if (organelleEl) {
        organelleEl.classList.add('speaking');
      }
    }
  }
  
  /**
   * Tüm organel highlight'larını kaldır
   */
  removeAllHighlights() {
    const allOrganelles = document.querySelectorAll('#story-cell-scene .organelle-item');
    allOrganelles.forEach(el => {
      el.classList.remove('speaking');
    });
  }
  
  /**
   * Ekranı göster
   */
  show() {
    // Event listener'ları temizle ve tekrar kur
    this.cleanupEventListeners();
    this.setupEventListeners();
    
    // Hücre sahnesini kur
    this.setupCellScene();
    
    // Progress barları güncelle
    this.updateProgressBars();
    
    this.currentStepIndex = 0;
    this.selectedOption = null;
    
    // Önce ekranı göster
    this.ui.showScreen('story');
    
    // Kısa bir gecikme ile render et (ekran hazır olsun, seslendirme çalışsın)
    setTimeout(() => {
      this.render();
    }, 200);
  }
  
  /**
   * Ekranı gizle
   */
  hide() {
    // Sesli okumayı durdur
    this.stopSpeaking();
    
    this.cleanupEventListeners();
    // Konuşma balonunu gizle
    if (this.speechBubble) {
      this.speechBubble.hide();
    }
  }
}

export default StoryScreen;

