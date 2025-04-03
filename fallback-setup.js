const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = [
  './public',
  './public/fallback',
  './public/outputs',
  './public/outputs/music',
  './public/outputs/images',
  './public/outputs/videos',
  './public/outputs/lyrics'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Create a README file in the fallback directory
const fallbackReadme = `# Fallback Audio Directory

This directory contains fallback audio files that are used when the Suno API is unavailable.

## Instructions:

1. Place an MP3 file named "fallback.mp3" in this directory.
2. This file will be used if the Suno AI service is unavailable or rate-limited.
3. You can use any royalty-free music for this purpose.

Sources for royalty-free music:
- https://freemusicarchive.org/
- https://pixabay.com/music/
- https://www.bensound.com/
`;

fs.writeFileSync(path.join('./public/fallback', 'README.md'), fallbackReadme);
console.log('Created fallback README file');

console.log('\nSetup complete! Now add a fallback.mp3 file to the public/fallback directory.');