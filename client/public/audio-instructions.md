# Tanışma Müziği Kurulumu

## Müzik Dosyası Ekleme

Tanışma aşaması müziği için şu adımları izleyin:

1. **Müzik Dosyası**: `effects (Cover) (1).aac` dosyasını `client/public/` klasörüne ekleyin.

2. **Alternatif Dosya Formatları**: Eğer .aac formatı çalışmazsa, dosyayı şu formatlara dönüştürebilirsiniz:
   - MP3: `effects (Cover) (1).mp3`
   - OGG: `effects (Cover) (1).ogg`
   - WAV: `effects (Cover) (1).wav`

3. **Format Değiştirme**: Farklı bir format kullanacaksanız, `client/src/hooks/useIntroductionMusic.ts` dosyasındaki dosya yolunu güncellemeniz gerekecek.

## Özellikler

- **Otomatik Başlama**: Tanışma aşaması başladığında müzik otomatik olarak çalar
- **Fade In**: Müzik yavaşça açılır (2 saniye)
- **Loop**: Müzik tanışma aşaması boyunca tekrar eder
- **Fade Out**: Tanışma aşaması bittiğinde müzik yavaşça kapanır (2 saniye)
- **Ses Seviyesi**: %50 ses seviyesinde çalar

## Test Etme

1. Oyuna girin ve lobi oluşturun
2. Oyuncular katıldıktan sonra oyunu başlatın
3. Tanışma aşaması başladığında müzik çalacak
4. Tanışma bittiğinde müzik fade-out ile kapanacak

## Sorun Giderme

Eğer müzik çalmazsa:
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- Dosya adının tam olarak `effects (Cover) (1).aac` olduğundan emin olun
- Dosyanın `client/public/` klasöründe olduğunu doğrulayın