const { cloneRepo, readFilesRecursively } = require('./helpers');
const { analyzeFiles } = require('./generateDocs');
const path = require('path');
const fs = require('fs');

const repoUrl = 'https://github.com/cjephuneh/Nishauri_ussd'; // Replace with actual repo URL
const localPath = path.join(__dirname, 'repo');

const generateDocumentation = async () => {
  try {
    console.log('Cloning repository...');
    await cloneRepo(repoUrl, localPath);

    console.log('Reading files...');
    const files = readFilesRecursively(localPath);

    console.log('Generating documentation...');
    const docContent = await analyzeFiles(files);

    const documentationPath = path.join(__dirname, 'DOCUMENTATION.md');
    fs.writeFileSync(documentationPath, docContent);
    console.log('Documentation generated successfully!');

    console.log('Generated Documentation Content:');
    console.log(docContent); // Display the content of the generated documentation

  } catch (error) {
    console.error('Error generating documentation:', error);
  }
};

generateDocumentation();
