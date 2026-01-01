/**
 * Rozetler Ekranı
 */

class BadgesScreen {
  constructor(stateManager, storageManager, uiManager, content) {
    this.state = stateManager;
    this.storage = storageManager;
    this.ui = uiManager;
    this.content = content;
    this.init();
  }
  
  init() {
    this.setupEventListeners();
  }
  
  /**
   * Event listener'ları kur
   */
  setupEventListeners() {
    // Menüye dön butonu
    const backButton = document.getElementById('btn-badges-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.state.update({ currentScreen: 'home' });
      });
    }
  }
  
  /**
   * Rozetleri göster
   */
  renderBadges() {
    const badgesContainer = document.getElementById('badges-grid');
    if (!badgesContainer) return;
    
    const state = this.state.get();
    const earnedBadges = state.badges || [];
    
    badgesContainer.innerHTML = '';
    
    this.content.badges.forEach(badge => {
      const isEarned = earnedBadges.includes(badge.id);
      
      const badgeEl = document.createElement('div');
      badgeEl.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;
      badgeEl.setAttribute('role', 'article');
      badgeEl.setAttribute('aria-label', isEarned ? `Kazanılan rozet: ${badge.name}` : `Kilitli rozet: ${badge.name}`);
      
      badgeEl.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-description">${badge.description}</div>
        ${!isEarned ? '<div class="badge-lock">🔒</div>' : ''}
      `;
      
      badgesContainer.appendChild(badgeEl);
    });
  }
  
  /**
   * Ekranı göster
   */
  show() {
    this.renderBadges();
    this.ui.showScreen('badges');
  }
}

export default BadgesScreen;

