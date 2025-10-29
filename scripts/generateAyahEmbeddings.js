// scripts/generateAyahEmbeddings.js

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const prisma = new PrismaClient();
const LOCAL_EMBEDDING_API = "http://localhost:5000/embedding";
const BATCH_SIZE = 50;

async function getEmbedding(text) {
  const response = await fetch(LOCAL_EMBEDDING_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${errorText}`);
  }

  const data = await response.json();
  return data.embedding;
}

async function main() {
  let offset = 0;
  let totalProcessed = 0;

  while (true) {
    const ayahs = await prisma.ayah.findMany({
      skip: offset,
      take: BATCH_SIZE,
      select: {
        id: true,
        arabicText: true,
        embedding: true,
      },
    });

    const filteredAyahs = ayahs.filter(
      (ayah) => !ayah.embedding || ayah.embedding.length === 0
    );

    if (filteredAyahs.length === 0) break;

    for (const ayah of filteredAyahs) {
      try {
        const embedding = await getEmbedding(ayah.arabicText);
        await prisma.ayah.update({
          where: { id: ayah.id },
          data: { embedding },
        });
        console.log(`✅ Embedded Ayah ${ayah.id}`);
      } catch (e) {
        console.error(`❌ Failed embedding for Ayah ${ayah.id}:`, e.message);
      }
      totalProcessed++;
    }

    offset += ayahs.length;
    console.log(`Processed batch, total processed: ${totalProcessed}`);
  }

  console.log("🎉 Embedding generation complete!");
}

main()
  .catch((e) => {
    console.error("❌ Script failed:", e);
  })
  .finally(() => prisma.$disconnect());
