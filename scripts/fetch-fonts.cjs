const fs = require('fs');
const https = require('https');
const path = require('path');

const raw = fs.readFileSync('gfonts.css', 'utf8');
const outDir = path.join('public', 'fonts');
fs.mkdirSync(outDir, { recursive: true });

const keptSubsets = new Set(['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext']);
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
const blocks = [];
let m;
while ((m = re.exec(raw)) !== null) {
    blocks.push({ subset: m[1], css: m[2] });
}

const download = (url, dest) => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
            return download(res.headers.location, dest).then(resolve, reject);
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => { fs.unlink(dest, () => { }); reject(err); });
});

(async () => {
    const out = [];
    for (const b of blocks) {
        if (!keptSubsets.has(b.subset)) continue;
        const family = (b.css.match(/font-family:\s*'([^']+)'/) || [])[1];
        const weight = (b.css.match(/font-weight:\s*(\d+)/) || [])[1];
        const style = (b.css.match(/font-style:\s*(\w+)/) || [])[1];
        const url = (b.css.match(/url\(([^)]+)\)/) || [])[1];
        const unicode = (b.css.match(/unicode-range:\s*([^;]+);/) || [])[1];
        if (!url) continue;

        const slug = family.toLowerCase().replace(/\s+/g, '-');
        const filename = `${slug}-${weight}${style === 'italic' ? 'i' : ''}-${b.subset}.woff2`;
        const dest = path.join(outDir, filename);
        if (!fs.existsSync(dest)) {
            console.log('fetch', filename);
            await download(url, dest);
        }
        out.push(`@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url('/fonts/${filename}') format('woff2');unicode-range:${unicode};}`);
    }
    fs.writeFileSync(path.join('public', 'fonts', 'fonts.css'), out.join('\n'));
    console.log('wrote', out.length, 'rules');
})();
