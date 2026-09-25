export const theme = {
  colors: {
    primary: '#FD9833',        // header, tombol utama, ikon +, radio terpilih
    onPrimary: '#FFFFFF',      // teks di atas oranye
    danger: '#FF0004',         // tombol Hapus, ikon tidak ditemukan
    onDanger: '#FFFFFF',
    background: '#FFFFFF',     // latar halaman & bottom nav
    fill: '#F3F3F3',           // fill input, kartu daftar, kartu detail
    surface: '#FFFFFF',        // kartu ringkasan, panel dropdown
    border: '#B7B7B7',         // garis tepi kartu daftar/detail
    borderSoft: '#BFBFBF',     // garis tepi bottom nav & panel dropdown
    text: '#000000',           // teks utama & ikon
    textSecondary: '#999999',  // teks kecil "Opsional", "Hari ini"
    chart: '#FE0C0C',          // garis grafik pengeluaran
  },

  typography: {
    headerSize: 15, headerWeight: '700',     // judul di header oranye
    titleSize: 14, titleWeight: '700',       // judul kartu / label bold
    bodySize: 12,                            // teks isi kartu & detail
    subSize: 11,                             // teks kecil abu-abu
    totalSize: 20, totalWeight: '700',       // angka total bulanan
    buttonSize: 14, buttonWeight: '700',     // teks tombol
    centerTitleSize: 14, centerTitleWeight: '700', // judul state layar
    centerMsgSize: 11,                       // pesan state layar
  },

  spacing: {
    pageH: 20,          // padding kiri-kanan halaman
    headerH: 72,        // tinggi header oranye
    headerPadH: 16,
    sectionTop: 20,     // jarak header -> kartu ringkasan
    cardPad: 12,        // padding kartu daftar
    cardGap: 6,         // jarak antar kartu daftar
    fieldGap: 14,       // jarak antar field form
    labelBottom: 6,     // jarak label -> input
    detailPad: 16,      // padding kartu detail
    detailGap: 8,       // jarak antar baris detail
    actionGap: 16,      // jarak tombol Ubah <-> Hapus
    navH: 64,           // tinggi bottom nav
    navMarginH: 12,
    navMarginB: 8,
    centerGap: 10,      // jarak elemen state layar tengah
  },

  radius: {
    card: 6,            // kartu daftar & detail
    summary: 10,        // kartu ringkasan total
    input: 16,          // input & dropdown (ujung sangat membulat)
    textarea: 12,
    button: 18,         // tombol Simpan/Ubah/Hapus
    pill: 999,          // tombol Coba Lagi / Kembali ke daftar
    nav: 16,            // bottom nav
    panel: 6,           // panel dropdown kategori
  },

  sizes: {
    inputH: 50,
    buttonH: 50,
    textareaH: 80,
    saveW: 200,         // lebar tombol Simpan
    refresh: 40,        // tombol refresh bulat
    navAdd: 40,         // tombol + bulat di nav
    chartH: 56,         // tinggi area grafik
  },
};
