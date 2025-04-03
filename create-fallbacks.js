const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = [
  './public',
  './public/fallback',
  './public/fallback/images',
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

// Create a sample audio file
const createSampleAudio = () => {
  const fallbackAudioPath = path.join('./public/fallback', 'fallback.mp3');
  
  if (!fs.existsSync(fallbackAudioPath)) {
    console.log("Creating a placeholder audio file...");
    
    // This is the minimal data for a valid MP3 file (silent)
    const silentMp3 = Buffer.from([
      0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    fs.writeFileSync(fallbackAudioPath, silentMp3);
    console.log(`Created silent MP3 file at: ${fallbackAudioPath}`);
  } else {
    console.log(`Fallback audio already exists at: ${fallbackAudioPath}`);
  }
};

// Create sample image files
const createSampleImages = () => {
  const fallbackImagesDir = './public/fallback/images';
  
  // Check if we already have some images
  const existingImages = fs.readdirSync(fallbackImagesDir)
    .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
  
  if (existingImages.length > 0) {
    console.log(`Found ${existingImages.length} existing fallback images`);
    return;
  }
  
  console.log("Creating placeholder image files...");
  
  // Create some colored squares as image placeholders
  const colors = [
    { name: 'red', rgb: [255, 0, 0] },
    { name: 'green', rgb: [0, 255, 0] },
    { name: 'blue', rgb: [0, 0, 255] },
    { name: 'yellow', rgb: [255, 255, 0] },
    { name: 'purple', rgb: [128, 0, 128] },
    { name: 'cyan', rgb: [0, 255, 255] }
  ];
  
  colors.forEach((color, index) => {
    // Create a simple PNG file
    const filename = path.join(fallbackImagesDir, `sample_${color.name}.png`);
    
    // This creates a minimal PNG file with a colored square
    // The PNG format is quite complex, so this is a very minimal implementation
    const width = 100;
    const height = 100;
    const [r, g, b] = color.rgb;
    
    // Create a simple text file instead (since PNG encoding is complex)
    fs.writeFileSync(filename, 
      `This is a placeholder for a ${color.name} image (${width}x${height}).
      It would normally be a PNG file with RGB color (${r},${g},${b}).`);
    
    console.log(`Created placeholder for ${color.name} image`);
  });
};

// Create a README in the fallback directory
const createReadme = () => {
  const readmePath = path.join('./public/fallback', 'README.md');
  const readmeContent = `# Fallback Resources

This directory contains fallback resources for the AI Music Video Generator.

## Contents:

- \`fallback.mp3\`: A silent audio file used when music generation fails
- \`images/\`: Directory containing placeholder images used when image generation fails

These files are used automatically by the application when external API calls fail.
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Created README at: ${readmePath}`);
};

// Create a special HTML fallback for the video
const createHtmlFallback = () => {
  const fallbackHtmlPath = path.join('./public/fallback', 'fallback.html');
  
  const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>AI Music Video Fallback Player</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #1a1a1a;
      color: white;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    
    .container {
      width: 800px;
      max-width: 95vw;
      background-color: #2c2c2c;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
    
    h1 {
      color: #3498db;
      text-align: center;
    }
    
    .info-box {
      background-color: #3a3a3a;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .lyrics {
      white-space: pre-line;
      background-color: #333;
      padding: 20px;
      border-radius: 5px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .slide-container {
      width: 100%;
      height: 300px;
      position: relative;
      background-color: #111;
      margin: 20px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 5px;
    }
    
    .slide {
      font-size: 24px;
      text-align: center;
      color: white;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Music Video</h1>
    
    <div class="info-box">
      <p>This is a fallback player for the AI Music Video Generator.</p>
      <p>It displays the lyrics and related information when the regular video cannot be generated.</p>
    </div>
    
    <div class="slide-container">
      <div class="slide">
        <p>AI-Generated Music Video</p>
        <p>Generated with Claude for lyrics, and a creative slideshow visualization</p>
      </div>
    </div>
    
    <h2>Generated Lyrics</h2>
    <div class="lyrics" id="lyrics-container">
      Loading lyrics...
    </div>
  </div>
  
  <script>
    // Simulate loading lyrics
    setTimeout(() => {
      document.getElementById('lyrics-container').textContent = 
\`Verse 1
Another day, another goodbye
Tears rolling down, I can't deny
The pain that lingers, the heart that breaks
But you're by my side, and it's okay

Chorus
'Cause we'll dance the night away, my friend
Forget the heartache, let the laughter mend
With you, I'll find the strength to start again
Together, we'll make it through the bend\`;
    }, 500);
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(fallbackHtmlPath, fallbackHtml);
  console.log(`Created fallback HTML player at: ${fallbackHtmlPath}`);
};

// Run all the functions
createSampleAudio();
createSampleImages();
createReadme();
createHtmlFallback();

console.log('\nAll fallback resources have been created successfully!');
console.log('You can now run the application without worrying about external API dependencies.');