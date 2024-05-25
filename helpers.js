require('dotenv').config();
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
const MAX_TOKENS = 1600; // Set a safe token limit per chunk

const cloneRepo = async (repoUrl, localPath) => {
  const git = simpleGit();
  await git.clone(repoUrl, localPath);
};

const readFilesRecursively = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      readFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
};

// Function to split text into smaller chunks
const splitIntoChunks = (text, maxSize) => {
  const regex = new RegExp(`.{1,${maxSize}}`, 'g');
  return text.match(regex);
};

// Retry mechanism for API calls
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.log(`Retrying... (${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
};

const generateDocumentationForChunk = async (chunk) => {
  const makeRequest = async () => {
    const response = await axios.post(
      openaiEndpoint,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `Generate detailed documentation for the following code:\n\n${chunk}\n\nThe documentation should include an overview, setup instructions, usage examples, and any important notes.` }
        ],
        max_tokens: MAX_TOKENS,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );
    return response.data.choices[0].message.content.trim();
  };

  return await retry(makeRequest);
};

const generateDocumentation = async (fileContent) => {
  const chunks = splitIntoChunks(fileContent, MAX_TOKENS);
  const promises = chunks.map(chunk => generateDocumentationForChunk(chunk).catch(error => `Error generating documentation for this part: ${error.message}`));
  
  const results = await Promise.all(promises);
  return results.join('\n');
};

module.exports = {
  cloneRepo,
  readFilesRecursively,
  generateDocumentation,
};
