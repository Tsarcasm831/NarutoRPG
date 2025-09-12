import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('src/components/json/anime_flat.json');
const outputDir = path.resolve('src/components/json/anime');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const raw = fs.readFileSync(inputPath, 'utf-8');
const data = JSON.parse(raw);
const items = data.items || [];

// Normalize and group items by first letter
const groups = {};
for (const item of items) {
  let letter = item.trim().charAt(0).normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
  if (!letter || !/^[A-Z0-9]$/.test(letter)) {
    letter = 'misc';
  }
  if (!groups[letter]) groups[letter] = [];
  groups[letter].push(item);
}

for (const [letter, list] of Object.entries(groups)) {
  const outPath = path.join(outputDir, `${letter}.json`);
  const json = {
    meta: {
      letter,
      count: list.length
    },
    items: list
  };
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
}

// generate index.js to aggregate all letters
const letters = Object.keys(groups).sort();
const imports = letters.map(l => `import ${l} from './${l}.json' assert { type: 'json' };`).join('\n');
const mapping = letters.map(l => `  ${l}: ${l}.items`).join(',\n');
const indexJs = `${imports}\n\nexport const animeByLetter = {\n${mapping}\n};\n\nexport const allAnime = Object.values(animeByLetter).flat();\n`;
fs.writeFileSync(path.join(outputDir, 'index.js'), indexJs);

console.log(`Wrote ${letters.length} files to ${outputDir}`);
