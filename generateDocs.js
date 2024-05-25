const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')();
const { generateDocumentation } = require('./helpers');

const analyzeFiles = async (files) => {
  const docContent = [];

  for (const file of files) {
    const ext = path.extname(file);
    const content = fs.readFileSync(file, 'utf-8');

    let docSection = '';
    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
      case '.py': // Adding Python support as an example
        docSection = await generateDocumentation(content);
        break;
      // Add more cases for other file types if needed
      default:
        continue; // Skip unsupported file types
    }

    if (docSection) {
      docContent.push(`## ${path.basename(file)}\n\n${markdownIt.render(docSection)}\n`);
    }
  }

  return docContent.join('\n');
};

module.exports = {
  analyzeFiles,
};
