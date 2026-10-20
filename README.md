# Cüzdan

İnternetsiz çalışan, iPhone'a kurulabilen kişisel gelir-gider ve bütçe takibi.
Veriler yalnızca telefonda durur; sunucu, hesap veya abonelik yok.

## Özellikler

- Gelir ve gider kaydı, kategoriye göre
- Aylık özet: kalan bakiye, tasarruf oranı, harcama dağılımı (donut), son 6 ay trendi
- Kategori başına aylık bütçe limiti; %80'de uyarı, aşınca kırmızı
- Düzenli ödemeler (kira, abonelik, maaş): her ay otomatik eklenir, açılmadığın ayları da tamamlar
- Arama ve gelir/gider filtresi
- Yedek alma (Dosyalar'a kaydet) ve geri yükleme
- Telefonun ayarına göre otomatik koyu/açık tema

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
  views/       Ekranlar: Özet, İşlemler, Bütçe, Ayarlar
  components/  Form, sheet, grafikler, ortak parçalar
  store.tsx    Veriyi tutar, localStorage'a kaydeder
```
