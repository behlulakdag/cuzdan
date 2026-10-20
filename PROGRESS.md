# İlerleme

## 2026-10-20: Kaydırarak silme, yıllık görünüm, birikim hedefleri

- Düzenli ödemede hızlı seçim çipleri (Claude en başta). Tutar bilerek boş: fiyat plana/kura göre değişir.
- İşlem listesinde sola kaydırıp silme (yön kilidi, tek satır açık, geri alınabilir).
- Yıllık görünüm. Hata: devam eden ay "en tasarruflu ay" çıkıyordu → tamamlanmış aylarla karşılaştırma.
- Birikim hedefleri (`AppData.goals`). Karar: hedefe konan para gelir/gider bakiyesini etkilemez.
  Eski yedekler (goals alanı olmayan) sorunsuz açılıyor.
- Banka bağlantısı konuşuldu: canlı bağlantı açık bankacılık lisansı ve sunucu gerektirdiği için yok.
  Kullanıcı ekstre içe aktarmayı şimdilik istemedi.
- 127 test.


## 2026-10-20: Cila, mantık düzeltmeleri ve yeni özellikler

Yayında: https://behlulakdag.github.io/cuzdan/ (main'e her push'ta testler + otomatik yayın)

**Düzeltilen mantık hataları**
- Ayarlar'dan ödeme günü geçmiş düzenli ödeme eklenince bu ayınki de ekleniyordu (elle
  girilmişse çift kayıt). Artık varsayılan olarak gelecek aydan başlıyor; "Bu ayınkini de ekle" anahtarı var.
- Uygulama açıkken ay değişince ekran eski ayda kalıyordu.
- İleri tarihli işlemler görünmüyordu (ileri aylara gidilemiyordu) → 12 ay ileri.
- Geçmiş ayda da "Bu ay kalan" yazıyordu.
- Tutar üst sınırı yoktu (100 milyon TL).
- Dolu form dışarı dokununca kayboluyordu → sheet sallanıyor, Vazgeç onay soruyor.
- Ay sonu tahmini kirayı günlere yayıp şişiriyordu → düzenli giderler sabit sayılıyor.
- Bütçe uyarısında %99,6 "%100" görünüyordu → aşağı yuvarlama.

**Eklenenler**
- Geri alınabilir silme + bildirimler; sürükleyerek kapanan, animasyonlu sheet (body'ye portal).
- Kategori yönetimi (silinen kategorinin kayıtları "Diğer"e taşınır).
- Göstergeler, kategoriye/aya dokunarak gezinme, işlem listesi toplamı.
- Not önerileri, CSV dışa aktarma, yedek hatırlatıcı, günlük harcama hakkı.
- Animasyonlar: sayan bakiye, çizilen donut, büyüyen çubuklar, kademeli giriş, mikro etkileşimler.
  Hepsi "Hareketi Azalt" ayarında kapanıyor.
- 110 test.

**Notlar**
- Gerçek iPhone'da hâlâ denenmedi; tarayıcı emülasyonunda doğrulandı.
- Sürükleyerek kapatma yalnızca sheet başlığından çalışır (form alanlarıyla çakışmasın diye).


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
- Ekstre (CSV/Excel) içe aktarma ve otomatik kategori (kullanıcı şimdilik istemedi)
- PIN kilidi
- Gerçek iPhone'da test
