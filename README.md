# Katmannames

**Bu oyun resmi Codenames değildir.**

Katmannames, Codenames'ten esinlenilmiş, tamamen özgün, çok oyunculu bir Türkçe kelime tahmin oyunudur.

## Nasıl Oynanır?

1. **Oda Oluştur veya Katıl**: Oyuna başlamak için bir oda oluşturun veya arkadaşınızın oda kodunu kullanarak katılın.

2. **Takım Seç**: İki takımdan birini seçin:
   - **Katman Koyu** (Mavi)
   - **Katman Açık** (Turkuaz)

3. **Rol Seç**:
   - **İpucu Veren**: Takımına tek kelime ipucu ve sayı verir. Hangi kartların kendi takımının olduğunu görür.
   - **Tahminci**: İpuçlarına göre kartları açar. Kart türlerini göremez.

4. **Oyunu Başlat**: Her takımda en az bir İpucu Veren ve bir Tahminci olmalı. En az 4 oyuncu gereklidir.

5. **Oyun Akışı**:
   - İpucu Veren bir kelime ve sayı söyler (örn: "HAYVAN 2")
   - Tahminciler o kadar kart açabilir
   - **Doğru kart** (kendi takımınız) → Tahmine devam
   - **Yanlış kart** (rakip takım) → Sıra geçer
   - **Tarafsız kart** (gri) → Sıra geçer
   - **Yasak kart** (kırmızı-siyah) → Oyun biter, rakip takım kazanır!

6. **Kazanma**: Tüm kartlarını ilk açan takım kazanır.

## Özellikler

- 🎮 Gerçek zamanlı çok oyunculu oyun
- 🌐 Tamamen Türkçe arayüz
- 🎨 Özgün kart tasarımları ve animasyonlar
- 📱 Mobil uyumlu tasarım
- 🔄 Sayfa yenileme sonrası tekrar bağlanma
- 🎯 5x5 kelime kartı ızgarası
- 💡 İpucu sistemi

## Deploy Etme (Render)

### Ön Gereksinimler
- [Render](https://render.com) hesabı
- Git repository (GitHub, GitLab, veya Bitbucket)

### Adımlar

1. **Projeyi Git'e Yükleyin**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Render'da Yeni Web Service Oluşturun**
   - [Render Dashboard](https://dashboard.render.com/) → "New" → "Web Service"
   - Repository'nizi bağlayın
   - Aşağıdaki ayarları yapın:

3. **Build & Deploy Ayarları**
   - **Name**: `katmannames` (veya istediğiniz isim)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (veya tercih ettiğiniz plan)

4. **Environment Variables** (Opsiyonel)
   - `SESSION_SECRET`: Güvenli bir random string (örn: `openssl rand -base64 32`)

5. **Deploy'u Başlatın**
   - "Create Web Service" butonuna tıklayın
   - Render otomatik olarak build ve deploy edecek
   - Deploy tamamlandığında size bir `.onrender.com` URL'i verecek

6. **Oyunu Test Edin**
   - Verilen URL'i tarayıcınızda açın
   - Birkaç sekme açarak çok oyunculu özelliği test edin

### Render Deployment Notları

- İlk deploy 5-10 dakika sürebilir
- Free tier kullanıyorsanız, 15 dakika inaktiviteden sonra servis uyku moduna geçer
- Her yeni push otomatik olarak yeniden deploy tetikler
- WebSocket bağlantıları desteklenir (ws:// ve wss://)

## Teknolojiler

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter
- **Backend**: Express, WebSocket (ws)
- **Deployment**: Render
- **Real-time**: WebSocket

## Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev

# Production build
npm run build

# Production server
npm start
```

## Lisans

Bu proje eğitim amaçlıdır. **Bu oyun resmi Codenames değildir.**
