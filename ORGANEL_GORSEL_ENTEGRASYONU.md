# Organel Görsel Entegrasyonu - Yapılan Değişiklikler

## Özet
Mevcut canvas tabanlı hücre çizimi, DOM tabanlı görsel sistem ile değiştirildi. Organeller artık PNG görselleri ile gösteriliyor ve health durumlarına göre otomatik olarak normal/damaged görselleri arasında geçiş yapıyor.

## Güncellenen Dosyalar

### 1. `index.html`
**Değişiklik:** Canvas elementi yerine DOM tabanlı cell-scene container eklendi.

**Eklenen:**
- `#cell-scene` div container
- `#cell-background` img elementi (cell_membrane.png için)

**Kaldırılan:**
- `#cell-canvas` canvas elementi

### 2. `css/style.css`
**Eklenen Stiller:**
- `.cell-scene` - Ana hücre sahnesi container
- `.cell-background` - Arka plan görseli
- `.cell-scene.stress-high` - Stres > 70 olduğunda desaturate/blur efekti
- `.organelle-item` - Organel container (absolute position)
- `.organelle-item:hover` - Hover efekti (scale + glow)
- `.organelle-item.selected` - Seçili organel efekti
- `.organelle-image` - Organel görseli
- `.organelle-item.normal` - Normal durum animasyonu (bob)
- `.organelle-item.damaged` - Hasar durumu animasyonu (wobble)
- `.organelle-health-bar` - Mini health bar container
- `.organelle-health-fill` - Health bar fill (low/medium/high renkleri)

**Animasyonlar:**
- `@keyframes organelleBob` - Yavaş yukarı-aşağı hareket
- `@keyframes organelleWobble` - Hasar durumunda titreme

### 3. `js/modules/screen_sim.js`
**Büyük Değişiklikler:**

**Kaldırılan Fonksiyonlar:**
- `setupCanvas()` - Canvas hazırlama
- `drawCell(ctx)` - Canvas çizimi
- `drawOrganelle(ctx, x, y, radius, color, health, icon)` - Canvas organel çizimi
- `setupOrganelleHotspots()` - Canvas tabanlı tıklama algılama

**Eklenen Fonksiyonlar:**
- `setupOrganelleConfig()` - Organel konfigürasyon objesi oluşturma
- `setupCellScene()` - Hücre sahnesini kurma
- `renderOrganelles()` - Organelleri DOM'a render etme
- `updateOrganelleVisual(organelleId, state)` - Health'e göre görsel güncelleme
- `setupOrganelleClickHandlers()` - Organel tıklama/k lavye event'leri
- `selectOrganelle(organelleId)` - Organel seçme ve bilgi gösterme

**Güncellenen Fonksiyonlar:**
- `init()` - Canvas yerine organel config ve scene setup
- `startCanvasAnimation()` - Canvas çizimi yerine organel görsel güncelleme
- `show()` - Organelleri render etme eklendi

**Organel Config Yapısı:**
```javascript
{
  id: 'nucleus',
  normalSrc: 'resimler/nucleus_normal.png',
  damagedSrc: 'resimler/nucleus_damaged.png',
  initialPos: { x: 50, y: 50 }, // Yüzde
  size: { width: 'clamp(...)', height: 'clamp(...)' },
  stateKey: 'nucleus' // State'teki key (null ise organelleHealth kullanılır)
}
```

### 4. `js/core/state.js`
**Eklenen:**
- `organelleHealth` map'i - ER, vacuole, centrosome için health değerleri
- `startGame()` fonksiyonunda `organelleHealth` başlatma

### 5. `assets/data/content.json`
**Eklenen Organel Açıklamaları:**
- `er` - Endoplazmik Retikulum
- `vacuole` - Koful
- `centrosome` - Sentrozom

## Görsel Dosya Yapısı

Görseller şu klasörde olmalı:
```
cell-day/
└── resimler/
    ├── cell_membrane.png (arka plan)
    ├── nucleus_normal.png
    ├── nucleus_damaged.png
    ├── mitochondria_normal.png
    ├── mitochondria_damaged.png
    ├── ribosome_normal.png
    ├── ribosome_damaged.png
    ├── lysosome_normal.png
    ├── lysosome_damaged.png
    ├── golgi_normal.png
    ├── golgi_damaged.png
    ├── er_normal.png
    ├── er_damaged.png
    ├── vacuole_normal.png
    ├── vacuole_damaged.png
    ├── centrosome_normal.png (opsiyonel)
    └── centrosome_damaged.png (opsiyonel)
```

## Özellikler

### 1. Otomatik Görsel Değişimi
- Health < 40: `damaged` görseli gösterilir
- Health >= 40: `normal` görseli gösterilir
- Health değeri state'ten otomatik alınır

### 2. Animasyonlar
- **Normal organeller:** Yavaş "bob" animasyonu (3s döngü)
- **Hasar görmüş organeller:** "wobble" animasyonu (0.5s döngü)
- **Stres yüksek (>70):** Tüm sahneye desaturate + blur efekti

### 3. Interaktivite
- **Hover:** Organel %15 büyür + glow efekti
- **Click:** Organel seçilir, sağ panelde bilgi gösterilir
- **Klavye:** Tab ile organeller arasında gezinme, Enter/Space ile seçme

### 4. Health Bar Overlay
- Her organelin altında mini health bar
- Renk kodlaması:
  - Kırmızı (low): < 40
  - Turuncu (medium): 40-70
  - Yeşil (high): > 70

### 5. Responsive Tasarım
- Organel boyutları `clamp()` ile responsive
- Pozisyonlar yüzde bazlı
- Mobilde de düzgün görünüm

## Kullanım

1. Görselleri `resimler/` klasörüne yerleştirin
2. Oyunu başlatın - organeller otomatik render edilir
3. Organellere tıklayarak seçin ve bilgi görün
4. Health değerleri otomatik olarak görselleri günceller

## Notlar

- Mevcut oyun mekanikleri (ATP/Atık/Stres/Protein) değiştirilmedi
- Canvas tabanlı grafik sistemi korundu (ATP grafiği için)
- State yönetimi aynı kaldı, sadece `organelleHealth` eklendi
- Tüm animasyonlar CSS ile yapılıyor (performans için)

