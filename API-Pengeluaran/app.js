import express from 'express';
import cors from 'cors';
import pengeluaranRoutes from './routes/pengeluaran.js';
import kategoriRoutes from './routes/kategori.js';

const app = express();

app.use(cors());
app.use(express.json());

// Semua endpoint pengeluaran akan diawali dengan /pengeluaran
app.use('/pengeluaran', pengeluaranRoutes);
app.use('/kategori', kategoriRoutes);

export default app;