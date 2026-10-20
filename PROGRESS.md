# İlerleme

## 2026-10-20: İlk sürüm

**Karar ve gerekçeler**
- React + Vite + TypeScript, Vitest + Testing Library.
- Veri yalnızca cihazda (localStorage). Kullanıcı bulut senkronu istemedi; yedek dosyasıyla korunuyor.
- Tutarlar kuruş cinsinden tamsayı; ondalık hatası olmasın diye.
- Düzenli ödemeler `generatedThrough` işaretçisiyle üretiliyor, böylece kullanıcının sildiği
  otomatik işlem tekrar oluşmuyor. Kural silinince geçmiş işlemler kalıyor.
- Grafikler kütüphanesiz SVG (paket küçük kalsın diye).
- Yayın: GitHub Pages (`base: '/cuzdan/'`), PWA ile çevrimdışı.

**Yapıldı**
- Özet, İşlemler, Bütçe, Ayarlar ekranları; iOS tarzı, otomatik koyu/açık tema.
- Gelir/gider, kategori bütçeleri (%80 uyarı), düzenli ödemeler, arama/filtre.
- Yedek alma (iOS paylaşım sayfası → Dosyalar) ve doğrulamalı geri yükleme.
- PWA ikonları, manifest, service worker; sunucu kapalıyken açıldığı doğrulandı.
- 75 test (iş mantığı + arayüz akışları).

**Bulunan ve düzeltilen hatalar**
- Gider/Gelir geçişinde sheet kısalıp kayıyor, sonraki dokunuş formu kapatıyordu → sabit yükseklik.
- Yüzde ekleri hep "'ine" idi → sayının okunuşuna göre ek üreten `turkish.ts`.
- Tarayıcıda `Intl` kuruşsuz biçimde 2 haneyi koruyordu → `minimumFractionDigits: 0`.

**Sonraki fikirler**
- Kendi kategorini ekleme/düzenleme
- Yıllık görünüm ve CSV dışa aktarma
- Gerçek iPhone'da test (henüz yalnızca tarayıcı emülasyonunda denendi)
