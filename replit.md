# Katmannames - Replit Projesi

## Genel Bakış

Katmannames, Codenames'den ilham alan ancak resmi Codenames oyunu olmayan, benzersiz, çok oyunculu bir Türkçe kelime tahmin oyunudur. WebSocket bağlantıları kullanarak gerçek zamanlı oynanış sunar ve Render üzerinde dağıtım için tasarlanmıştır. Proje, belirgin bir görsel stil ve güçlü teknik altyapı ile etkileyici, gerçek zamanlı bir çok oyunculu deneyim sunmayı amaçlar.

## Kullanıcı Tercihleri

Detaylı açıklamaları tercih ediyorum.
Tekrarlı geliştirme istiyorum.
Büyük değişiklikler yapmadan önce sor.
`shared/` klasöründe değişiklik yapma.
`server/words.ts` dosyasında değişiklik yapma.

## Son Güncellemeler

### Glassmorphism Kahin Oylama Penceresi (9 Kasım 2025)
- **Modern Glassmorphism Teması**: Arka plan bulanıklığı, yarı saydam arka planlar ve gradyan katmanları ile tam glassmorphism tasarım uygulandı
- **Akıcı Giriş Animasyonu**: Pencere görüntülendiğinde yakınlaştırma ve soluklaşma animasyonu eklendi (0.5s süre)
- **Geliştirilmiş Görsel Efektler**:
  - Bulanıklık efektli çok katmanlı cam paneller
  - Mor/amber ışıltılı gradyan kenarlıklar
  - Arka plan bulanıklıklı yarı saydam kartlar
  - Takım renkleri ile animasyonlu gölge efektleri
  - Kazanan takım için titreyen taç emojisi
- **İyileştirilmiş Kart Tasarımı**: 
  - Gradyan arka planlı cam benzeri oyuncu kartları
  - Mor ışıltı ve ölçek dönüşümü ile hover efektleri
  - Bulanıklık efektli yarı saydam oy rozetleri
  - Gradyan arka planlı glassmorphic butonlar
- **Kademeli Kart Animasyonu**: Oyuncu kartları sıralı gecikmelerle akıcı görünüm için içeri kayar

### Geliştirilmiş Kahin Açıklama Dizisi (9 Kasım 2025)
- **Dramatik Geri Sayım**: Açıklama başlamadan önce büyük animasyonlu sayılarla 3 saniyelik geri sayım eklendi
- **Çok Aşamalı Dizi**: Açıklama farklı aşamalara ayrıldı: geri sayım → açıklama → karar → sonuç
- **Gerilimli Zamanlama**: Maksimum drama için toplam dizi 12s'den 20s'ye uzatıldı
- **Davul Rulosu Efekti**: Gerilimli an sırasında animasyonlu noktalar ve "AÇIKLANIYOR..." metni eklendi
- **Partikül Efektleri**: Başarı/başarısızlık duyurusunda patlayan partiküller
- **Ekran Sarsıntısı**: Son sonuç açıklanırken kamera sarsıntı efekti
- **Görsel İyileştirmeler**: 
  - Karar aşamasında dönen ışık ışınları
  - Başarı/başarısızlığa göre değişen radyal gradyan arka planlar
  - Görsel ilgi için simgeler (yıldızlar, şimşekler, parıltılar)
  - Daha iyi zamanlama eğrileri ile daha dramatik animasyonlar
- **İyileştirilmiş Tipografi**: Etki için daha büyük metin boyutları ve daha iyi gölge efektleri

### Dengeli Kahin Oylama Penceresi (9 Kasım 2025)
- **Optimal Boyut**: max-w-2xl (672px) olarak ayarlandı - ne çok küçük ne çok büyük
- **Daha Büyük Avatarlar**: Gradyan arka planlarla 32px'den 48px'e yükseltildi
- **Daha İyi Aralık**: Elemanlar arasındaki dolgu ve boşluklar artırıldı
- **Geliştirilmiş Görsel Efektler**:
  - Avatar ve butonlarda gradyan arka planlar
  - Seçili oyuncularda gölge efektleri
  - En çok oy alan oyuncuda halka vurgusu
  - Akıcı hover ölçekleme animasyonları
- **İyileştirilmiş Metin**: Daha büyük yazı boyutları ve daha iyi hiyerarşi
- **Rol Simgeleri**: Oyun kurucu (🎯) ve ajan (🕵️) rolleri için emoji simgeler eklendi
- **Kaydırma Yok**: Hala ekranda kaydırma gerektirmeden tamamen sığıyor

### Kelime Takip Sistemi (9 Kasım 2025)
- **Kelime Tekrarı Yok**: Bir oyunda görünen kelime, aynı odadaki sonraki oyunlarda tekrar görünmez
- **Otomatik Sıfırlama**: Mevcut tüm kelimeler kullanıldığında, sistem otomatik olarak sıfırlanır ve yeniden başlar
- **Oyunlar Boyunca Kalıcı**: Kelime takibi, tüm oyuncular ayrılana kadar tüm oda oturumu boyunca devam eder

### Oyuncu Atma ve Kahin Güncellemeleri (9 Kasım 2025)
- **Oyun Ekranı Atma**: Oda sahipleri artık aktif oyunlar sırasında oyuncuları atabilir (sadece lobide değil)
- **Kahin Görünürlük Ayarları**: Oda sahipleri kahinlerin hangi kartları görebileceğini yapılandırabilir:
  - **"Sadece Kendi Takımı" (own_team)**: Kahinler sadece kendi takımlarından rastgele 3 kart görür (varsayılan)
  - **"Her İki Takım" (both_teams)**: Kahinler her iki takımdan rastgele 3 kart görür (nötr/suikastçı hariç)
  - **"Tüm Kartlar" (all_cards)**: Kahinler nötr ve suikastçı dahil tüm kartlardan rastgele 3 kart görür
  - **Lobi Kontrolü**: Kaos Modu ayarları altında açılır seçici (sadece oda sahipleri)
  - **Sunucu Filtreleme**: Sunucu, kahinin knownCards dizisinde olmayan kartları düzgün maskeler
- **Suikastçı Seçim Engeli**: Suikastçı (siyah kart) seçildiyse kahin oylaması devre dışı bırakılır
- **Rakip Son Kart Engeli**: Kaybeden takım rakibin son kartını açtıysa kahin oylaması devre dışı bırakılır
- **Minimize UI Konumu**: Minimize edilmiş Kahin oylama UI'ı daha iyi görünürlük için sol alt köşeye taşındı
- **Eski UI Kaldırıldı**: Başlıktan eski "Son Şans: Kahin Tahmini" butonu temizlendi

### Kaos Modu Basitleştirmesi (6 Kasım 2025)
- **Sadece Kahin Modu**: Kaos modu sadece Kahin modunu içerecek şekilde basitleştirildi
- **Çift Ajan Kaldırıldı**: Daha basit oynanış için Çift Ajan seçeneği geçici olarak kaldırıldı
- **Otomatik Mod Seçimi**: Kaos modu etkinleştirildiğinde, Kahin modu otomatik olarak seçilir
- **UI İyileştirmeleri**: Anında etkinleştirme ve net görsel geri bildirim ile daha temiz kaos modu arayüzü

### Oylama Sistemi Güncellemeleri (6 Kasım 2025)
- **Oy Değiştirme**: Oyuncular artık tanıtım aşamasında istediği zaman oylarını değiştirebilir
- **Tıklanabilir Oy Kartları**: Beğeni/beğenmeme sayıları artık partikül efektleriyle tıklanabilir kartlar
- **Görsel Geri Bildirim**: Seçilen oy vurgulu kenarlık ve "Seçildi ✓" metni ile gösterilir
- **Oy Kilidi Kaldırıldı**: Daha iyi esneklik için oylama kilidi mekanizması kaldırıldı

### Tanıtım UI İyileştirmeleri (6 Kasım 2025)
- **Geliştirilmiş Takım Başlıkları**: Animasyonlu gradyanlar ve titreyen simgelerle premium glassmorphism tasarım
- **İyileştirilmiş Talimatlar**: Işıltı efektleriyle oyun kurucu talimatları için daha iyi görsel hiyerarşi
- **Daha Temiz Animasyonlar**: "Tanışma Zamanı" başlığından dikkat dağıtıcı arka plan partikülleri kaldırıldı
- **Uzatılmış Görüntüleme Süresi**: Tanıtım başlığı artık 3.5 saniye görüntüleniyor (1 saniye artırıldı)
- **Zarif Hover Animasyonu**: Oyuncu ismi baloncuğu hover efekti, takım renkli gölgelerle hafif ölçek ve kaldırma efektine basitleştirildi
- **Gelişmiş Beğen/Beğenme Animasyonları**: 
  - Döndürme ve ışıltı efektleriyle dairesel desende yayılan çoklu partiküller
  - Ölçek ve döndürme ile doğal buton basma geri bildirimi için yay fiziği
  - Daha iyi görsel geri bildirim için seçili oylarda gölge ışıltısı
  - Oy kaydedildiğinde akıcı sıçrama animasyonu

### Video Performans Optimizasyonları (5 Kasım 2025)
- **Base64 Video Dönüştürme**: Uygulama yüklendiğinde tüm videoları base64 formatına dönüştürmek için VideoBase64Converter servisi uygulandı
- **Satır İçi Video Oynatma**: Takılma olmadan video oynatma için useInlineVideo hook'u kullanılarak TurnVideoInline bileşeni oluşturuldu
- **Bellek Tabanlı Oynatma**: Videolar base64 dizileri olarak belleğe yüklenir, oynatma sırasında ağ gecikmelerini ortadan kaldırır
- **Çoklu Optimizasyon Katmanları**: Maksimum performans için SimpleVideoOptimizer, VideoCache ve Base64Converter birlikte çalışır

### Oyuncu Tanıtım Özelliği (5 Kasım 2025)
- **Tanıtım Aşaması**: Oyun başlamadan önce oyuncuların kendilerini tanıttığı yeni oyun aşaması
- **Kontrolcü Sistemi**: Kırmızı takım (açık) oyun kurucusu tanıtım dizisini kontrol eder
- **Etkileşimli Kartlar**: Oyuncu seçimi için hover efektleri ile güzel glassmorphism kart tasarımı
- **Beğeni/Beğenmeme Sistemi**: Oyuncular animasyonlu beğeni/beğenmeme rozetleri ile tanıtımlara oy verebilir
- **Görsel Parlaklık**: Uygun temalamayla zengin animasyonlar, partikül efektleri, takım renkli kartlar

## Sistem Mimarisi

### UI/UX Kararları
Proje, "Katman Koyu" (mavi) ve "Katman Açık" (kırmızı) takımları için mavi/kırmızı renk şeması ile koyu lacivert/gri tema içerir. Her kart tipi (Koyu, Açık, Nötr, Suikastçı) için farklı gradyanlar ve panellerle benzersiz iki katmanlı modern kart tasarımları, hover ve çevirme animasyonları dahil olmak üzere uygulanmıştır. Tasarım 3D kart efektleri (dokular, ışık, gölge), Poppins yazı tipi ailesi ve katmanlı logo tasarımı içerir. Mobil cihazlar için tamamen duyarlıdır ve görüntü alanı boyutuna göre dinamik duyarlı ölçekleme içerir. Partiküller ve ışık efektleri tüm sayfalarda görsel atmosferi zenginleştirir.

### Teknik Uygulamalar
- **Frontend**: React + TypeScript ile oluşturulmuş, stil için Tailwind CSS (özel karanlık tema), hafif yönlendirme için Wouter ve bileşenler için Shadcn/ui. Gerçek zamanlı iletişim için WebSocket istemcisi kullanır.
- **Backend**: HTTP sunucusu için Express ve gerçek zamanlı oyun odaları için `ws` kütüphanesi kullanır. Oyun durumu ve oda yönetimi bellek içi depolama ile yönetilir. 250'den fazla kelimeden oluşan Türkçe kelime listesi dahildir.
- **Shared**: Frontend ve backend arasında tutarlı veri yapıları sağlayarak, çalışma zamanı tip doğrulaması için TypeScript şemaları ve Zod doğrulaması içerir.
- **WebSocket Yönetimi**: Merkezi bir `WebSocketContext`, sayfa geçişleri boyunca tek, kalıcı bir WebSocket bağlantısını yönetir ve `join_room`, `create_room`, `select_team`, `give_clue` ve `reveal_card` gibi gerçek zamanlı olayları işler. Otomatik yeniden bağlanma, hata işleme ve eski bağlantı temizliği içerir.
- **Oyun Mekanikleri**: Başlangıç takımı için rastgele 9 kart ve diğeri için 8 kart, 7 nötr kart ve 1 suikastçı kart dağıtımı dahil toplam 25 kartlı 5x5 kart ızgarası içerir. Oyun, son 5'in kronolojik geçmişi ile açılan kartları takip eder. Kartlar fare takipli eğim animasyonları ile 3D hover efektlerine, açılan kartlarda parıltı efektlerine sahiptir.
- **Oda Yönetimi**: Oda oluşturma ve katılma, gerçek zamanlı oyuncu listeleri, takım ve rol seçimi, bot entegrasyonu (sadece sahip), dinamik takım ismi değişikliklerini destekler. Şifre korumalı odalar desteklenir.
- **UI İyileştirmeleri**: Takım panelleri hover yükseltme efektlerine sahiptir. "Hareket Çek" (alay) butonu daha iyi görünürlük ve gelecekteki buton eklemeleri için mavi takım panelinin altına yerleştirilmiştir.

### Özellik Tanımlamaları
- İsim girişi ile kullanıcı kaydı.
- Gerçek zamanlı oyuncu listesi, takım ve rol seçimi.
- Oyun içi mekanikler: ipucu verme, kart açma, oyun durumu takibi, kazanan belirleme.
- Sayfa yenilemelerinde kalıcılık.
- Sadece sahip özellikleri: bot ekleme, lobiye dönme.
- Oyuncu özellikleri: odadan ayrılma.
- Dinamik oyun elemanları: rastgele kart dağıtımı (9-8 veya 8-9), kronolojik açma geçmişi.
- UI özel arka plan resimleri, partikül efektleri ve radyal ışık efektleri içerir.

### Sistem Tasarım Kararları
- **Dağıtım Hedefi**: Belirtilen derleme ve başlatma komutları ve Node.js 20 ortamı ile Render.
- **Veri Akışı**: `shared/schema.ts` frontend-backend iletişimi için tüm veri modellerini ve tiplerini tanımlar, Zod tarafından doğrulanır.
- **Durum Yönetimi**: Oyun ve oda durumları için backend'de bellek içi depolama.
- **Modülerlik**: Endişelerin `client/`, `server/` ve `shared/` dizinlerine ayrılması.

## Harici Bağımlılıklar

- **React**: Frontend UI kütüphanesi.
- **TypeScript**: Tip güvenliği için dil.
- **Tailwind CSS**: Utility-first CSS framework.
- **Wouter**: Hafif React yönlendirici.
- **Shadcn/ui**: UI bileşen kütüphanesi.
- **Express**: Backend web framework.
- **ws**: Node.js için WebSocket kütüphanesi.
- **Zod**: Şema tanımlama ve doğrulama kütüphanesi.
- **Render**: Dağıtım için bulut platformu.