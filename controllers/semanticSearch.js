// routes/semanticSearch.js or controllers/semanticSearch.js

import express from 'express';
import prisma from '../prisma/client'; // your initialized Prisma Client
import fetch from 'node-fetch';

const router = express.Router();

const LOCAL_EMBEDDING_API = "http://localhost:5000/embedding";

router.post('/search/semantic', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    // Step 1: Get query embedding from local Python embedding service
    const embeddingResponse = await fetch(LOCAL_EMBEDDING_API, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      return res.status(500).json({ error: `Embedding API error: ${errorText}` });
    }

    const { embedding } = await embeddingResponse.json();

    // Step 2: Search nearest ayahs using pgvector similarity operator <=> (Euclidean distance)
    // Adjust the raw query if you want cosine similarity instead, see pgvector docs
    const ayahs = await prisma.$queryRaw`
      SELECT 
        "id", "surahId", "numberInSurah", "arabicText", "embedding", 
        ("embedding" <=> ${embedding}) AS distance 
      FROM "Ayah"
      ORDER BY distance ASC
      LIMIT 5;
    `;

    // Optional: Fetch translations and tafsir for matched ayahs using separate queries or joined query

    res.json({ results: ayahs });
  } catch (error) {
    console.error("Semantic search error:", error);
    res.status(500).json({ error: "Failed semantic search" });
  }
});

export default router;
