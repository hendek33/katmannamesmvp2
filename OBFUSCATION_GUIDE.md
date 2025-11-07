# 🔐 KATMANNAMES OBFUSCATION REHBERİ

## Hızlı Kullanım

### 1. Normal Build (Obfuscation YOK)
```bash
npm run build
```

### 2. Obfuscated Build (KOD KORUMALI)
```bash
# Yöntem 1: Script ile
./build-with-obfuscation.sh

# Yöntem 2: Manuel
npm run build
node run-obfuscation.js
```

## Özellikler

✅ **Aktif Korumalar:**
- **Domain Kilidi**: Sadece izin verilen domainlerde çalışır
  - katmannames.onrender.com
  - *.replit.app
  - *.repl.co
  - localhost (geliştirme için)

- **Kod Karmaşıklaştırma**:
  - Control flow flattening
  - Dead code injection
  - String encryption (Base64 + RC4)
  - Debug protection
  - Console output disabled
  - Self defending code

- **Frontend Korumaları**:
  - Sağ tık engelleme
  - Metin seçimi engelleme
  - DevTools algılama
  - Copyright watermark

## Obfuscation Detayları

### Neleri Koruyor?
- ✅ Tüm JavaScript dosyaları
- ✅ React componentleri
- ✅ Game logic
- ✅ WebSocket bağlantıları

### Neleri Korumuyor?
- ❌ HTML/CSS (zaten minified)
- ❌ Görseller ve videolar
- ❌ Vendor/chunk dosyaları

## Domain Ekleme

Yeni domain eklemek için `client/src/utils/protection.ts` dosyasını düzenleyin:

```typescript
private static readonly ALLOWED_DOMAINS = [
  'replit.app',
  'repl.co',
  'localhost',
  'katmannames.onrender.com',
  'yeni-domain.com'  // <-- Yeni domain buraya
];
```

## Obfuscation Ayarları

Güvenlik seviyesini değiştirmek için `obfuscate-build.js` dosyasını düzenleyin:

```javascript
const obfuscatorOptions = {
  // Daha güçlü koruma için:
  controlFlowFlatteningThreshold: 1,    // Max: 1
  deadCodeInjectionThreshold: 0.7,      // Max: 1
  stringArrayThreshold: 1,               // Max: 1
  
  // Performans için (daha az koruma):
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjectionThreshold: 0.2,
  stringArrayThreshold: 0.5
};
```

## Sorun Giderme

### Build sonrası oyun çalışmıyor?
- Domain kilidini kontrol edin
- Browser console'da hata var mı bakın
- `disableConsoleOutput: false` yapıp debug edin

### Obfuscation çok yavaş?
- Threshold değerlerini düşürün
- `deadCodeInjection: false` yapın

### Domain kilidi çalışmıyor?
- `window.location.hostname` değerini kontrol edin
- ALLOWED_DOMAINS listesine ekleyin

## Güvenlik Seviyeleri

### 🟢 Normal (Geliştirme)
```bash
npm run dev
```
- Obfuscation YOK
- Debug kolay
- Hızlı geliştirme

### 🟡 Orta (Test)
```bash
npm run build
```
- Minification VAR
- Obfuscation YOK
- Production'a yakın

### 🔴 Maksimum (Production)
```bash
./build-with-obfuscation.sh
```
- Minification VAR
- Obfuscation VAR
- Domain kilidi VAR
- Tüm korumalar aktif

## Deployment

### Render.com için:
1. Build command: `./build-with-obfuscation.sh`
2. Start command: `npm start`

### Replit için:
1. Otomatik build ve deploy
2. Domain kilidi zaten ayarlı

## İletişim

Sorunlar için: [Destek]
Lisans: LICENSE.md

---

**Game ID**: ktmn-a2F0bWFu
**Version**: 1.0.0
**Protected By**: Katmannames Security System