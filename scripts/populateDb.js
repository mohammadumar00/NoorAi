const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // Load surahs JSON
  const surahsData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'surahs.json'), 'utf-8'));

  for (const surah of surahsData) {
    // Insert surah
    const createdSurah = await prisma.surah.create({
      data: {
        number: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        totalAyah: surah.ayahs.length,
      },
    });

    // Insert ayahs
    for (const ayah of surah.ayahs) {
      const createdAyah = await prisma.ayah.create({
        data: {
          surahId: createdSurah.id,
          numberInSurah: ayah.number,
          arabicText: ayah.text,
        },
      });

      // Insert translations
      for (const translation of ayah.translations) {
        await prisma.translation.create({
          data: {
            ayahId: createdAyah.id,
            language: translation.language,
            text: translation.text,
          },
        });
      }

      // Insert tafsir if available
      if (ayah.tafsir) {
        await prisma.tafsir.create({
          data: {
            ayahId: createdAyah.id,
            text: ayah.tafsir.text,
            source: ayah.tafsir.source,
          },
        });
      }
    }
  }
}

main()
  .then(() => {
    console.log('Database populated with Quran data');
  })
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
