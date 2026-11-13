// Draws the Clarity app icon as 32x32 pixel art and writes it scaled up to build/icon.png (512x512).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const N = 32, SCALE = 16, SIZE = N * SCALE;
const px = Array.from({ length: N }, () => Array(N).fill(null));
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px[y][x] = typeof c === 'function' ? c(x, y) : hex(c); };

// Window body with a classic bevel
rect(1, 2, 30, 29, '#d4d0c8');
rect(1, 2, 30, 2, '#ffffff'); rect(1, 2, 1, 29, '#ffffff');
rect(1, 29, 30, 29, '#404040'); rect(30, 2, 30, 29, '#404040');
rect(2, 28, 29, 28, '#808080'); rect(29, 3, 29, 28, '#808080');
// Title bar gradient
const a = hex('#0a246a'), b = hex('#a6caf0');
rect(3, 4, 28, 8, x => { const t = (x - 3) / 25; return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t)).concat(255); });
rect(4, 5, 7, 7, '#ffffff');
// Sunken white page
rect(3, 10, 28, 26, '#ffffff');
rect(3, 10, 28, 10, '#808080'); rect(3, 10, 3, 26, '#808080');
// Ruled lines
for (const y of [13, 16, 19, 22]) rect(5, y, 26, y, '#e3e6ee');
// Bar chart
rect(7, 18, 9, 24, '#006400');
rect(12, 14, 14, 24, '#0a246a');
rect(17, 20, 19, 24, '#a00000');
rect(22, 12, 24, 24, '#006400');
rect(5, 25, 26, 25, '#404040');

// Encode PNG
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  for (let x = 0; x < SIZE; x++) {
    const c = px[Math.floor(y / SCALE)][Math.floor(x / SCALE)] || [0, 0, 0, 0];
    c.forEach((v, i) => { raw[y * (SIZE * 4 + 1) + 1 + x * 4 + i] = v; });
  }
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const v of buf) c = crcTable[(c ^ v) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
]);
const out = path.join(__dirname, '..', 'build', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log('Wrote', out, png.length, 'bytes');
