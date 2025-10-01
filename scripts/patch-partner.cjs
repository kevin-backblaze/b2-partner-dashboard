const fs = require('fs');
const f = 'src/PartnerConsoleDemo.tsx';
let s = fs.readFileSync(f, 'utf8');

// type perDay so Object.values is not unknown
s = s.replace(
  /const\s+perDay\s*=\s*\{\s*\};/,
  'const perDay: Record<string, { date: string; storageTB: number; egressTB: number; requests: number }> = {};'
);

// simplify Tooltip formatter to avoid type errors
s = s.replace(
  /<Tooltip\s+formatter=\{\s*\(.*?\)\s*=>[\s\S]*?\}\s*\/>/,
  '<Tooltip formatter={(value: number, name: string) => `${Number(value).toFixed(2)} TB`} />'
);

fs.writeFileSync(f, s);
console.log('patched', f);
