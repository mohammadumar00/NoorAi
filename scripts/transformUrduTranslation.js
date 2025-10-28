import fs from 'fs/promises';
import path from 'path';

const __dirname = path.resolve();

async function main() {
  const inputPath = path.join(__dirname, 'source', 'translation', 'ur', 'ur.json');
  const outputDir = path.join(__dirname, 'source', 'translation', 'ur');

  const urduRaw = JSON.parse(await fs.readFile(inputPath, 'utf-8'));

  for (const [chapterNum, versesArr] of Object.entries(urduRaw)) {
    const verseObj = {};
    for (const verse of versesArr) {
      verseObj[`verse_${verse.verse}`] = verse.text;
    }

    // Build per-surah output matching your standard format
    const output = {
      index: chapterNum.padStart(3, '0'),
      name: "", // Optionally add surah name from another source if desired
      verse: verseObj,
      count: versesArr.length
    };

    // Save file as ur_translation_{index}.json
    const outputPath = path.join(outputDir, `ur_translation_${Number(chapterNum)}.json`);
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`Written Urdu translation for surah ${chapterNum}: ${outputPath}`);
  }
}

main();
