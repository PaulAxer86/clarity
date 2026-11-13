// Wraps src/clarity.html (the shared page, also used for the web preview) into a full document for the desktop app.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'src', 'clarity.html'), 'utf8');
const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
${page}
</html>
`;

fs.mkdirSync(path.join(root, 'app'), { recursive: true });
fs.writeFileSync(path.join(root, 'app', 'index.html'), html);
console.log('Built app/index.html');
