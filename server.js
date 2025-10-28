import expess from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = expess();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(expess.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to NoorAi Backend!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});