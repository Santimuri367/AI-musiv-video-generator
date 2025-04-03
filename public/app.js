// UI Elements
const inputSection = document.getElementById('input-section');
const progressSection = document.getElementById('progress-section');
const resultsSection = document.getElementById('results-section');
const themeInput = document.getElementById('theme-input');
const generateBtn = document.getElementById('generate-btn');
const progressBar = document.getElementById('progress-bar');
const progressStatus = document.getElementById('progress-status');
const downloadBtn = document.getElementById('download-btn');
const newVideoBtn = document.getElementById('new-video-btn');

// Progress elements
const lyricsProgress = document.getElementById('lyrics-progress');
const musicProgress = document.getElementById('music-progress');
const imagesProgress = document.getElementById('images-progress');
const videoProgress = document.getElementById('video-progress');

// Result elements
const resultVideo = document.getElementById('result-video');
const resultAudio = document.getElementById('result-audio');
const resultLyrics = document.getElementById('result-lyrics');
const resultImages = document.getElementById('result-images');

// Global variables
let projectId = null;
let projectData = null;

// Initialize the application
function init() {
  // Event listeners
  generateBtn.addEventListener('click', startGeneration);
  downloadBtn.addEventListener('click', downloadVideo);
  newVideoBtn.addEventListener('click', resetApp);
  
  // Check if there's a project in progress (could add local storage recovery)
}

// Start the generation process
async function startGeneration() {
  const theme = themeInput.value.trim();
  
  if (!theme) {
    alert('Please enter a theme or idea for your music video');
    return;
  }
  
  // Show progress section
  inputSection.classList.add('hidden');
  progressSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  
  // Reset progress indicators
  updateProgress('lyrics', 'loading');
  updateProgress('music', 'waiting');
  updateProgress('images', 'waiting');
  updateProgress('video', 'waiting');
  
  updateProgressBar(0);
  
  try {
    // Step 1: Generate lyrics
    updateProgressStatus('Generating lyrics...');
    const lyricsResult = await generateLyrics(theme);
    projectId = lyricsResult.id;
    updateProgress('lyrics', 'complete', lyricsResult.lyrics);
    updateProgressBar(25);
    
    // Step 2: Generate music
    updateProgressStatus('Creating music...');
    updateProgress('music', 'loading');
    try {
      const musicResult = await generateMusic(projectId);
      updateProgress('music', 'complete', `<audio controls src="${musicResult.musicUrl}"></audio>`);
    } catch (musicError) {
      console.error('Music generation error:', musicError);
      updateProgress('music', 'error', '<p>Music generation encountered an issue. Using fallback audio.</p>');
    }
    updateProgressBar(50);
    
    // Step 3: Generate images
    updateProgressStatus('Creating visuals...');
    updateProgress('images', 'loading');
    try {
      const imagesResult = await generateImages(projectId);
      
      let imagesHtml = '<div class="image-gallery">';
      imagesResult.imageUrls.forEach(url => {
        imagesHtml += `<img src="${url}" alt="Generated scene">`;
      });
      imagesHtml += '</div>';
      
      updateProgress('images', 'complete', imagesHtml);
    } catch (imageError) {
      console.error('Image generation error:', imageError);
      updateProgress('images', 'error', '<p>Image generation encountered an issue.</p>');
    }
    updateProgressBar(75);
    
    // Step 4: Assemble video
    updateProgressStatus('Assembling final video...');
    updateProgress('video', 'loading');
    try {
      const videoResult = await assembleVideo(projectId);
      
      if (videoResult.isHtmlPlayer) {
        // If it's an HTML player, create an iframe
        updateProgress('video', 'complete', `<iframe src="${videoResult.videoUrl}" style="width:100%; height:400px; border:none;"></iframe>`);
      } else {
        // For regular video files
        updateProgress('video', 'complete', `<video controls class="w-full" src="${videoResult.videoUrl}"></video>`);
      }
    } catch (videoError) {
      console.error('Video assembly error:', videoError);
      updateProgress('video', 'error', '<p>Video assembly encountered an issue. View individual elements below.</p>');
    }
    updateProgressBar(100);
    
    // Get final project data
    projectData = await getProjectStatus(projectId);
    
    // Show results
    updateProgressStatus('Complete!');
    setTimeout(() => {
      showResults(projectData);
    }, 1000);
    
  } catch (error) {
    console.error('Generation error:', error);
    updateProgressStatus('Error occurred');
    alert('An error occurred during generation. Please try again.');
  }
}

// Update a specific progress step
function updateProgress(step, status, content = null) {
  const progressElement = document.getElementById(`${step}-progress`);
  const statusElement = progressElement.querySelector('.status');
  const contentElement = progressElement.querySelector('.content');
  
  // Update status
  statusElement.className = 'status';
  statusElement.classList.add(`status-${status}`);
  
  if (status === 'waiting') {
    statusElement.textContent = 'Waiting...';
  } else if (status === 'loading') {
    statusElement.textContent = 'Processing';
    statusElement.classList.add('status-loading');
  } else if (status === 'complete') {
    statusElement.textContent = 'Complete!';
  } else if (status === 'error') {
    statusElement.textContent = 'Error';
  }
  
  // Update content if provided
  if (content) {
    contentElement.innerHTML = content;
    contentElement.classList.remove('hidden');
  } else {
    contentElement.classList.add('hidden');
  }
}

// Update progress status text
function updateProgressStatus(message) {
  progressStatus.textContent = message;
}

// Update progress bar
function updateProgressBar(percentage) {
  progressBar.style.width = `${percentage}%`;
}

// Show the results section
function showResults(data) {
  progressSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  
  // Set video source or iframe for HTML player
  if (data.videoUrl) {
    if (data.videoUrl.endsWith('.html')) {
      // Create iframe for HTML player
      resultVideo.style.display = 'none';
      const videoContainer = document.getElementById('video-container');
      
      // Remove existing content
      while (videoContainer.firstChild) {
        videoContainer.removeChild(videoContainer.firstChild);
      }
      
      // Create and add iframe
      const iframe = document.createElement('iframe');
      iframe.src = data.videoUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      videoContainer.appendChild(iframe);
    } else {
      // Regular video
      resultVideo.style.display = 'block';
      resultVideo.src = data.videoUrl;
    }
  }
  
  // Set audio source
  if (data.musicUrl) {
    resultAudio.src = data.musicUrl;
  }
  
  // Set lyrics
  if (data.lyrics) {
    resultLyrics.textContent = data.lyrics;
  }
  
  // Set images
  resultImages.innerHTML = '';
  if (data.imageUrls && data.imageUrls.length) {
    data.imageUrls.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Generated scene';
      img.className = 'w-full rounded';
      resultImages.appendChild(img);
    });
  }
}

// Download the video
function downloadVideo() {
  if (projectData && projectData.videoUrl) {
    const a = document.createElement('a');
    a.href = projectData.videoUrl;
    a.download = 'ai-music-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// Reset the app to create a new video
function resetApp() {
  inputSection.classList.remove('hidden');
  progressSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  themeInput.value = '';
  projectId = null;
  projectData = null;
}

// API Calls

// Generate lyrics
async function generateLyrics(prompt) {
  const response = await fetch('/api/generate-lyrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate lyrics');
  }
  
  return response.json();
}

// Generate music
async function generateMusic(lyricsId) {
  const response = await fetch('/api/generate-music', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lyricsId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate music');
  }
  
  return response.json();
}

// Generate images
async function generateImages(lyricsId) {
  const response = await fetch('/api/generate-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lyricsId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate images');
  }
  
  return response.json();
}

// Assemble video
async function assembleVideo(lyricsId) {
  const response = await fetch('/api/assemble-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lyricsId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assemble video');
  }
  
  return response.json();
}

// Get project status
async function getProjectStatus(id) {
  const response = await fetch(`/api/project/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get project status');
  }
  
  return response.json();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);