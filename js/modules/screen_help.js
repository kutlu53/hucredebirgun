/**
 * Yardım Ekranı
 */

class HelpScreen {
  constructor(stateManager, uiManager, content) {
    this.state = stateManager;
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
    const backButton = document.getElementById('btn-help-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.state.update({ currentScreen: 'home' });
      });
    }
  }
  
  /**
   * Yardım içeriğini göster
   */
  renderHelp() {
    const helpContainer = document.getElementById('help-content');
    if (!helpContainer) return;
    
    helpContainer.innerHTML = '';
    
    this.content.help.sections.forEach(section => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'help-section';
      
      sectionEl.innerHTML = `
        <h3>${section.title}</h3>
        <p>${section.content.replace(/\n/g, '<br>')}</p>
      `;
      
      helpContainer.appendChild(sectionEl);
    });
  }
  
  /**
   * Ekranı göster
   */
  show() {
    this.renderHelp();
    this.ui.showScreen('help');
  }
}

export default HelpScreen;

