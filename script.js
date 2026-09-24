const fs = require('fs');
const content = fs.readFileSync('apps/web-app/src/lib/themes.ts', 'utf8');

const getLuminance = (r, g, b) => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const parseColor = (colorStr) => {
    if (!colorStr) return [0,0,0];
    let c = colorStr.trim();
    if (c.startsWith('rgb')) {
        const floats = c.match(/[\d.]+/g);
        if (floats && floats.length >= 3) return [parseFloat(floats[0]), parseFloat(floats[1]), parseFloat(floats[2])];
    }
    if (c.startsWith('#')) {
        c = c.substring(1);
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length === 6) return [parseInt(c.substring(0,2), 16), parseInt(c.substring(2,2), 16), parseInt(c.substring(4,2), 16)];
    }
    return [0,0,0];
};

const getContrastRatio = (color1, color2) => {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};

const regex = /"([^"]+)":\s*\{\s*'--theme-bg':\s*'([^']+)',\s*'--theme-bar':\s*'([^']+)',\s*'--theme-card':\s*'([^']+)',\s*'--theme-text':\s*'([^']+)'/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const bg = match[2];
    const card = match[4];
    const text = match[5];
    const ratioBg = getContrastRatio(text, bg);
    const ratioCard = getContrastRatio(text, card);
    if (ratioBg < 3.0 || ratioCard < 3.0) {
        console.log(\FAILED: \ | text: \ | bg: \ (\) | card: \ (\)\);
    }
}
