
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\admin_artdecon\\xtein-web-2.0\\src\\app\\shared\\classes\\tabs.class.ts', 'utf8');

const regex = /new Tab\(.*?,.*?,.*?, '(.*?)'/g;
let match;
const ids = [];
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('//')) return; // Ignore commented lines
    const m = /new Tab\(.*?,.*?,.*?, '(.*?)'/.exec(line);
    if (m) {
        ids.push({ id: m[1], line: index + 1 });
    }
});

const seen = new Map();
const duplicates = [];

for (const item of ids) {
    if (seen.has(item.id)) {
        duplicates.push({ id: item.id, lines: [seen.get(item.id), item.line] });
    } else {
        seen.set(item.id, item.line);
    }
}

console.log(JSON.stringify(duplicates, null, 2));
