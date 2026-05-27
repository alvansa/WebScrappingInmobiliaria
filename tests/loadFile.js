// tests/loader.js
const fs = require('node:fs/promises');
const path = require('node:path');

const loadFile = async (category, filename) => {
  const filePath = path.join(__dirname, 'docs', category, `${filename}.txt`);
  return fs.readFile(filePath, 'utf-8');
};

module.exports = { loadFile };