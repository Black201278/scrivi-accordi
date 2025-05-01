// generate-chords.cjs
const fs              = require("fs");
const path            = require("path");
const React           = require("react");
const ReactDOMServer  = require("react-dom/server");
const { guitar: chordsDB } = require("@tombatossals/chords-db");
const Chord           = require("@tombatossals/react-chords").default;
const archiver        = require("archiver");

// 12 radici e 7 suffissi compatibili con chords-db
const ROOTS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const SUFFS = ["","m","7","maj7","m7","sus4","dim"];

// Cartella di output
const OUT_DIR = path.resolve(__dirname, "chord-svgs", "guitar");
fs.mkdirSync(OUT_DIR, { recursive: true });

console.log("🔧 Generating guitar chord SVGs…");
ROOTS.forEach(root => {
  SUFFS.forEach(suf => {
    const name = root + suf;          // es. "C", "Cm", "C7", "Cmaj7", …
    const entries = chordsDB[name];   // prendi il database
    if (!entries || entries.length === 0) {
      console.warn(`⚠️  Chord not found: ${name}`);
      return;
    }
    const chordData = entries[0];     // usa la prima posizione
    // SSR: genera SVG
    const svg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Chord, { chord: chordData, lite: false })
    );
    // Salvalo
    fs.writeFileSync(path.join(OUT_DIR, `${name}.svg`), svg, "utf8");
    console.log(`  ✔︎ ${name}.svg`);
  });
});

// Crea lo ZIP
const zipPath = path.resolve(__dirname, "chords-guitar.zip");
const output  = fs.createWriteStream(zipPath);
const archive = archiver("zip");

output.on("close", () => {
  console.log(`🎉 ZIP creato: ${zipPath} (${archive.pointer()} bytes)`);
});

archive.pipe(output);
archive.directory(OUT_DIR, false);
archive.finalize();
