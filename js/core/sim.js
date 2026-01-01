/**
 * Simülasyon mantığı - Tüm formüller ve hesaplamalar burada
 */

class SimulationEngine {
  constructor(config, content) {
    this.config = config;
    this.content = content;
    this.lastEventTime = 0;
    this.nextEventTime = 0;
  }
  
  /**
   * Bir tick'i işle (her 500ms'de bir çağrılır)
   */
  processTick(state, deltaTime) {
    if (!state.isRunning || state.isPaused) {
      return state;
    }
    
    // Zaman ölçeğini uygula
    const scaledDelta = deltaTime * state.timeScale;
    
    // Cooldown'ları güncelle
    const actionCooldowns = { ...state.actionCooldowns };
    Object.keys(actionCooldowns).forEach(action => {
      if (actionCooldowns[action] > 0) {
        actionCooldowns[action] = Math.max(0, actionCooldowns[action] - scaledDelta);
      }
    });
    
    // Elapsed time güncelle (milisaniye cinsinden)
    const elapsedTime = (state.elapsedTime || 0) + scaledDelta;
    
    // ATP üretimi hesapla
    const atpProduction = this.calculateATPProduction(state);
    
    // ATP tüketimi hesapla
    const atpConsumption = this.calculateATPConsumption(state);
    
    // Net ATP değişimi
    let atpChange = atpProduction - atpConsumption;
    
    // Olay etkilerini uygula
    const eventEffects = this.applyEventEffects(state, atpChange);
    atpChange = eventEffects.atpChange;
    
    // ATP güncelle (0-100 arası)
    let newATP = Math.max(0, Math.min(100, state.atp + atpChange * (scaledDelta / 1000)));
    
    // Atık üretimi ve temizliği
    const wasteChange = this.calculateWasteChange(state, scaledDelta);
    let newWaste = Math.max(0, Math.min(100, state.waste + wasteChange));
    
    // Stres değişimi
    const stressChange = this.calculateStressChange(state, newATP, newWaste, scaledDelta);
    let newStress = Math.max(0, Math.min(100, state.stress + stressChange));
    
    // Protein üretimi
    const proteinChange = this.calculateProteinChange(state, newATP, scaledDelta);
    let newProtein = Math.max(0, Math.min(100, state.protein + proteinChange));
    
    // Organel bozulması
    const organelles = this.updateOrganelleHealth(state, newATP, newStress, newWaste, scaledDelta);
    
    // Kritik durum kontrolleri
    const criticalEffects = this.checkCriticalConditions(newATP, newWaste, newStress, organelles);
    
    // Yeni state oluştur
    const newState = {
      ...state,
      atp: newATP,
      waste: newWaste,
      stress: newStress,
      protein: newProtein,
      organelles: organelles,
      actionCooldowns: actionCooldowns,
      elapsedTime: elapsedTime,
      eventEffects: eventEffects.effects
    };
    
    // Kritik etkileri uygula
    if (criticalEffects.organelleDamage) {
      Object.keys(criticalEffects.organelleDamage).forEach(organelle => {
        newState.organelles[organelle] = Math.max(0, 
          newState.organelles[organelle] - criticalEffects.organelleDamage[organelle]
        );
      });
    }
    
    return newState;
  }
  
  /**
   * ATP üretimi hesapla
   */
  calculateATPProduction(state) {
    const mitoHealth = state.organelles.mitochondria / 100;
    const baseProduction = this.config.rates.atpBaseProduction;
    
    // Oksijen katsayısı (basit simülasyon - normalde 1.0)
    const oxygenCoefficient = 1.0;
    
    // Olay etkileri
    const eventMultiplier = state.eventEffects.atpProductionMultiplier || 1.0;
    
    // ATP kritikse üretim yavaşlar
    const criticalPenalty = state.atp < this.config.thresholds.atpCritical ? 0.5 : 1.0;
    
    return baseProduction * mitoHealth * oxygenCoefficient * eventMultiplier * criticalPenalty;
  }
  
  /**
   * ATP tüketimi hesapla
   */
  calculateATPConsumption(state) {
    const baseConsumption = this.config.rates.atpConsumptionBase;
    
    // Protein üretimi maliyeti
    const proteinCost = state.protein < 50 ? 0.3 : 0.1; // Düşük protein = daha fazla maliyet
    
    // Temizlik maliyeti (atık yüksekse daha fazla)
    const cleaningCost = state.waste > 50 ? 0.4 : 0.2;
    
    // Stres maliyeti
    const stressCost = state.stress * 0.01;
    
    // Olay etkileri
    const eventMultiplier = state.eventEffects.atpConsumptionMultiplier || 1.0;
    
    return (baseConsumption + proteinCost + cleaningCost + stressCost) * eventMultiplier;
  }
  
  /**
   * Atık değişimi hesapla
   */
  calculateWasteChange(state, deltaTime) {
    // Besin alımından atık (sürekli küçük miktar)
    const nutrientWaste = 0.1;
    
    // Protein üretiminden atık
    const proteinWaste = state.protein < 50 ? 0.2 : 0.1;
    
    // Lizozom temizliği
    const lysosomeHealth = state.organelles.lysosome / 100;
    const cleaningRate = this.config.rates.wasteCleaningBase * lysosomeHealth;
    
    // Olay etkileri
    const eventCleaningBoost = state.eventEffects.wasteCleaningBoost || 1.0;
    const eventWasteIncrease = state.eventEffects.wasteIncrease || 0;
    
    const totalCleaning = cleaningRate * eventCleaningBoost * (deltaTime / 1000);
    const totalProduction = (nutrientWaste + proteinWaste + eventWasteIncrease) * (deltaTime / 1000);
    
    return totalProduction - totalCleaning;
  }
  
  /**
   * Stres değişimi hesapla
   */
  calculateStressChange(state, newATP, newWaste, deltaTime) {
    let stressChange = 0;
    
    // Atık eşiği aşımı
    if (newWaste > this.config.thresholds.wasteDanger) {
      stressChange += (newWaste - this.config.thresholds.wasteDanger) * 0.05;
    }
    
    // ATP düşüklüğü
    if (newATP < this.config.thresholds.atpCritical) {
      stressChange += (this.config.thresholds.atpCritical - newATP) * 0.1;
    }
    
    // Organel hasarı
    Object.values(state.organelles).forEach(health => {
      if (health < 50) {
        stressChange += (50 - health) * 0.02;
      }
    });
    
    // Baz stres artışı (normal metabolik stres)
    stressChange += this.config.rates.stressIncreaseBase;
    
    // Olay etkileri
    stressChange += (state.eventEffects.stressIncrease || 0);
    stressChange -= (state.eventEffects.stressReduction || 0);
    
    return stressChange * (deltaTime / 1000);
  }
  
  /**
   * Protein değişimi hesapla
   */
  calculateProteinChange(state, newATP, deltaTime) {
    // ATP yoksa protein üretilemez
    if (newATP < 5) {
      return -0.1 * (deltaTime / 1000); // Küçük kayıp
    }
    
    const ribosomeHealth = state.organelles.ribosome / 100;
    const baseProduction = this.config.rates.proteinProductionBase;
    
    // Olay etkileri
    const eventBoost = state.eventEffects.proteinProductionBoost || 1.0;
    const eventMultiplier = state.eventEffects.proteinProductionMultiplier || 1.0;
    
    // ATP kritikse üretim yavaşlar
    const atpPenalty = newATP < this.config.thresholds.atpCritical ? 0.5 : 1.0;
    
    const production = baseProduction * ribosomeHealth * eventBoost * eventMultiplier * atpPenalty;
    
    return production * (deltaTime / 1000);
  }
  
  /**
   * Organel sağlığını güncelle
   */
  updateOrganelleHealth(state, atp, stress, waste, deltaTime) {
    const organelles = { ...state.organelles };
    const decayRate = this.config.rates.organelleDecayBase;
    
    // Stres ve atık organelleri bozar
    const stressDamage = stress * 0.0005;
    const wasteDamage = waste > 50 ? (waste - 50) * 0.0003 : 0;
    const atpDamage = atp < 10 ? (10 - atp) * 0.001 : 0;
    
    Object.keys(organelles).forEach(key => {
      // Olay koruması varsa hasar almasın
      if (state.eventEffects.organelleProtection) {
        const protection = state.eventEffects.organelleProtection;
        if (protection[key] === true || protection.all === true) {
          return; // Bu organel korumalı
        }
      }
      
      // Olay hasarı varsa uygula
      if (state.eventEffects.organelleDamage) {
        const damage = state.eventEffects.organelleDamage;
        if (damage[key] !== undefined) {
          organelles[key] = Math.max(0, organelles[key] - damage[key]);
        } else if (damage.all !== undefined) {
          organelles[key] = Math.max(0, organelles[key] - damage.all);
        }
      }
      
      // Normal bozulma
      const totalDecay = (decayRate + stressDamage + wasteDamage + atpDamage) * (deltaTime / 1000);
      organelles[key] = Math.max(0, Math.min(100, organelles[key] - totalDecay));
    });
    
    return organelles;
  }
  
  /**
   * Kritik durumları kontrol et
   */
  checkCriticalConditions(atp, waste, stress, organelles) {
    const effects = {
      organelleDamage: {}
    };
    
    // Stres kritikse rastgele organel hasar alır
    if (stress > this.config.thresholds.stressCritical) {
      const organelleKeys = Object.keys(organelles);
      const randomOrganelle = organelleKeys[Math.floor(Math.random() * organelleKeys.length)];
      effects.organelleDamage[randomOrganelle] = (stress - this.config.thresholds.stressCritical) * 0.1;
    }
    
    return effects;
  }
  
  /**
   * Olay etkilerini uygula
   */
  applyEventEffects(state, atpChange) {
    const effects = { ...state.eventEffects };
    let newAtpChange = atpChange;
    
    // Süreli etkileri kontrol et
    if (effects.duration && effects.startTime) {
      const elapsed = Date.now() - effects.startTime;
      if (elapsed > effects.duration) {
        // Süre doldu, etkileri temizle
        return {
          atpChange: atpChange,
          effects: {}
        };
      }
    }
    
    // ATP kazançları/zararları
    if (effects.atpGain) {
      newAtpChange += effects.atpGain * 0.1; // Yavaşça uygula
    }
    if (effects.atpCost) {
      newAtpChange -= effects.atpCost * 0.1;
    }
    
    return {
      atpChange: newAtpChange,
      effects: effects
    };
  }
  
  /**
   * Yeni olay kartı oluştur
   */
  generateEvent() {
    const events = this.content.events;
    if (events.length === 0) return null;
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    return {
      ...randomEvent,
      timestamp: Date.now()
    };
  }
  
  /**
   * Olay zamanlamasını kontrol et
   */
  shouldTriggerEvent(state) {
    const now = Date.now();
    
    // Zaten aktif olay varsa yeni olay üretme
    if (state.activeEvent) {
      return false;
    }
    
    // İlk olay için zaman belirle
    if (this.nextEventTime === 0) {
      const minInterval = this.config.events.minInterval;
      const maxInterval = this.config.events.maxInterval;
      this.nextEventTime = now + minInterval + Math.random() * (maxInterval - minInterval);
      return false;
    }
    
    // Zaman geldi mi?
    if (now >= this.nextEventTime) {
      // Sonraki olay zamanını belirle
      const minInterval = this.config.events.minInterval;
      const maxInterval = this.config.events.maxInterval;
      this.nextEventTime = now + minInterval + Math.random() * (maxInterval - minInterval);
      return true;
    }
    
    return false;
  }
  
  /**
   * Olay seçeneğini işle
   */
  processEventChoice(event, optionIndex) {
    const option = event.options[optionIndex];
    if (!option) return null;
    
    const effects = { ...option.effects };
    
    // Süreli etkiler için başlangıç zamanı ekle
    if (effects.duration) {
      effects.startTime = Date.now();
    }
    
    return effects;
  }
  
  /**
   * Oyun bitiş koşullarını kontrol et
   */
  checkGameOver(state) {
    const reasons = [];
    
    // ATP tükendi
    if (state.atp <= 0) {
      reasons.push('ATP tükendi - Hücre enerjisiz kaldı');
    }
    
    // Tüm organeller öldü
    const allDead = Object.values(state.organelles).every(health => health <= 0);
    if (allDead) {
      reasons.push('Tüm organeller hasar gördü - Hücre yaşamını sürdüremedi');
    }
    
    // Stres maksimum
    if (state.stress >= 100) {
      reasons.push('Stres kritik seviyeye ulaştı - Hücre çöktü');
    }
    
    // Çekirdek öldü
    if (state.organelles.nucleus <= 0) {
      reasons.push('Çekirdek hasar gördü - Hücre kontrolünü kaybetti');
    }
    
    return reasons.length > 0 ? reasons : null;
  }
}

export default SimulationEngine;

