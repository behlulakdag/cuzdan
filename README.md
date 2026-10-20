# Cüzdan

İnternetsiz çalışan, iPhone'a kurulabilen kişisel gelir-gider ve bütçe takibi.
Veriler yalnızca telefonda durur; sunucu, hesap veya abonelik yok.

## Özellikler

- Gelir ve gider kaydı; kategoriye göre, notlu, ileri tarihli olabilir
- Aylık özet: sayarak değişen bakiye, tasarruf oranı, harcama dağılımı, son 6 ay trendi
- Göstergeler: geçen aya göre değişim, günlük ortalama, ay sonu tahmini
- Grafikte kategoriye dokununca o kategorinin işlemleri; trendde aya dokununca o ay
- Kategori başına aylık bütçe; %80'de uyarı, aşınca kırmızı, ay sonuna kadar günlük harcama hakkı
- Düzenli ödemeler (kira, abonelik, maaş): her ay otomatik eklenir, açılmadığın ayları da tamamlar
- Kendi kategorilerin (ad, simge, renk)
- Not önerileri: kategoride sık yazdığın notlar tek dokunuşla, son tutarıyla gelir
- Silmeyi geri alma, sola kaydırıp silme, kayıt bildirimleri
- Birikim hedefleri: ilerleme halkası, para ekle/çek, son tarihe göre aylık gereken tutar
- Yıllık görünüm: 12 ay, en pahalı/tasarruflu ay, en çok harcanan kategoriler
- Düzenli ödemede hızlı seçim (Claude, Netflix, Spotify, kira, maaş...)
- Arama, gelir/gider ve kategori filtresi
- Yedek alma (Dosyalar'a kaydet), geri yükleme, 30 günde bir hatırlatma
- Excel için CSV dışa aktarma
- Sürükleyerek kapanan formlar, animasyonlar, otomatik koyu/açık tema

## iPhone'a kurulum

1. Safari'de `https://behlulakdag.github.io/cuzdan/` adresini aç
2. Paylaş düğmesi → **Ana Ekrana Ekle**
3. Ana ekrandaki ikondan aç; artık internetsiz de çalışır

> Veriler telefonda tutulur. Telefon değiştirmeden önce Ayarlar → **Yedek al** ile yedek dosyası oluştur.

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:5173/cuzdan/
npm test           # tüm testler
npm run build      # dist/ klasörüne üretim çıktısı
npm run icons      # public/icon.svg değişirse PNG ikonları yeniden üretir
```

`main` dalına her push'ta GitHub Actions testleri çalıştırır, geçerse GitHub Pages'e yayınlar.

## Yapı

```
src/
  domain/      Saf iş mantığı (arayüzden bağımsız, testli)
    money.ts       TL biçimlendirme/ayrıştırma; tutarlar kuruş cinsinden tamsayı
    dates.ts       Yerel tarih yardımcıları
    recurring.ts   Düzenli ödemelerin üretilmesi
    summary.ts     Aylık özet, trend, bütçe durumu
    reducer.ts     Tüm veri değişiklikleri
    backup.ts      Yedek dosyası ve doğrulama
    turkish.ts     Yüzdelere doğru Türkçe ek (%90'ına, %83'üne)
    suggestions.ts Not önerileri
    csv.ts         Excel uyumlu CSV
    backupReminder.ts Yedek hatırlatma kuralı
    goals.ts       Birikim hedefi ilerlemesi
    presets.ts     Düzenli ödeme hızlı seçimleri
  views/       Ekranlar: Özet, İşlemler, Bütçe, Ayarlar
  components/  Form, sheet, grafikler, ortak parçalar
  store.tsx    Veriyi tutar, localStorage'a kaydeder
```
