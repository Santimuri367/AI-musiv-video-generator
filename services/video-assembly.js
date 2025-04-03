const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a simple HTML-based video player instead of ffmpeg processing
 * This is a fallback approach when ffmpeg is not available
 * @param {string} projectId - Project ID
 * @returns {Promise<string>} - Filename of the generated HTML player
 */
async function createVideo(projectId) {
  try {
    // Get music file
    const musicDir = path.join(__dirname, '../public/outputs/music');
    const musicFiles = fs.readdirSync(musicDir)
      .filter(file => file.endsWith('.mp3'))
      .sort();
    
    // If no music files found, create an empty one as a last resort
    if (musicFiles.length === 0) {
      console.log('No music files found. Creating a placeholder silence file.');
      
      // Check if fallback directory exists and has an audio file
      const fallbackDir = path.join(__dirname, '../public/fallback');
      if (fs.existsSync(fallbackDir)) {
        const fallbackFiles = fs.readdirSync(fallbackDir)
          .filter(file => file.endsWith('.mp3'));
        
        if (fallbackFiles.length > 0) {
          // Copy the first fallback file to the output directory
          const sourceFile = path.join(fallbackDir, fallbackFiles[0]);
          const destFile = path.join(musicDir, `${projectId}_fallback.mp3`);
          fs.copyFileSync(sourceFile, destFile);
          musicFiles.push(`${projectId}_fallback.mp3`);
        } else {
          // Create a placeholder text file instead of an mp3
          const placeholderFile = path.join(musicDir, `${projectId}_placeholder.txt`);
          fs.writeFileSync(placeholderFile, 'Placeholder for audio file');
          musicFiles.push(`${projectId}_placeholder.txt`);
        }
      } else {
        // Create fallback directory if it doesn't exist
        fs.mkdirSync(fallbackDir, { recursive: true });
        
        // Create a placeholder text file
        const placeholderFile = path.join(musicDir, `${projectId}_placeholder.txt`);
        fs.writeFileSync(placeholderFile, 'Placeholder for audio file');
        musicFiles.push(`${projectId}_placeholder.txt`);
      }
    }
    
    const musicFile = musicFiles[0]; // Just the filename, not the full path
    
    // Get image files
    const imagesDir = path.join(__dirname, '../public/outputs/images');
    let imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .sort();
    
    // If no images found, create some placeholder text files
    if (imageFiles.length === 0) {
      console.log('No image files found, creating emergency placeholder image descriptions');
      
      // Create a few basic image descriptions
      const scenes = [
        'A vibrant cityscape at night with neon lights',
        'A serene beach at sunset with gentle waves',
        'A majestic mountain range with snow-capped peaks',
        'A cozy cafe interior with warm lighting',
        'A peaceful forest with sunlight filtering through the trees',
        'A dramatic stormy sky over a vast landscape'
      ];
      
      for (let i = 0; i < scenes.length; i++) {
        const emergencyImageFile = path.join(imagesDir, `${projectId}_emergency_${i}.txt`);
        fs.writeFileSync(emergencyImageFile, scenes[i]);
      }
      
      // Get the emergency files
      imageFiles = fs.readdirSync(imagesDir)
        .filter(file => file.startsWith(`${projectId}_emergency_`))
        .sort();
      
      if (imageFiles.length === 0) {
        throw new Error('Failed to create emergency placeholder image descriptions');
      }
    }
    
    // Generate HTML-based video player instead of using ffmpeg
    const playerHtml = generateHtmlPlayer(musicFile, imageFiles);
    
    // Generate output filename
    const outputFileName = `${uuidv4()}.html`;
    const outputPath = path.join(__dirname, '../public/outputs/videos', outputFileName);
    
    // Save HTML player
    fs.writeFileSync(outputPath, playerHtml);
    
    return outputFileName;
  } catch (error) {
    console.error('Error in video assembly:', error);
    
    // As a last resort, create a simple error message HTML file
    try {
      console.log("Using the fallback HTML player as a last resort");
      
      // Check if we have a fallback HTML file
      const fallbackHtmlPath = path.join(__dirname, '../public/fallback/fallback.html');
      
      if (fs.existsSync(fallbackHtmlPath)) {
        // Copy the fallback HTML to the outputs directory
        const fallbackFileName = `fallback_${uuidv4()}.html`;
        const outputPath = path.join(__dirname, '../public/outputs/videos', fallbackFileName);
        
        fs.copyFileSync(fallbackHtmlPath, outputPath);
        console.log(`Copied fallback HTML player to: ${outputPath}`);
        
        return fallbackFileName;
      }
      const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Music Video Visualization</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #1a1a1a; color: white; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
          .container { max-width: 800px; margin: 0 auto; background-color: #2c2c2c; padding: 20px; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Music Video Error</h1>
          <p>Sorry, we couldn't assemble your music video, but we can still display the lyrics!</p>
          <p>Error: ${error.message}</p>
          <div id="lyrics" style="white-space: pre-line; text-align: left; background-color: #333; padding: 20px; border-radius: 5px; margin-top: 20px;">
            Loading lyrics...
          </div>
        </div>
        <script>
          fetch('/api/project/${projectId}')
            .then(response => response.json())
            .then(data => {
              document.getElementById('lyrics').innerText = data.lyrics || 'No lyrics available';
            })
            .catch(err => {
              document.getElementById('lyrics').innerText = 'Error loading lyrics. Please try again.';
            });
        </script>
      </body>
      </html>
      `;
      
      const fallbackFileName = `error_${uuidv4()}.html`;
      const fallbackPath = path.join(__dirname, '../public/outputs/videos', fallbackFileName);
      fs.writeFileSync(fallbackPath, errorHtml);
      
      return fallbackFileName;
    } catch (fallbackError) {
      console.error('Error creating fallback error page:', fallbackError);
      throw new Error('Failed to assemble video');
    }
  }
}

/**
 * Generate an HTML-based slideshow player (no ffmpeg needed)
 * @param {string} musicFile - Music filename
 * @param {Array<string>} imageFiles - Array of image filenames
 * @returns {string} - HTML content for the player
 */
function generateHtmlPlayer(musicFile, imageFiles) {
  const slideDuration = 5; // seconds per slide
  
  // Create image slides with paths
  const imageSlides = imageFiles.map(file => {
    // Check if it's a text file (placeholder)
    if (file.endsWith('.txt')) {
      return {
        type: 'text',
        content: fs.readFileSync(path.join(__dirname, '../public/outputs/images', file), 'utf8')
      };
    } else {
      return {
        type: 'image',
        path: `/outputs/images/${file}`
      };
    }
  });
  
  // Generate HTML for the player
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>AI Music Video</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #000;
        color: white;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      
      .player-container {
        width: 800px;
        max-width: 95vw;
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      }
      
      .slide-container {
        width: 100%;
        height: 450px;
        position: relative;
        background-color: #111;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .slide.active {
        opacity: 1;
      }
      
      .slide img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      
      .slide .text-content {
        font-size: 24px;
        padding: 20px;
        text-align: center;
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 10px;
        max-width: 80%;
      }
      
      .controls {
        width: 100%;
        background-color: #222;
        padding: 15px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
      }
      
      .play-pause {
        background-color: #3498db;
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
      }
      
      .progress-container {
        flex-grow: 1;
        height: 10px;
        background-color: #444;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .progress-bar {
        height: 100%;
        background-color: #3498db;
        border-radius: 5px;
        width: 0%;
      }
      
      .time {
        margin-left: 15px;
        font-size: 14px;
        color: #ccc;
      }
    </style>
  </head>
  <body>
    <h1>AI-Generated Music Video</h1>
    
    <div class="player-container">
      <div class="slide-container" id="slideContainer">
        ${imageSlides.map((slide, index) => `
          <div class="slide ${index === 0 ? 'active' : ''}" id="slide-${index}">
            ${slide.type === 'image' 
              ? `<img src="${slide.path}" alt="Scene ${index + 1}">`
              : `<div class="text-content">${slide.content}</div>`
            }
          </div>
        `).join('')}
      </div>
      
      <div class="controls">
        <button class="play-pause" id="playPauseBtn">▶</button>
        <div class="progress-container" id="progressContainer">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="time" id="timeDisplay">0:00 / 0:00</div>
      </div>
    </div>
    
    <audio id="audioPlayer" style="display: none;" src="/outputs/music/${musicFile}"></audio>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const audioPlayer = document.getElementById('audioPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const progressBar = document.getElementById('progressBar');
        const progressContainer = document.getElementById('progressContainer');
        const timeDisplay = document.getElementById('timeDisplay');
        const slides = document.querySelectorAll('.slide');
        
        const slideDuration = ${slideDuration}; // seconds per slide
        const totalSlides = ${imageSlides.length};
        
        let currentSlide = 0;
        
        // Initialize
        if (!audioPlayer.src.endsWith('.mp3')) {
          // If no audio file, we'll just cycle through slides
          setInterval(nextSlide, slideDuration * 1000);
        }
        
        // Play/pause button
        playPauseBtn.addEventListener('click', function() {
          if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.textContent = '❚❚';
          } else {
            audioPlayer.pause();
            playPauseBtn.textContent = '▶';
          }
        });
        
        // Update progress bar
        audioPlayer.addEventListener('timeupdate', function() {
          // Update progress bar
          const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
          progressBar.style.width = percentage + '%';
          
          // Update time display
          const currentMinutes = Math.floor(audioPlayer.currentTime / 60);
          const currentSeconds = Math.floor(audioPlayer.currentTime % 60);
          const totalMinutes = Math.floor(audioPlayer.duration / 60) || 0;
          const totalSeconds = Math.floor(audioPlayer.duration % 60) || 0;
          
          timeDisplay.textContent = 
            \`\${currentMinutes}:\${currentSeconds.toString().padStart(2, '0')} / 
             \${totalMinutes}:\${totalSeconds.toString().padStart(2, '0')}\`;
          
          // Update slide based on current time
          if (!isNaN(audioPlayer.duration)) {
            const slideIndex = Math.min(
              Math.floor((audioPlayer.currentTime / audioPlayer.duration) * totalSlides), 
              totalSlides - 1
            );
            
            if (slideIndex !== currentSlide) {
              slides[currentSlide].classList.remove('active');
              slides[slideIndex].classList.add('active');
              currentSlide = slideIndex;
            }
          }
        });
        
        // Click on progress bar to seek
        progressContainer.addEventListener('click', function(e) {
          const percent = e.offsetX / progressContainer.offsetWidth;
          audioPlayer.currentTime = percent * audioPlayer.duration;
        });
        
        // Handle audio file errors
        audioPlayer.addEventListener('error', function() {
          console.log('Audio player error, switching to manual slide show');
          // Start slideshow automatically if audio fails
          setInterval(nextSlide, slideDuration * 1000);
        });
        
        function nextSlide() {
          slides[currentSlide].classList.remove('active');
          currentSlide = (currentSlide + 1) % totalSlides;
          slides[currentSlide].classList.add('active');
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return html;
}

/**
 * Get the duration of an audio file (not used in the HTML version)
 * This is only kept for compatibility with the original code
 * @param {string} filePath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds
 */
function getMusicDuration(filePath) {
  return Promise.resolve(30); // Return a default duration of 30 seconds
}

module.exports = {
  createVideo
};