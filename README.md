# Aplikasi Pencatatan Pengeluaran 📱💸

Aplikasi mobile pencatatan pengeluaran berbasis **React Native (Expo)** yang
terhubung ke backend **Express + MySQL** sesuai kontrak API Modul 2C
(Pemrograman Mobile, SIF125113). Tampilan aplikasi menerapkan prototype
Figma hasil Modul 2B melalui design token di `src/theme.js`.

| Tautan | Alamat |
| ------ | ------ |
| Prototype Figma | [https://www.figma.com/design/8LS5vOGbgJzlq7SfsqvRZL/Prototype-Pengeluaran_Muhammad-Yoga-Firmansyah?node-id=0-1&t=T7aSs2i8znOw4Woe-1] |
| Dosen pengampu | Ahmad Yusuf, M.Kom |

## Struktur repositori

```
.
├── README.md                  <- berkas ini
├── API-Pengeluaran/           <- BACKEND: Express + MySQL (Modul 2A + Langkah 4 & 5 Modul 2C)
│   ├── server.js              <- entry point; listen di 0.0.0.0 agar terjangkau perangkat lain
│   ├── app.js                 <- middleware cors + json, mount route
│   ├── db.js                  <- pool mysql2 + uji koneksi saat start
│   ├── routes/
│   │   ├── pengeluaran.js     <- GET/GET:id/POST/PUT/DELETE sesuai kontrak (+ try/catch Langkah 5)
│   │   └── kategori.js        <- GET /kategori (endpoint tambahan Langkah 4)
│   ├── skema.sql              <- skema aman (tanpa DROP DATABASE)
│   ├── .env.example           <- contoh kredensial DB (JANGAN commit .env)
│   └── package.json
└── mobile-pengeluaran/        <- FRONTEND: Expo (React Native)
    ├── App.js                 <- seluruh layar & logika CRUD (state navigasi, lock, validasi)
    ├── app.json
    ├── .env.example           <- contoh EXPO_PUBLIC_API_URL
    └── src/
        ├── api.js             <- service HTTP: timeout 10 dtk, penanganan 204 & pesan error
        ├── helpers.js         <- validate(), rupiah(), tanggalLokal()
        └── theme.js           <- DESIGN TOKEN dari Figma (warna, tipografi, spasi, radius)
```

## Prasyarat

- Node.js LTS, MySQL 8 berjalan lokal.
- Expo Go versi sesuai SDK proyek di perangkat Android (atau emulator Android Studio).
- Perangkat dan komputer backend berada di Wi-Fi yang sama.

## Menjalankan backend

```bash
cd API-Pengeluaran
npm install
cp .env.example .env          # sesuaikan DB_USER/DB_PASSWORD/DB_NAME
mysql -u root -p < skema.sql  # hanya jika database belum ada
npm run dev                   # nodemon server.js -> http://localhost:3000
```

Uji cepat:
- `http://localhost:3000/pengeluaran` → array JSON (atau `[]` bila kosong)
- `http://localhost:3000/kategori` → array `[{id, nama}]`

## Menjalankan frontend

```bash
cd mobile-pengeluaran
npm install
npx expo install react-native-safe-area-context react-native-svg @expo/vector-icons
cp .env.example .env          # isi IPv4 Wi-Fi komputer, mis. http://192.168.1.13:3000
npx expo start --clear        # pindai QR dengan Expo Go (atau tekan a untuk emulator)
```

Catatan alamat API per lingkungan:

| Lingkungan | Nilai EXPO_PUBLIC_API_URL |
| ---------- | ------------------------- |
| Android fisik (satu Wi-Fi) | `http://IPv4_KOMPUTER:3000` |
| Emulator Android Studio | `http://10.0.2.2:3000` |
| Web/browser di komputer backend | `http://localhost:3000` |

Setelah mengubah `.env`, wajib restart Metro dengan `--clear`
(variabel `EXPO_PUBLIC_*` dipanggang ke bundle saat start).

## Kontrak API

| Endpoint | Metode | Respons sukses | Catatan |
| -------- | ------ | -------------- | ------- |
| /pengeluaran | GET | 200 array | kolom: id, judul, nominal, tanggal, kategori (nama/null) |
| /pengeluaran/:id | GET | 200 / 404 | seluruh kolom termasuk id_kategori & catatan |
| /pengeluaran | POST | 201 | kirim judul, nominal, id_kategori opsional; respons hanya {id, judul, nominal} |
| /pengeluaran/:id | PUT | 200 / 404 | hanya judul & nominal yang diperbarui |
| /pengeluaran/:id | DELETE | 204 / 404 | tanpa body; frontend tidak memparsir JSON pada 204 |
| /kategori | GET | 200 array | endpoint tambahan (Langkah 4 Modul 2C) untuk dropdown form |

### Pengembangan opsional terdokumentasi: kolom `catatan`

Desain Figma menyediakan input "Tambah Catatan" pada form tambah, sedangkan
kontrak dasar POST tidak menyimpannya. Sesuai arahan modul, kontrak diperluas
minimal dan terdokumentasi:

- **Payload**: POST menerima `catatan` opsional (string maks 500 karakter / null).
- **Kueri**: `INSERT INTO pengeluaran (judul, nominal, id_kategori, catatan) VALUES (?, ?, ?, ?)`.
- **Validasi backend**: bukan string → 400; > 500 karakter → 400.
- **Respons**: tetap `201 {id, judul, nominal}`; catatan terbaca via GET detail.
- **PUT tidak berubah** (hanya judul & nominal), sehingga pada form ubah
  kategori/tanggal/catatan ditampilkan sebagai kotak hanya-baca
  (memenuhi checkpoint sesi 3).
- **Pengujian**: POST ber-catatan via Postman → GET detail menampilkannya;
  POST catatan 501 karakter → 400; PUT tanpa catatan → catatan lama utuh.

## Dari Figma ke kode

Seluruh nilai visual aplikasi berasal dari `mobile-pengeluaran/src/theme.js`
hasil sampling prototype Figma (header & tombol `#FD9833`, hapus `#FF0004`,
fill kartu/input `#F3F3F3`, border `#B7B7B7`, grafik `#FE0C0C`, tinggi
input/tombol ±50 dp, bottom nav ±64 dp). Perubahan desain cukup dilakukan
pada satu berkas tersebut; pemetaan frame → layar dan keputusan desain
tercantum di laporan praktikum.

## Pengujian

Skenario T01–T13 (daftar, detail, tambah, validasi, ubah, batal hapus,
hapus, kosong, jaringan, database, persistensi, kategori null, aksi cepat)
dilaksanakan di perangkat Android dengan bukti tangkapan layar serta kueri
MySQL setelah restart; hasil lengkap tercantum pada laporan PDF.

## Kebersihan repositori & pengumpulan

- `node_modules/` dan `.env` tidak ikut ter-commit (`.gitignore`);
  yang masuk repo: `.env.example` dan `package-lock.json` kedua proyek.
- Kredensial MySQL hanya hidup di backend; frontend hanya mengetahui
  alamat API melalui `EXPO_PUBLIC_API_URL` (memang dimaksudkan masuk bundle).
- README ini memuat cara menjalankan kedua proyek sesuai syarat pengumpulan.

## Rujukan

- Ahmad Yusuf, *Modul 2A: Pengenalan Node.js, Express, dan MySQL* (revisi).
- Ahmad Yusuf, *Modul 2C: Praktikum React Native dan Backend* (2026).
- Dokumentasi Expo, React Native Networking, dan FlatList.
