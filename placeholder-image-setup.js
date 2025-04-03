const fs = require('fs');
const path = require('path');
const https = require('https');

// Create necessary directories
const dirs = [
  './public/fallback/images',
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// URLs for placeholder/sample images (these should be free-to-use images)
const placeholderImageUrls = [
  'https://picsum.photos/id/1/1024/1024', // Nature
  'https://picsum.photos/id/10/1024/1024', // Nature
  'https://picsum.photos/id/100/1024/1024', // Beach
  'https://picsum.photos/id/1000/1024/1024', // Mountain
  'https://picsum.photos/id/1002/1024/1024', // Night
  'https://picsum.photos/id/1015/1024/1024', // River
  'https://picsum.photos/id/1018/1024/1024', // Mountain
  'https://picsum.photos/id/1019/1024/1024', // Nature
];

// Download placeholder images
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join('./public/fallback/images', filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`Image already exists: ${filename}`);
      return resolve();
    }
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there's an error
      console.error(`Error downloading ${url}: ${err.message}`);
      reject(err);
    });
  });
}

// Download all placeholder images
async function downloadAllImages() {
  try {
    for (let i = 0; i < placeholderImageUrls.length; i++) {
      const url = placeholderImageUrls[i];
      const filename = `placeholder_${i + 1}.jpg`;
      await downloadImage(url, filename);
    }
    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading images:', error);
  }
}

// Create README file for placeholder images
const placeholderReadme = `# Placeholder Images for Music Video Generator

This directory contains placeholder images that are used when the OpenAI DALL-E API is unavailable.

## Usage:

1. These images will be used automatically if the image generation API call fails.
2. You can replace these with your own images if desired (keep the same filenames).
3. The application will randomly select from these images when needed.

## Sources:

These placeholder images are from Lorem Picsum (https://picsum.photos/), a free image placeholder service.
`;

fs.writeFileSync(path.join('./public/fallback/images', 'README.md'), placeholderReadme);
console.log('Created placeholder images README file');

// Run the download
downloadAllImages();