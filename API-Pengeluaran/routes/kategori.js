import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// 1. GET ALL KATEGORI
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kategori ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: 'Gagal mengambil data kategori' });
  }
});

// 2. GET KATEGORI BY ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM kategori WHERE id = ?', 
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Kategori tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: 'Gagal mengambil data kategori' });
  }
});

// 3. POST / TAMBAH KATEGORI
router.post('/', async (req, res) => {
  const { nama } = req.body;

  if (!nama) {
    return res.status(400).json({ pesan: 'Nama kategori wajib diisi' });
  }

  try {
    const [hasil] = await pool.query(
      'INSERT INTO kategori (nama) VALUES (?)',
      [nama]
    );

    res.status(201).json({ 
      id: hasil.insertId, 
      nama 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: 'Gagal menyimpan kategori' });
  }
});

// 4. PUT / UBAH KATEGORI
router.put('/:id', async (req, res) => {
  const { nama } = req.body;

  if (!nama) {
    return res.status(400).json({ pesan: 'Nama kategori wajib diisi' });
  }

  try {
    const [hasil] = await pool.query(
      'UPDATE kategori SET nama = ? WHERE id = ?',
      [nama, req.params.id]
    );

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ pesan: 'Kategori tidak ditemukan' });
    }

    res.json({ id: Number(req.params.id), nama });
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: 'Gagal memperbarui kategori' });
  }
});

// 5. DELETE / HAPUS KATEGORI
router.delete('/:id', async (req, res) => {
  try {
    const [hasil] = await pool.query(
      'DELETE FROM kategori WHERE id = ?',
      [req.params.id]
    );

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ pesan: 'Kategori tidak ditemukan' });
    }

    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ pesan: 'Gagal menghapus kategori' });
  }
});

export default router;