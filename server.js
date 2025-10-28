import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to NoorAi Backend!');
});
app.get('/surahs', async (req, res) => {
  try {
    const surahs = await prisma.surah.findMany();
    res.json(surahs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});