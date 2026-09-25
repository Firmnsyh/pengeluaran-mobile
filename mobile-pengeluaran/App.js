import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, FlatList, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Polyline } from 'react-native-svg';
import { api } from './src/api';
import { rupiah, tanggalLokal, validate } from './src/helpers';
import { theme as t } from './src/theme';

const USER_INFO = { nama: 'Muhammad Yoga Firmansyah', nim: '09040625090', prodi: 'Sistem Informasi' };

function Tombol({ title, onPress, disabled = false, variant = 'primary', pill = false, style }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[variant === 'danger' ? s.btnDanger : s.btn, pill && s.pill,
        disabled && s.disabled, style]}>
      <Text style={s.btnText}>{title}</Text>
    </Pressable>
  );
}

function Header({ title, onBack }) {
  return (
    <View>
      <View style={s.header}>
        <Text style={s.headerTitle}>{title}</Text>
      </View>
      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack}
          style={s.backRow} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={t.colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Kerangka state layar tengah (gagal muat / kosong / tidak ditemukan / proses)
function Pusat({ icon, judul, pesan, children }) {
  return (
    <View style={s.center}>
      {icon}
      {!!judul && <Text style={s.centerTitle}>{judul}</Text>}
      {!!pesan && <Text style={s.centerMsg}>{pesan}</Text>}
      {children}
    </View>
  );
}

// Grafik garis sederhana: total pengeluaran per tanggal (bulan berjalan)
function Grafik({ items }) {
  const W = 300, H = t.sizes.chartH;
  const now = new Date();
  const perDay = {};
  items.forEach((i) => {
    const d = new Date(i.tanggal);
    if (Number.isNaN(d.getTime())) return;
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    const k = String(i.tanggal).slice(0, 10);
    perDay[k] = (perDay[k] || 0) + Number(i.nominal);
  });
  const keys = Object.keys(perDay).sort();
  let points;
  if (keys.length === 0) points = [[2, H - 4], [W - 2, H - 4]];
  else if (keys.length === 1) points = [[2, H / 2], [W - 2, H / 2]];
  else {
    const max = Math.max(...keys.map((k) => perDay[k]));
    points = keys.map((k, idx) => [
      2 + (idx / (keys.length - 1)) * (W - 4),
      H - 6 - (perDay[k] / max) * (H - 14),
    ]);
  }
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      accessibilityLabel="Grafik pengeluaran bulan ini">
      <Polyline points={points.map((p) => p.join(',')).join(' ')}
        fill="none" stroke={t.colors.chart} strokeWidth={2} />
    </Svg>
  );
}

function BottomNav({ active, onHome, onAdd, onProfile }) {
  return (
    <View style={s.nav}>
      <Pressable style={s.navItem} onPress={onHome} accessibilityRole="button"
        accessibilityLabel="Daftar pengeluaran">
        <Ionicons name={active === 'home' ? 'home' : 'home-outline'}
          size={24} color={t.colors.text} />
      </Pressable>
      <Pressable style={s.navAdd} onPress={onAdd} accessibilityRole="button"
        accessibilityLabel="Tambah pengeluaran">
        <Ionicons name="add" size={26} color={t.colors.onPrimary} />
      </Pressable>
      <Pressable style={s.navItem} onPress={onProfile} accessibilityRole="button"
        accessibilityLabel="Profil">
        <Ionicons name={active === 'profile' ? 'person' : 'person-outline'}
          size={24} color={t.colors.text} />
      </Pressable>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><Utama /></SafeAreaProvider>;
}

function Utama() {
  const [screen, setScreen] = useState('list');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('');
  const [error, setError] = useState('');
  const [judul, setJudul] = useState('');
  const [nominal, setNominal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [showKategori, setShowKategori] = useState(false);
  const lock = useRef(false);

  const disabled = loading || busy;
  const katNama = (id) => categories.find((c) => c.id === id)?.nama;
  const totalBulan = items.reduce((acc, i) => {
    const d = new Date(i.tanggal); const now = new Date();
    if (!Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth()
      && d.getFullYear() === now.getFullYear()) return acc + Number(i.nominal);
    return acc;
  }, 0);

  async function load() {
    if (lock.current) return;
    lock.current = true; setLoading(true); setError('');
    try {
      const rows = await api.list();
      if (!Array.isArray(rows)) throw new Error('Daftar harus berupa array');
      setItems(rows);
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function back() {
    if (lock.current) return;
    setError('');
    if (screen === 'edit') setScreen('detail');
    else setScreen('list');
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'list' && !lock.current) return false;
      back(); return true;
    });
    return () => sub.remove();
  }, [screen]);

  async function openDetail(id) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setBusyLabel('Memuat...'); setError('');
    try {
      setSelected(await api.detail(id)); setScreen('detail');
    } catch (e) {
      if (e.status === 404) { setSelected(null); setScreen('notfound'); }
      else setError(e.message);
    }
    finally { lock.current = false; setBusy(false); setBusyLabel(''); }
  }

  async function openCreate() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setBusyLabel('Memuat...'); setError('');
    try {
      const rows = await api.categories();
      if (!Array.isArray(rows)) throw new Error('Kategori harus berupa array');
      setCategories(rows); setJudul(''); setNominal(''); setCatatan('');
      setCategoryId(null); setShowKategori(false); setScreen('create');
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); setBusyLabel(''); }
  }

  async function openEdit() {
    setJudul(selected.judul); setNominal(String(selected.nominal));
    setCatatan(selected.catatan || '');
    setError(''); setScreen('edit');
    // kategori hanya untuk tampilan nama (read-only) di form ubah
    try { setCategories(await api.categories()); } catch { /* tetap tampilkan id */ }
  }

  async function save() {
    if (lock.current) return;
    const pesan = validate(judul, nominal);
    if (pesan) { setError(pesan); return; }
    lock.current = true; setBusy(true); setBusyLabel('Menyimpan...'); setError('');
    let saved = false;
    try {
      const body = { judul: judul.trim(), nominal: Number(nominal) };
      if (screen === 'create') {
        // pengembangan opsional terdokumentasi: POST menerima catatan opsional
        await api.create({ ...body, id_kategori: categoryId,
          catatan: catatan.trim() ? catatan.trim() : null });
      } else {
        await api.update(selected.id, body); // kontrak: hanya judul & nominal
      }
      saved = true;
      // Respons tulis tidak lengkap; baca ulang daftar dari server.
      setItems([]); setScreen('list'); setSelected(null);
      const rows = await api.list();
      if (!Array.isArray(rows)) throw new Error('Daftar harus berupa array');
      setItems(rows);
    } catch (e) {
      setError(saved ? `Data tersimpan. Muat ulang daftar: ${e.message}`
        : `${e.message}. Jika koneksi putus, cek daftar sebelum mengulang.`);
    } finally { lock.current = false; setBusy(false); setBusyLabel(''); }
  }

  async function remove() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setBusyLabel('Menghapus...'); setError('');
    let deleted = false;
    try {
      await api.remove(selected.id); deleted = true;
      setItems([]); setSelected(null); setScreen('list');
      const rows = await api.list();
      if (!Array.isArray(rows)) throw new Error('Daftar harus berupa array');
      setItems(rows);
    } catch (e) {
      setError(deleted ? `Data terhapus. Muat ulang daftar: ${e.message}`
        : e.message);
    } finally { lock.current = false; setBusy(false); setBusyLabel(''); }
  }

  function confirmDelete() {
    Alert.alert('Hapus pengeluaran', `Hapus ${selected.judul}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: remove },
    ]);
  }

  const titles = { list: 'Daftar Pengeluaran', create: 'Tambah Pengeluaran',
    detail: 'Detail Pengeluaran', edit: 'Ubah Pengeluaran',
    notfound: 'Detail Pengeluaran', profile: 'Profil' };

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Header title={titles[screen]}
          onBack={['list', 'profile'].includes(screen) ? null : back} />

        {/* ---------------- LAYAR DAFTAR ---------------- */}
        {screen === 'list' && <View style={s.flex}>
          {error && items.length === 0 ? (
            <Pusat judul="Gagal Memuat Data" pesan={error}
              icon={<Ionicons name="server-outline" size={54} color={t.colors.text} />}>
              <Tombol pill title="Coba Lagi" onPress={load} disabled={disabled}
                style={s.centerBtn} />
            </Pusat>
          ) : loading && items.length === 0 ? (
            <Pusat judul="Memuat..."
              icon={<ActivityIndicator size="large" color={t.colors.primary} />} />
          ) : !loading && !busy && items.length === 0 ? (
            <Pusat judul="Belum ada pengeluaran"
              pesan="Tekan tombol + untuk mencatat pengeluaran pertama anda"
              icon={<Ionicons name="wallet-outline" size={54} color={t.colors.text} />} />
          ) : (
            <View style={s.flex}>
              <ScrollView contentContainerStyle={s.listWrap}
                refreshing={loading} onRefresh={load}>
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Total Pengeluaran Bulan ini</Text>
                  <Text style={s.summaryValue}>{rupiah(totalBulan)}</Text>
                  <Grafik items={items} />
                </View>
                <View style={s.riwayatRow}>
                  <View style={s.flex}>
                    <Text style={s.riwayatTitle}>Riwayat Pengeluaran</Text>
                    <Text style={s.riwayatSub}>Hari ini</Text>
                  </View>
                  <Pressable style={s.refreshBtn} onPress={load} disabled={disabled}
                    accessibilityRole="button" accessibilityLabel="Muat ulang">
                    <Ionicons name="refresh" size={18} color={t.colors.onPrimary} />
                  </Pressable>
                </View>
                {!!error && items.length > 0 &&
                  <Text style={s.error}>{error}</Text>}
                {items.map((item) => (
                  <Pressable key={String(item.id)} style={s.card}
                    accessibilityRole="button" disabled={disabled}
                    onPress={() => openDetail(item.id)}>
                    <View style={s.cardRow}>
                      <View style={s.flex}>
                        <Text style={s.cardTitle}>{item.judul}</Text>
                        <Text style={s.cardSub}>{tanggalLokal(item.tanggal)}</Text>
                        <Text style={s.cardSub}>{item.kategori || 'Tanpa kategori'}</Text>
                      </View>
                      <Text style={s.cardAmount}>{rupiah(item.nominal)}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          <BottomNav active="home"
            onHome={() => { setError(''); }}
            onAdd={openCreate}
            onProfile={() => setScreen('profile')} />
        </View>}

        {/* ---------------- LAYAR DETAIL ---------------- */}
        {screen === 'detail' && selected && <ScrollView
          contentContainerStyle={s.bodyScroll}>
          <View style={s.detailCard}>
            <Text style={s.cardTitle}>{selected.judul}</Text>
            <Text style={s.detailText}>{rupiah(selected.nominal)}</Text>
            <Text style={s.detailText}>Tanggal {tanggalLokal(selected.tanggal)}</Text>
            <Text style={s.detailText}>ID kategori {selected.id_kategori ?? '-'}</Text>
            <Text style={s.cardTitle}>Catatan</Text>
            <Text style={s.detailText}>{selected.catatan || 'Belum ada catatan'}</Text>
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
          <View style={s.actionRow}>
            <Tombol title="Ubah" onPress={openEdit} disabled={disabled} style={s.flex1} />
            <Tombol title="Hapus" variant="danger" onPress={confirmDelete}
              disabled={disabled} style={s.flex1} />
          </View>
        </ScrollView>}

        {/* ---------------- STATE: DATA TIDAK DITEMUKAN ---------------- */}
        {screen === 'notfound' && <Pusat
          judul="Data Tidak Ditemukan" pesan="Data yang anda cari tidak ditemukan"
          icon={<Ionicons name="close-circle-outline" size={64} color={t.colors.danger} />}>
          <Tombol pill title="Kembali ke daftar" style={s.centerBtn}
            onPress={() => { setError(''); setScreen('list'); load(); }} />
        </Pusat>}

        {/* ---------------- LAYAR PROFIL ---------------- */}
        {screen === 'profile' && <View style={s.flex}>
          <ScrollView contentContainerStyle={s.bodyScroll}>
            <View style={s.detailCard}>
              <Text style={s.cardTitle}>{USER_INFO.nama}</Text>
              <Text style={s.detailText}>NIM: {USER_INFO.nim}</Text>
              <Text style={s.detailText}>Prodi: {USER_INFO.prodi}</Text>
              <Text style={s.detailText}>Aplikasi Pencatatan Pengeluaran</Text>
            </View>
          </ScrollView>
          <BottomNav active="profile"
            onHome={() => setScreen('list')}
            onAdd={openCreate}
            onProfile={() => {}} />
        </View>}

        {/* ---------------- LAYAR FORM TAMBAH / UBAH ---------------- */}
        {(screen === 'create' || screen === 'edit') && (
          busy && busyLabel ? (
            <Pusat judul={busyLabel}
              icon={<ActivityIndicator size="large" color={t.colors.primary} />} />
          ) : (
            <ScrollView style={s.flex} contentContainerStyle={s.bodyScroll}
              keyboardShouldPersistTaps="handled">
              <Text style={s.label}>Judul</Text>
              <TextInput style={s.input} value={judul} onChangeText={setJudul}
                accessibilityLabel="Judul" editable={!busy} maxLength={100}
                placeholder="Contoh: Makan Malam" />
              <Text style={s.label}>Jumlah</Text>
              <TextInput style={s.input} value={nominal}
                onChangeText={setNominal} keyboardType="number-pad"
                accessibilityLabel="Jumlah" editable={!busy}
                placeholder="Contoh: 55000" />
              <Text style={s.label}>Kategori ( Opsional )</Text>
              {screen === 'create' ? <>
                <Pressable style={s.input} accessibilityRole="button"
                  onPress={() => setShowKategori((v) => !v)}>
                  <View style={s.dropRow}>
                    <Text style={s.dropText}>{katNama(categoryId) || 'Pilih Kategori'}</Text>
                    <Ionicons name={showKategori ? 'chevron-up' : 'chevron-down'}
                      size={18} color={t.colors.text} />
                  </View>
                </Pressable>
                {showKategori && <View style={s.dropPanel}>
                  <Text style={s.dropPanelTitle}>Pilih Kategori</Text>
                  {[{ id: null, nama: 'Tanpa Kategori' }, ...categories].map((k) => (
                    <Pressable key={String(k.id)} style={s.dropItem}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: categoryId === k.id }}
                      onPress={() => { setCategoryId(k.id); setShowKategori(false); }}>
                      <Text style={s.dropItemText}>{k.nama}</Text>
                      <Ionicons name={categoryId === k.id
                        ? 'radio-button-on' : 'radio-button-off'} size={20}
                        color={categoryId === k.id ? t.colors.primary : t.colors.text} />
                    </Pressable>
                  ))}
                </View>}
                <Text style={s.label}>Tanggal & Waktu</Text>
                <View style={[s.input, s.readOnly]}>
                  <Text style={s.readOnlyText}>Otomatis dari server</Text>
                </View>
                <Text style={s.label}>Tambah Catatan</Text>
                <Text style={s.labelSub}>Opsional</Text>
                <TextInput style={[s.input, s.textarea]} value={catatan}
                  onChangeText={setCatatan} multiline editable={!busy}
                  accessibilityLabel="Tambah Catatan" />
              </> : <>
                <View style={[s.input, s.readOnly]}>
                  <Text style={s.readOnlyText}>
                    {katNama(selected?.id_kategori ?? null)
                      || `ID kategori ${selected?.id_kategori ?? '-'}`}
                  </Text>
                </View>
                <Text style={s.label}>Tanggal & Waktu</Text>
                <View style={[s.input, s.readOnly]}>
                  <Text style={s.readOnlyText}>Otomatis dari server</Text>
                </View>
                <Text style={s.label}>Catatan</Text>
                <View style={[s.input, s.readOnly, s.textarea]}>
                  <Text style={s.readOnlyText}>{catatan || 'Belum ada catatan'}</Text>
                </View>
                <Text style={s.labelSub}>Kategori, tanggal, dan catatan hanya dibaca;
                  {' '}API ubah hanya menerima judul dan nominal.</Text>
              </>}
              {!!error && <Text style={s.error}>{error}</Text>}
              <Tombol title="Simpan" onPress={save} disabled={disabled}
                style={s.saveBtn} />
            </ScrollView>
          )
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------- Gaya tampilan (seluruhnya dari theme.js) ----------------
const s = StyleSheet.create({
  flex: { flex: 1 },
  flex1: { flex: 1 },
  page: { flex: 1, backgroundColor: t.colors.background },
  header: { height: t.spacing.headerH, backgroundColor: t.colors.primary,
    justifyContent: 'center', paddingHorizontal: t.spacing.headerPadH },
  headerTitle: { color: t.colors.onPrimary,
    fontSize: t.typography.headerSize, fontWeight: t.typography.headerWeight },
  backRow: { alignSelf: 'flex-end', padding: 10, marginTop: 2 },
  bodyScroll: { padding: t.spacing.pageH, paddingTop: t.spacing.sectionTop,
    paddingBottom: 32 },
  listWrap: { padding: t.spacing.pageH, paddingTop: t.spacing.sectionTop,
    paddingBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: t.spacing.centerGap },
  centerTitle: { fontSize: t.typography.centerTitleSize,
    fontWeight: t.typography.centerTitleWeight, color: t.colors.text,
    textAlign: 'center' },
  centerMsg: { fontSize: t.typography.centerMsgSize,
    color: t.colors.textSecondary, textAlign: 'center' },
  centerBtn: { marginTop: 8, paddingHorizontal: 24 },
  summaryCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.summary,
    borderWidth: 1, borderColor: t.colors.text, padding: 12, gap: 4 },
  summaryLabel: { fontSize: t.typography.bodySize, color: t.colors.text },
  summaryValue: { fontSize: t.typography.totalSize,
    fontWeight: t.typography.totalWeight, color: t.colors.text },
  riwayatRow: { flexDirection: 'row', alignItems: 'center',
    marginTop: t.spacing.sectionTop, marginBottom: t.spacing.cardGap },
  riwayatTitle: { fontSize: t.typography.titleSize,
    fontWeight: t.typography.titleWeight, color: t.colors.text },
  riwayatSub: { fontSize: t.typography.subSize, color: t.colors.textSecondary },
  refreshBtn: { width: t.sizes.refresh, height: t.sizes.refresh,
    borderRadius: t.sizes.refresh / 2, backgroundColor: t.colors.primary,
    alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: t.colors.fill, borderRadius: t.radius.card,
    borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.cardPad,
    marginTop: t.spacing.cardGap },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: t.typography.titleSize,
    fontWeight: t.typography.titleWeight, color: t.colors.text },
  cardSub: { fontSize: t.typography.subSize, color: t.colors.text,
    marginTop: 2 },
  cardAmount: { fontSize: t.typography.bodySize,
    fontWeight: t.typography.titleWeight, color: t.colors.text },
  detailCard: { backgroundColor: t.colors.fill, borderRadius: t.radius.card,
    padding: t.spacing.detailPad, gap: t.spacing.detailGap },
  detailText: { fontSize: t.typography.bodySize, color: t.colors.text },
  actionRow: { flexDirection: 'row', gap: t.spacing.actionGap,
    marginTop: t.spacing.sectionTop },
  btn: { backgroundColor: t.colors.primary, minHeight: t.sizes.buttonH,
    borderRadius: t.radius.button, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16 },
  btnDanger: { backgroundColor: t.colors.danger, minHeight: t.sizes.buttonH,
    borderRadius: t.radius.button, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16 },
  btnText: { color: t.colors.onPrimary, fontSize: t.typography.buttonSize,
    fontWeight: t.typography.buttonWeight },
  pill: { borderRadius: t.radius.pill, minHeight: 34 },
  disabled: { opacity: 0.5 },
  label: { fontSize: t.typography.titleSize,
    fontWeight: t.typography.titleWeight, color: t.colors.text,
    marginTop: t.spacing.fieldGap, marginBottom: t.spacing.labelBottom },
  labelSub: { fontSize: t.typography.subSize, color: t.colors.textSecondary,
    marginBottom: t.spacing.labelBottom },
  input: { backgroundColor: t.colors.fill, borderRadius: t.radius.input,
    minHeight: t.sizes.inputH, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: t.typography.bodySize, color: t.colors.text,
    justifyContent: 'center' },
  readOnly: {},
  readOnlyText: { fontSize: t.typography.bodySize, color: t.colors.text },
  textarea: { minHeight: t.sizes.textareaH, borderRadius: t.radius.textarea,
    textAlignVertical: 'top' },
  dropRow: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between' },
  dropText: { fontSize: t.typography.bodySize, color: t.colors.text },
  dropPanel: { backgroundColor: t.colors.surface, borderRadius: t.radius.panel,
    borderWidth: 1, borderColor: t.colors.borderSoft, marginTop: 6,
    paddingVertical: 4 },
  dropPanelTitle: { fontSize: t.typography.titleSize,
    fontWeight: t.typography.titleWeight, color: t.colors.text,
    paddingHorizontal: 14, paddingVertical: 10 },
  dropItem: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  dropItemText: { fontSize: t.typography.titleSize,
    fontWeight: t.typography.titleWeight, color: t.colors.text },
  saveBtn: { width: t.sizes.saveW, alignSelf: 'center',
    marginTop: t.spacing.sectionTop + 8 },
  error: { color: t.colors.danger, marginTop: t.spacing.fieldGap,
    fontSize: t.typography.bodySize },
  nav: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', height: t.spacing.navH,
    backgroundColor: t.colors.background, borderRadius: t.radius.nav,
    borderWidth: 1, borderColor: t.colors.borderSoft,
    marginHorizontal: t.spacing.navMarginH, marginBottom: t.spacing.navMarginB },
  navItem: { padding: 8 },
  navAdd: { width: t.sizes.navAdd, height: t.sizes.navAdd,
    borderRadius: t.sizes.navAdd / 2, backgroundColor: t.colors.primary,
    alignItems: 'center', justifyContent: 'center' },
});
