import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const __dirname = path.resolve();
const languages = ["en", "ar", "ur"];

async function main() {
  const sourcePath = path.join(__dirname, "source");
  const surahMetaPath = path.join(sourcePath, "surah.json");
  const surahFolderPath = path.join(sourcePath, "surah");
  const audioFolderPath = path.join(sourcePath, "audio");

  const surahMeta = JSON.parse(await fs.readFile(surahMetaPath, "utf-8"));

  console.log("\n📖 Starting Quran Data Import...\n");

  for (const surah of surahMeta) {
    console.log(
      `\n➡️  Importing Surah ${surah.index}: ${surah.title} [${surah.titleAr}]`
    );

    const createdSurah = await prisma.surah.create({
      data: {
        number: parseInt(surah.index, 10),
        name: surah.titleAr,
        englishName: surah.title,
        totalAyah: surah.count || 0,
      },
    });

    const ayahsPath = path.join(
      surahFolderPath,
      `surah_${Number(surah.index)}.json`
    );
    const surahDataRaw = JSON.parse(await fs.readFile(ayahsPath, "utf-8"));
    const ayahArabicObject = surahDataRaw.verse;

    const translationObjects = {};
    for (const lang of languages) {
      const translationFolderPath = path.join(sourcePath, "translation", lang);
      const translationPath = path.join(
        translationFolderPath,
        `${lang}_translation_${Number(surah.index)}.json`
      );
      try {
        const raw = JSON.parse(await fs.readFile(translationPath, "utf-8"));
        translationObjects[lang] = raw.verse || {};
        console.log(`  🌐 Loaded ${lang.toUpperCase()} translation`);
      } catch (e) {
        console.warn(
          `  ⚠️  Translation missing for [${lang}] on Surah ${surah.index}`
        );
        translationObjects[lang] = {};
      }
    }

    const surahAudioFolder = String(surah.index).padStart(3, "0");
    let versesProcessed = 0;

    for (const [verseKey, arabicText] of Object.entries(ayahArabicObject)) {
      const match = verseKey.match(/^verse_(\d+)$/);
      const numberInSurah = match ? parseInt(match[1], 10) : null;
      if (!numberInSurah) continue;

      const audioFileName = `${numberInSurah.toString().padStart(3, "0")}.mp3`;
      const audioPath = `audio/${surahAudioFolder}/${audioFileName}`;
      const audioAbsPath = path.join(
        audioFolderPath,
        surahAudioFolder,
        audioFileName
      );

      // let audioUrlDb = null;
      console.log("Checking audio path:", audioAbsPath);
      const audioUrlDb = audioPath;

      try {
        await fs.access(audioAbsPath);
        //  const  audioUrlDb = audioPath;
        console.log("Audio FOUND:", audioPath);
      } catch {
        console.log("Audio NOT FOUND:", audioAbsPath);
      }

      const createdAyah = await prisma.ayah.create({
        data: {
          surahId: createdSurah.id,
          numberInSurah,
          arabicText,
          audioUrl: audioUrlDb, // Store only if exists (otherwise null)
        },
      });

      if (numberInSurah % 10 === 0) process.stdout.write("•");
      for (const lang of languages) {
        const translationText = translationObjects[lang][verseKey];
        if (translationText) {
          await prisma.translation.create({
            data: {
              ayahId: createdAyah.id,
              language: lang,
              text: translationText,
            },
          });
        }
      }
      versesProcessed++;
    }
    console.log(
      `\n✅ Surah ${surah.index} completed! ${versesProcessed} ayat imported with audio.`
    );
  }
}

main()
  .then(() =>
    console.log(
      "\n🎉 All Quran data, translations, and audio imported successfully!\n"
    )
  )
  .catch((e) => console.error("❌ Error during processing:", e))
  .finally(() => prisma.$disconnect());
