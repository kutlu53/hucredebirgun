# Hücrede Bir Gün - Canlı Zaman Simülasyonu

Eğitsel bir hücre simülasyonu oyunu. HTML/CSS/Vanilla JavaScript (ES6) ile geliştirilmiştir.

## 🎮 Oyun Hakkında

Bu oyun, öğrencilerin hücre organellerini ve hücresel süreçleri interaktif bir şekilde öğrenmelerini sağlar. Oyuncu, hücreyi hayatta tutmak için ATP, Atık, Stres ve Protein seviyelerini dengede tutmalıdır.

## 🚀 Nasıl Çalıştırılır?

### Yerel Olarak (VS Code Live Server)

1. Projeyi bilgisayarınıza indirin
2. VS Code'da açın
3. Live Server eklentisini yükleyin
4. `index.html` dosyasına sağ tıklayıp "Open with Live Server" seçin

### GitHub Pages ile

1. Bu repository'yi GitHub'a yükleyin
2. Repository Settings > Pages bölümüne gidin
3. Source olarak "main" branch'ini seçin
4. `/cell-day` klasörünü root olarak ayarlayın veya tüm dosyaları root'a taşıyın

**Not:** Eğer dosyalar `/cell-day` klasöründeyse, GitHub Pages ayarlarında "Source" olarak `/cell-day` klasörünü seçmeniz gerekebilir. Alternatif olarak, tüm dosyaları repository root'una taşıyabilirsiniz.

## 📁 Proje Yapısı

```
cell-day/
├── index.html          # Ana HTML dosyası
├── css/
│   └── style.css       # Stil dosyası
├── js/
│   ├── app.js          # Ana uygulama dosyası
│   ├── core/           # Çekirdek modüller
│   │   ├── state.js    # State yönetimi
│   │   ├── sim.js      # Simülasyon motoru
│   │   ├── ui.js       # UI yönetimi
│   │   └── storage.js  # LocalStorage yönetimi
│   └── modules/        # Ekran modülleri
│       ├── screen_home.js
│       ├── screen_story.js
│       ├── screen_sim.js
│       ├── screen_badges.js
│       └── screen_help.js
├── assets/
│   ├── data/           # JSON veri dosyaları
│   │   ├── config.json
│   │   └── content.json
│   └── resimler/       # Organel görselleri
└── README.md
```

## 🎯 Özellikler

- ✅ Tek sayfa uygulama (SPA)
- ✅ Hikaye modu (Story Engine)
- ✅ Karar verme mekanizması
- ✅ Canlı simülasyon
- ✅ Rozet sistemi
- ✅ Sesli okuma desteği
- ✅ Responsive tasarım
- ✅ Erişilebilirlik özellikleri

## 🛠️ Teknolojiler

- HTML5
- CSS3 (Flexbox, Grid, CSS Variables, Animations)
- Vanilla JavaScript (ES6 Modules)
- Web Speech API (Text-to-Speech)
- LocalStorage (İlerleme kaydı)
- Canvas API (Grafik çizimi)

## 📝 Notlar

- Oyun tarayıcıda çalışır, sunucu gerektirmez
- LocalStorage kullanır (tarayıcıda veri saklar)
- Tüm görseller `/resimler` klasöründe olmalıdır
- JSON dosyaları `/assets/data` klasöründe olmalıdır

## 🐛 Sorun Giderme

### Görseller görünmüyor
- `/resimler` klasörünün varlığını kontrol edin
- Görsel dosya isimlerinin doğru olduğundan emin olun

### JSON dosyaları yüklenmiyor
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- Dosya yollarının doğru olduğundan emin olun
- CORS hatası alıyorsanız, bir web sunucusu kullanın (Live Server gibi)

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 👨‍💻 Geliştirici

Front-end mühendisi ve oyun geliştiricisi tarafından geliştirilmiştir.
