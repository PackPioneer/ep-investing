#!/usr/bin/env node
// Run from project root: node retheme.js

const fs = require('fs');
const path = require('path');

// Color mapping: dark → light Bloomberg theme
const replacements = [
  // Backgrounds
  ['#0a0d0f', '#f2f4f8'],
  ['#111518', '#ffffff'],
  ['#171c20', '#f8f9fb'],
  ['#151d18', '#eef1f6'],
  ['#1a1815', '#eef1f6'],
  ['#1c1916', '#ffffff'],

  // Borders
  ['#1e2428', '#e2e6ed'],
  ['#252c32', '#d0d6e0'],
  ['#2a2520', '#e2e6ed'],
  ['#332e28', '#d0d6e0'],
  ['#2a3530', '#c8d0dc'],
  ['#2a2820', '#dde2ea'],

  // Text
  ['text-\\[#e8ede8\\]', 'text-[#0f1a14]'],
  ['text-\\[#e8ddd0\\]', 'text-[#0f1a14]'],
  ['fill="#e8ede8"', 'fill="#0f1a14"'],
  ['"#e8ede8"', '"#0f1a14"'],
  ['"#e8ddd0"', '"#0f1a14"'],
  ['#6b7a72', '#4a5568'],
  ['#8a7d6e', '#4a5568'],
  ['#4a5550', '#718096'],
  ['#6b5e52', '#718096'],

  // Accent: lime green → forest green
  ['#c8f560', '#2d6a4f'],
  ['#d4ff6b', '#235a40'],
  ['#a8d840', '#2d6a4f'],

  // Accent light bg tints
  ['rgba(200,245,96,0.1)', 'rgba(45,106,79,0.08)'],
  ['rgba(200,245,96,0.08)', 'rgba(45,106,79,0.06)'],
  ['rgba(200,245,96,0.07)', 'rgba(45,106,79,0.05)'],
  ['rgba(200,245,96,0.06)', 'rgba(45,106,79,0.05)'],
  ['rgba(200,245,96,0.04)', 'rgba(45,106,79,0.04)'],
  ['rgba(200,245,96,0.15)', 'rgba(45,106,79,0.1)'],

  // Specific dark backgrounds used in charts/accents
  ['bg-\\[#0a0d0f\\]', 'bg-[#f2f4f8]'],
  ['bg-\\[#111518\\]', 'bg-white'],
  ['bg-\\[#1e2428\\]', 'bg-[#e2e6ed]'],
  ['bg-\\[#151d18\\]', 'bg-[#eef1f6]'],
  ['bg-\\[#171c20\\]', 'bg-[#f8f9fb]'],

  // Text on accent (button text) stays dark on green bg
  ['text-\\[#0a0d0f\\]', 'text-white'],

  // Logo SVG colors
  ['fill="#6b7a72"', 'fill="#4a5568"'],
  ['fill="#2a3530"', 'fill="#c8d0dc"'],
  ['stroke="#2a3530"', 'stroke="#c8d0dc"'],

  // animate-pulse dot color in logo
  ['fill="#c8f560"', 'fill="#2d6a4f"'],

  // Navbar backdrop
  ['bg-\\[#0a0d0f\\]\\/90', 'bg-[#f2f4f8]/90'],

  // Border accent
  ['border-\\[#1e2e24\\]', 'border-[#c8d8cc]'],
  ['border-\\[#2a2820\\]', 'border-[#c8d8cc]'],
  ['border-\\[#c8f560\\]', 'border-[#2d6a4f]'],

  // Hover text
  ['hover:text-\\[#c8f560\\]', 'hover:text-[#2d6a4f]'],
  ['hover:border-\\[#c8f560\\]', 'hover:border-[#2d6a4f]'],
  ['hover:bg-\\[rgba\\(200,245,96,0\\.1\\)\\]', 'hover:bg-[rgba(45,106,79,0.08)]'],
  ['hover:bg-\\[rgba\\(200,245,96,0\\.06\\)\\]', 'hover:bg-[rgba(45,106,79,0.06)]'],
  ['hover:bg-\\[#171c20\\]', 'hover:bg-[#f8f9fb]'],
  ['hover:bg-\\[#151d18\\]', 'hover:bg-[#eef1f6]'],

  // Focus
  ['focus:border-\\[#c8f560\\]', 'focus:border-[#2d6a4f]'],
  ['focus-within:border-\\[#c8f560\\]', 'focus-within:border-[#2d6a4f]'],
  ['focus-within:shadow-\\[0_0_0_3px_rgba\\(200,245,96,0\\.07\\)\\]', 'focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]'],

  // Active states
  ['border-\\[#1e2e24\\] bg-\\[#151d18\\] text-\\[#c8f560\\]', 'border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]'],
  ['text-\\[#c8f560\\]', 'text-[#2d6a4f]'],

  // Gradient/bg with opacity
  ['bg-\\[rgba\\(200,245,96,0\\.1\\)\\]', 'bg-[rgba(45,106,79,0.08)]'],
  ['bg-\\[rgba\\(200,245,96,0\\.08\\)\\]', 'bg-[rgba(45,106,79,0.06)]'],

  // Placeholder
  ['placeholder-\\[#4a5550\\]', 'placeholder-[#a0aec0]'],
  ['placeholder-\\[#6b5e52\\]', 'placeholder-[#a0aec0]'],

  // Animate pulse on logo
  ['animate-pulse', 'animate-pulse'],
];

function walkDir(dir, exts) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (['node_modules', '.next', '.git', 'public'].includes(item)) continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath, exts));
    } else if (exts.some(e => fullPath.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walkDir('./app', ['.jsx', '.js', '.tsx', '.ts', '.css']);
files.push(...walkDir('./components', ['.jsx', '.js', '.tsx', '.ts']));

let totalChanges = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    const regex = new RegExp(from, 'g');
    const newContent = content.replace(regex, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
      totalChanges++;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('✓', file);
  }
}

console.log(`\nDone — ${totalChanges} replacements across ${files.length} files`);
