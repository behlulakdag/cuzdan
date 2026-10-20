/**
 * iOS'ta paylaşım sayfası "Dosyalar'a Kaydet" sunar; indirme bağlantısı ana ekran
 * uygulamalarında güvenilir değil. Paylaşım yoksa (masaüstü) dosya indirilir.
 * Kullanıcı paylaşımı iptal ederse 'cancelled' döner.
 */
export async function shareOrDownload(file: File, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled'
      throw err
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
