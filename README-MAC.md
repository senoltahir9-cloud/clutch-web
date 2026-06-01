# ClutchApp macOS Kurulum

Bu proje Electron tabanlidir. Ayni uygulama kodundan Windows icin `.exe`, macOS icin `.dmg` uretilebilir.

## En iyi yol: GitHub Actions

1. Degisiklikleri GitHub'a yukleyin.
2. GitHub'da `Actions` sekmesine girin.
3. `Build ClutchApp` workflow'unu acin.
4. `Run workflow` butonuna basin.
5. Is bitince `ClutchApp-macOS` artifact dosyasini indirin.
6. Icindeki `.dmg` dosyasini Mac kullanan kisiye gonderin.

Mac kullanici DMG dosyasini acar, `ClutchApp` uygulamasini `Applications` klasorune surukler.

## Mac uzerinde elle build almak

Mac bilgisayarda:

```bash
chmod +x BUILD-mac.sh
./BUILD-mac.sh
```

Build tamamlaninca macOS dosyalari `dist/` klasorune cikar.

## Guvenlik uyarisi

Uygulama Apple Developer ID ile imzali degilse macOS ilk acilista "unidentified developer" uyarisi verebilir.

Kullanici su sekilde acabilir:

1. DMG icinden uygulamayi `Applications` klasorune tasiyin.
2. Uygulamaya sag tiklayin.
3. `Open` secin.
4. Gelen pencerede tekrar `Open` secin.

## Not

Mac `.dmg` paketini Windows uzerinde uretmek saglikli degildir. GitHub Actions veya gercek bir Mac kullanin.
