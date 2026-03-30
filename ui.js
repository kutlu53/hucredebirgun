/**
 * UI güncellemeleri - DOM manipülasyonları
 */

class UIManager {
  constructor() {
    this.elements = {};
    this.toastQueue = [];
    this.isShowingToast = false;
  }
  
  /**
   * DOM elementlerini cache'le
   */
  cacheElements() {
    this.elements = {
      // Ekranlar
      screens: {
        home: document.getElementById('screen-home'),
        story: document.getElementById('screen-story'),
        sim: document.getElementById('screen-sim'),
        badges: document.getElementById('screen-badges'),
        help: document.getElementById('screen-help'),
        summary: document.getElementById('screen-summary')
      },
      
      // Progress barlar
      progressBars: {
        atp: document.getElementById('progress-atp'),
        waste: document.getElementById('progress-waste'),
        stress: document.getElementById('progress-stress'),
        protein: document.getElementById('progress-protein')
      },
      
      // Progress bar değerleri
      progressValues: {
        atp: document.getElementById('value-atp'),
        waste: document.getElementById('value-waste'),
        stress: document.getElementById('value-stress'),
        protein: document.getElementById('value-protein')
      },
      
      // Aksiyon butonları
      actionButtons: {
        takeNutrient: document.getElementById('action-take-nutrient'),
        cleanWaste: document.getElementById('action-clean-waste'),
        produceProtein: document.getElementById('action-produce-protein'),
        repairOrganelle: document.getElementById('action-repair-organelle')
      },
      
      // Zaman kontrolü
      timeScale: document.getElementById('time-scale'),
      timeScaleValue: document.getElementById('time-scale-value'),
      pauseButton: document.getElementById('btn-pause'),
      
      // Canvas
      cellCanvas: document.getElementById('cell-canvas'),
      graphCanvas: document.getElementById('graph-canvas'),
      
      // Olay kartı
      eventCard: document.getElementById('event-card'),
      eventTitle: document.getElementById('event-title'),
      eventDescription: document.getElementById('event-description'),
      eventOptions: document.getElementById('event-options'),
      
      // Organel bilgileri
      organelleInfo: document.getElementById('organelle-info'),
      
      // Toast container
      toastContainer: document.getElementById('toast-container'),
      
      // Debug panel
      debugPanel: document.getElementById('debug-panel'),
      debugContent: document.getElementById('debug-content')
    };
  }
  
  /**
   * Ekranı değiştir
   */
  showScreen(screenName) {
    Object.values(this.elements.screens).forEach(screen => {
      if (screen) screen.classList.add('hidden');
    });
    
    if (this.elements.screens[screenName]) {
      this.elements.screens[screenName].classList.remove('hidden');
    }
  }
  
  /**
   * Progress bar'ı güncelle
   */
  updateProgressBar(type, value) {
    // Elementler cache'lenmemişse yeniden cache'le
    if (!this.elements || !this.elements.progressBars) {
      this.cacheElements();
    }
    
    const bar = this.elements.progressBars[type];
    const valueEl = this.elements.progressValues[type];
    
    if (!bar) {
      // Element bulunamadı, doğrudan DOM'dan almayı dene
      const barId = `progress-${type}`;
      const barEl = document.getElementById(barId);
      if (barEl) {
        this.elements.progressBars[type] = barEl;
        const clampedValue = Math.max(0, Math.min(100, value || 0));
        barEl.style.width = `${clampedValue}%`;
        barEl.setAttribute('aria-valuenow', clampedValue);
        barEl.setAttribute('aria-label', `${type} seviyesi: ${Math.round(clampedValue)}%`);
      } else {
        return; // Element yok, güncelleme yapma
      }
    } else {
      const clampedValue = Math.max(0, Math.min(100, value || 0));
      bar.style.width = `${clampedValue}%`;
      bar.setAttribute('aria-valuenow', clampedValue);
      bar.setAttribute('aria-label', `${type} seviyesi: ${Math.round(clampedValue)}%`);
    }
    
    // Kritik durumlar için renk değiştir
    const barElement = bar || document.getElementById(`progress-${type}`);
    if (barElement) {
      if (type === 'atp' && value < 15) {
        barElement.classList.add('critical');
      } else {
        barElement.classList.remove('critical');
      }
      
      if (type === 'waste' && value > 80) {
        barElement.classList.add('danger');
      } else {
        barElement.classList.remove('danger');
      }
      
      if (type === 'stress' && value > 85) {
        barElement.classList.add('critical');
      } else {
        barElement.classList.remove('critical');
      }
    }
    
    // Value elementini güncelle
    if (!valueEl) {
      const valueId = `value-${type}`;
      const valueElement = document.getElementById(valueId);
      if (valueElement) {
        this.elements.progressValues[type] = valueElement;
        valueElement.textContent = Math.round(Math.max(0, Math.min(100, value || 0)));
      }
    } else {
      valueEl.textContent = Math.round(Math.max(0, Math.min(100, value || 0)));
    }
  }
  
  /**
   * Tüm progress bar'ları güncelle
   */
  updateAllProgressBars(state) {
    this.updateProgressBar('atp', state.atp);
    this.updateProgressBar('waste', state.waste);
    this.updateProgressBar('stress', state.stress);
    this.updateProgressBar('protein', state.protein);
  }
  
  /**
   * Buton cooldown'unu göster
   */
  updateButtonCooldown(action, cooldown, maxCooldown) {
    const button = this.elements.actionButtons[action];
    if (!button) return;
    
    if (cooldown > 0) {
      button.disabled = true;
      const percentage = (cooldown / maxCooldown) * 100;
      button.style.opacity = '0.5';
      button.setAttribute('aria-label', `Bekleme süresi: ${Math.ceil(cooldown / 1000)}s`);
    } else {
      button.disabled = false;
      button.style.opacity = '1';
      button.removeAttribute('aria-label');
    }
  }
  
  /**
   * Zaman ölçeğini güncelle
   */
  updateTimeScale(scale) {
    if (this.elements.timeScale) {
      this.elements.timeScale.value = scale;
    }
    if (this.elements.timeScaleValue) {
      this.elements.timeScaleValue.textContent = `${scale.toFixed(1)}x`;
    }
  }
  
  /**
   * Duraklat butonunu güncelle
   */
  updatePauseButton(isPaused) {
    if (this.elements.pauseButton) {
      this.elements.pauseButton.textContent = isPaused ? '▶ Devam' : '⏸ Duraklat';
      this.elements.pauseButton.setAttribute('aria-label', isPaused ? 'Oyunu devam ettir' : 'Oyunu duraklat');
    }
  }
  
  /**
   * Olay kartını göster
   */
  showEventCard(event) {
    if (!this.elements.eventCard) return;
    
    this.elements.eventCard.classList.remove('hidden');
    this.elements.eventTitle.textContent = event.title;
    this.elements.eventDescription.textContent = event.description;
    
    // Seçenekleri oluştur
    this.elements.eventOptions.innerHTML = '';
    event.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'event-option';
      button.textContent = option.text;
      button.setAttribute('data-option-index', index);
      button.setAttribute('aria-label', `Seçenek ${index + 1}: ${option.text}`);
      this.elements.eventOptions.appendChild(button);
    });
  }
  
  /**
   * Olay kartını gizle
   */
  hideEventCard() {
    if (this.elements.eventCard) {
      this.elements.eventCard.classList.add('hidden');
    }
  }
  
  /**
   * Organel bilgisini göster
   */
  showOrganelleInfo(organelle, content) {
    if (!this.elements.organelleInfo) return;
    
    this.elements.organelleInfo.innerHTML = `
      <h3>${organelle.name} ${organelle.icon}</h3>
      <p>${organelle.description}</p>
      <p class="organelle-health">Sağlık: ${Math.round(organelle.health)}%</p>
    `;
    this.elements.organelleInfo.classList.remove('hidden');
  }
  
  /**
   * Organel bilgisini gizle
   */
  hideOrganelleInfo() {
    if (this.elements.organelleInfo) {
      this.elements.organelleInfo.classList.add('hidden');
    }
  }
  
  /**
   * Toast bildirimi göster
   */
  showToast(message, type = 'info', duration = 3000) {
    this.toastQueue.push({ message, type, duration });
    this.processToastQueue();
  }
  
  /**
   * Toast kuyruğunu işle
   */
  processToastQueue() {
    if (this.isShowingToast || this.toastQueue.length === 0) {
      return;
    }
    
    this.isShowingToast = true;
    const { message, type, duration } = this.toastQueue.shift();
    
    if (!this.elements.toastContainer) {
      this.isShowingToast = false;
      return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    
    this.elements.toastContainer.appendChild(toast);
    
    // Animasyon için
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Kaldır
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.isShowingToast = false;
        this.processToastQueue();
      }, 300);
    }, duration);
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
   * Debug paneli göster/gizle
   */
  toggleDebugPanel(state) {
    if (!this.elements.debugPanel) return;
    
    if (this.elements.debugPanel.classList.contains('hidden')) {
      this.elements.debugPanel.classList.remove('hidden');
      this.updateDebugContent(state);
    } else {
      this.elements.debugPanel.classList.add('hidden');
    }
  }
  
  /**
   * Debug içeriğini güncelle
   */
  updateDebugContent(state) {
    if (!this.elements.debugContent) return;
    
    this.elements.debugContent.textContent = JSON.stringify(state, null, 2);
  }
  
  /**
   * Konuşma balonu oluştur
   */
  createSpeechBubble() {
    // Eğer zaten varsa, yeniden oluşturma
    let bubble = document.getElementById('speech-bubble');
    if (bubble) {
      return {
        show: (text, anchorRect) => this.showSpeechBubble(bubble, text, anchorRect),
        hide: () => this.hideSpeechBubble(bubble)
      };
    }
    
    // Yeni balon oluştur
    bubble = document.createElement('div');
    bubble.id = 'speech-bubble';
    bubble.className = 'speech-bubble hidden';
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-live', 'polite');
    
    const bubbleText = document.createElement('div');
    bubbleText.className = 'speech-bubble-text';
    bubble.appendChild(bubbleText);
    
    const bubbleTail = document.createElement('div');
    bubbleTail.className = 'speech-bubble-tail';
    bubble.appendChild(bubbleTail);
    
    document.body.appendChild(bubble);
    
    return {
      show: (text, anchorRect) => this.showSpeechBubble(bubble, text, anchorRect),
      hide: () => this.hideSpeechBubble(bubble)
    };
  }
  
  /**
   * Konuşma balonunu göster
   */
  showSpeechBubble(bubble, text, anchorRect) {
    if (!bubble) return;
    
    const bubbleText = bubble.querySelector('.speech-bubble-text');
    if (bubbleText) {
      bubbleText.textContent = text;
    }
    
    // Pozisyon hesapla
    if (anchorRect) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Balonun organelin tam üst orta kısmında olması
      // Organelin merkez noktası
      const centerX = anchorRect.left + (anchorRect.width / 2);
      const centerY = anchorRect.top + (anchorRect.height / 2);
      
      // Organelin üst kenarı
      const topEdge = anchorRect.top;
      
      // Balonun pozisyonu: organelin tam üst orta kısmında
      let left = centerX; // Yatayda tam ortada
      let top = topEdge - 15; // Organelin üst kenarından 15px yukarıda
      
      // Ekran sınırlarını kontrol et
      const bubbleWidth = 300; // Tahmini genişlik
      const bubbleHeight = 120; // Tahmini yükseklik
      
      // Yatay sınır kontrolü
      if (left + bubbleWidth / 2 > viewportWidth) {
        left = viewportWidth - bubbleWidth / 2 - 10;
      }
      if (left - bubbleWidth / 2 < 10) {
        left = bubbleWidth / 2 + 10;
      }
      
      // Dikey sınır kontrolü - eğer üstte yer yoksa altta göster
      if (top - bubbleHeight < 10) {
        top = anchorRect.bottom + 20;
        bubble.classList.add('speech-bubble-bottom');
      } else {
        bubble.classList.remove('speech-bubble-bottom');
      }
      
      bubble.style.left = `${left}px`;
      bubble.style.top = `${top}px`;
      // Organelin tam üst orta kısmında: yatayda ortalanmış, dikeyde üst kenarın üstünde
      bubble.style.transform = 'translate(-50%, -100%)';
    }
    
    bubble.classList.remove('hidden');
  }
  
  /**
   * Konuşma balonunu gizle
   */
  hideSpeechBubble(bubble) {
    if (bubble) {
      bubble.classList.add('hidden');
    }
  }
}

export default UIManager;

