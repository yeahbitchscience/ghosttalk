const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend', 'src');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace 'http://localhost:5000/...' with `${import.meta.env.VITE_API_URL}/...`
  content = content.replace(/'http:\/\/localhost:5000(\/.*?)'/g, "`${import.meta.env.VITE_API_URL}$1`");
  
  // Replace `http://localhost:5000/...` (inside template literals) with ${import.meta.env.VITE_API_URL}/...
  content = content.replace(/http:\/\/localhost:5000/g, "${import.meta.env.VITE_API_URL}");
  
  // Clean up any double template literals if they occurred (like `${import.meta.env.VITE_API_URL}` without backticks)
  content = content.replace(/'\$\{import\.meta\.env\.VITE_API_URL\}'/g, 'import.meta.env.VITE_API_URL');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath);
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      replaceInFile(filepath);
    }
  });
};

walkSync(directoryPath);
console.log('All frontend files have been successfully updated to use VITE_API_URL!');
