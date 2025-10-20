# Katmannames - Replit Project

## Proje Hakkında

Katmannames, Codenames'ten esinlenilmiş, tamamen özgün, çok oyunculu bir Türkçe kelime tahmin oyunudur. Oyun gerçek zamanlı WebSocket bağlantıları kullanarak çalışır ve Render'a deploy edilebilir şekilde tasarlanmıştır.

**Bu oyun resmi Codenames değildir.**

## Proje Yapısı

### Frontend (client/)
- **React + TypeScript** - Modern UI framework
- **Tailwind CSS** - Özelleştirilmiş karanlık tema
- **Wouter** - Lightweight routing
- **Shadcn/ui** - Komponent kütüphanesi
- **WebSocket Client** - Gerçek zamanlı iletişim

### Backend (server/)
- **Express** - HTTP server
- **WebSocket (ws)** - Gerçek zamanlı oyun odaları
- **In-memory storage** - Oyun durumu ve oda yönetimi
- **Turkish word list** - 250+ Türkçe kelime

### Shared (shared/)
- **TypeScript schemas** - Frontend ve backend arasında paylaşılan tipler
- **Zod validation** - Runtime type validation

## Özellikler

### Mevcut Özellikler
- ✅ Kullanıcı karşılama ve isim girişi
- ✅ Oda oluşturma ve katılma sistemi
- ✅ Gerçek zamanlı oyuncu listesi
- ✅ Takım seçimi (Katman Koyu / Katman Açık)
- ✅ Rol seçimi (İpucu Veren / Tahminci)
- ✅ 5x5 kelime kartı ızgarası
- ✅ Türkçe kelime listesi (250+ kelime)
- ✅ İpucu verme mekanizması
- ✅ Kart açma ve tahmin sistemi
- ✅ Oyun durumu takibi
- ✅ Kazanan belirleme
- ✅ Sayfa yenileme dayanıklılığı
- ✅ Bot ekleme sistemi (owner-only, spymaster uniqueness)
- ✅ Kronolojik reveal history (son 5 kart)
- ✅ Lobiye dönme butonu (oyun bitince)
- ✅ Rastgele kart dağılımı (9-8 veya 8-9)
- ✅ WebSocket reconnection loop düzeltildi
- ✅ Takım ismi değiştirme (lobby'de düzenlenebilir)
- ✅ Mavi/kırmızı renk şeması (Katman Koyu = mavi, Katman Açık = kırmızı)

### Tasarım Özellikleri
- 🎨 Karanlık lacivert/grimsi tema
- 🎨 Mavi/Kırmızı renk şeması (Koyu = Mavi, Açık = Kırmızı)
- 🃏 Özgün kart tasarımları (iki katmanlı modern stil):
  - **Katman Koyu (Mavi)**: Açık mavi gradient + koyu mavi alt panel
  - **Katman Açık (Kırmızı)**: Açık kırmızı gradient + koyu kırmızı alt panel
  - **Tarafsız**: Açık bej gradient + koyu stone alt panel
  - **Yasak**: Gri-siyah gradient + siyah alt panel
- ✨ Hover ve flip animasyonları
- 📱 Responsive mobil tasarım
- 🎯 3D kart efektleri (dokular, ışık, gölge)
- 🔤 Poppins font ailesi
- 🌟 Katmanlı logo tasarımı

## Teknik Detaylar

### WebSocket Bağlantıları
- Path: `/ws`
- Protocol: `ws://` (dev) / `wss://` (production)
- **WebSocketContext**: Merkezi WebSocket yönetimi (tek bağlantı, sayfa geçişlerinde kalıcı)
- Gerçek zamanlı event'ler:
  - `join_room` - Odaya katılma
  - `create_room` - Oda oluşturma
  - `select_team` - Takım seçimi
  - `select_role` - Rol değiştirme
  - `add_bot` - Bot ekleme (owner-only)
  - `update_team_name` - Takım ismini değiştirme
  - `start_game` - Oyunu başlatma
  - `give_clue` - İpucu verme
  - `reveal_card` - Kart açma
  - `restart_game` - Oyunu yeniden başlatma
  - `return_to_lobby` - Lobby'ye dönme

### Oyun Mekaniği
- 25 kart total (5x5 grid)
- **Rastgele Dağılım**: Her oyun başında random olarak:
  - Bir takım 9 kart alır (başlayan takım)
  - Diğer takım 8 kart alır
- 7 Tarafsız kart
- 1 Yasak kart
- **Başlayan takım**: Her zaman 9 kartı olan takım başlar
- **Reveal History**: Son 5 açılan kart kronolojik sırayla gösterilir

### Deployment
- **Hedef Platform**: Render
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js 20
- **WebSocket Support**: ✅ Desteklenir

## Son Değişiklikler

### 2025-10-20 (Son Güncelleme)
- ✅ **Oyun Ekranı %80 Ölçeklendirme**
  - CSS transform: scale(0.8) ile tüm oyun ekranı %80'e küçültüldü
  - 100% tarayıcı ölçeğinde tüm içerik ekrana sığıyor, scroll yok
  - Transform-origin: top ile yukarıdan hizalama
  - Width compensation: 125% (-12.5% margin)
  - Grid gap'ler minimal (1-1.5px)
  - Kartlar kompakt (p-1.5/p-2, text-xs/sm)
  - Yan paneller 280px
  - Skor kartları text-5xl
  - Status banner p-3
  - Header minimal boyut

### 2025-10-20
- ✅ **Kart Tasarımı Yenilendi**
  - İki katmanlı modern tasarım (üstte açık gradient, altta koyu panel)
  - 3:2 aspect ratio (en-boy oranı)
  - Mavi takım: Açık mavi gradient + koyu mavi panel + açık mavi çerçeve
  - Kırmızı takım: Açık kırmızı gradient + koyu kırmızı panel + açık kırmızı çerçeve
  - Tarafsız: Açık bej (stone) gradient + koyu stone panel + bej çerçeve
  - Yasak: Gri/siyah gradient + siyah panel + açık gri çerçeve
  - Yumuşak yuvarlatılmış köşeler ve belirgin 3px çerçeveler
  - Kelimeler alt panelde beyaz renkte, uppercase
  - Hover efekti: Kart 8% büyür ve 2px yukarı kalkar
  - Renkli gölge efektleri

- ✅ **Takım İsimleri Oyun Ekranında**
  - Game.tsx'de hardcoded "Katman Koyu/Açık" kaldırıldı
  - Skor kartlarında ve sıra göstergesinde dinamik takım isimleri
  - Lobby'de yapılan takım ismi değişiklikleri oyunda da yansıyor

### 2025-10-19
- ✅ **Takım İsmi Değiştirme**
  - Lobby'de takım isimleri düzenlenebilir
  - Edit butonu ve input field ile inline editing
  - Backend'e update_team_name event handler eklendi
  - Real-time senkronizasyon ile tüm oyunculara yansıma

- ✅ **Renk Şeması Güncelleme**
  - Tüm turkuaz/cyan renkler kırmızı ile değiştirildi
  - Katman Koyu = Mavi (blue)
  - Katman Açık = Kırmızı (red)
  - Game.tsx, Lobby.tsx, GameEnd.tsx, PlayerList.tsx, GameCard.tsx, ClueDisplay.tsx, GameStatus.tsx güncellendi

- ✅ **Kart Arka Plan Textures**
  - bg-metallic-dark: Mavi metalik gradient + geometric patterns
  - bg-neon-light: Kırmızı neon gradient + grid textures
  - bg-neutral-texture: Gri crosshatch patterns
  - bg-assassin-danger: Kırmızı-siyah checkerboard + radial glow

### 2025-10-19 (Önceki)
- ✅ **WebSocket Reconnection Loop Düzeltildi**
  - WebSocketContext ile merkezi bağlantı yönetimi
  - Sayfa geçişlerinde tek WebSocket instance kullanımı
  - Reconnection loop sorunu tamamen giderildi

- ✅ **Lobiye Dönme Özelliği**
  - `return_to_lobby` event handler eklendi
  - GameEnd sayfasından lobby'ye dönüş
  - Oyun state'i temizleniyor (cards, clue, winner reset)

- ✅ **Rastgele Kart Dağılımı**
  - Her oyun başında hangi takımın 9, hangisinin 8 kart alacağı random
  - Başlayan takım her zaman 9 kartı olan takım
  - Codenames kurallarına uygun

- ✅ **Bot Sistemi**
  - Owner-only bot ekleme yetkisi
  - Spymaster uniqueness enforcement
  - Dark/Light takımlarına bot ekleme

- ✅ **Reveal History**
  - Son 5 açılan kart kronolojik gösterim
  - Timestamp tracking
  - Color-coded card display

### 2025-01-19
- ✅ İlk proje kurulumu
- ✅ Tüm UI komponentleri ve sayfalar
- ✅ Backend WebSocket implementasyonu
- ✅ Oyun mekaniği (turn switching, win conditions)
- ✅ 250+ Türkçe kelime listesi

### Tamamlanmış Özellikler
- ✅ Full stack oyun tamamlandı
- ✅ WebSocket gerçek zamanlı senkronizasyon
- ✅ Oda yönetimi ve oyuncu tracking
- ✅ Bot desteği ve role management
- ✅ UI/UX polish ve animasyonlar

## Geliştirici Notları

### Önemli Dosyalar
- `shared/schema.ts` - Tüm veri modelleri ve tipleri
- `server/words.ts` - Türkçe kelime listesi
- `server/routes.ts` - WebSocket event handlers ve broadcast logic
- `server/storage.ts` - In-memory oyun durumu yönetimi
- `client/src/contexts/WebSocketContext.tsx` - Merkezi WebSocket yönetimi
- `client/src/hooks/useWebSocket.ts` - WebSocket connection ve event handling
- `client/src/index.css` - Tailwind konfigürasyonu ve custom CSS
- `tailwind.config.ts` - Tasarım token'ları ve animasyonlar

### Tasarım Prensipleri
- Karanlık tema her yerde varsayılan
- Her kart türü görsel olarak benzersiz olmalı
- Animasyonlar hafif ve performanslı
- Mobilde de tam işlevsellik
- Türkçe dil desteği %100

### WebSocket Event Handling
- **Merkezi Bağlantı**: WebSocketContext ile tek instance
- Her event için validation (Zod schemas)
- Room state senkronizasyonu ve broadcast
- Automatic reconnection (5 deneme, exponential backoff)
- Error handling ve user feedback
- Stale connection cleanup (5 saniye timeout)
