const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const claudeService = require('../services/claude');
const sunoService = require('../services/suno');
const imageGenService = require('../services/image-gen');
const videoAssemblyService = require('../services/video-assembly');

// Generate lyrics based on user prompt
router.post('/generate-lyrics', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const lyrics = await claudeService.generateLyrics(prompt);
    const id = uuidv4();
    const filename = `${id}.json`;
    
    // Save lyrics to file
    fs.writeFileSync(
      path.join(__dirname, '../public/outputs/lyrics', filename), 
      JSON.stringify({ id, prompt, lyrics })
    );

    res.json({ id, lyrics });
  } catch (error) {
    console.error('Error generating lyrics:', error);
    res.status(500).json({ error: 'Failed to generate lyrics' });
  }
});

// Generate music from lyrics
router.post('/generate-music', async (req, res) => {
  try {
    const { lyricsId } = req.body;
    if (!lyricsId) {
      return res.status(400).json({ error: 'Lyrics ID is required' });
    }

    // Read lyrics from file
    const lyricsFile = path.join(__dirname, '../public/outputs/lyrics', `${lyricsId}.json`);
    if (!fs.existsSync(lyricsFile)) {
      return res.status(404).json({ error: 'Lyrics not found' });
    }

    const lyricsData = JSON.parse(fs.readFileSync(lyricsFile, 'utf8'));
    const musicFile = await sunoService.generateMusic(lyricsData.lyrics);
    
    res.json({ 
      id: lyricsId, 
      musicUrl: `/outputs/music/${musicFile}` 
    });
  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ error: 'Failed to generate music' });
  }
});

// Generate images for lyrics
router.post('/generate-images', async (req, res) => {
  try {
    const { lyricsId } = req.body;
    if (!lyricsId) {
      return res.status(400).json({ error: 'Lyrics ID is required' });
    }

    // Read lyrics from file
    const lyricsFile = path.join(__dirname, '../public/outputs/lyrics', `${lyricsId}.json`);
    if (!fs.existsSync(lyricsFile)) {
      return res.status(404).json({ error: 'Lyrics not found' });
    }

    const lyricsData = JSON.parse(fs.readFileSync(lyricsFile, 'utf8'));
    const imageFiles = await imageGenService.generateImages(lyricsData.lyrics);
    
    res.json({ 
      id: lyricsId,
      imageUrls: imageFiles.map(file => `/outputs/images/${file}`)
    });
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ error: 'Failed to generate images' });
  }
});

// Assemble video from music and images
router.post('/assemble-video', async (req, res) => {
  try {
    const { lyricsId } = req.body;
    if (!lyricsId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const videoFile = await videoAssemblyService.createVideo(lyricsId);
    
    // Check if it's an HTML file
    const isHtmlOutput = videoFile.endsWith('.html');
    
    res.json({ 
      id: lyricsId,
      videoUrl: `/outputs/videos/${videoFile}`,
      isHtmlPlayer: isHtmlOutput
    });
  } catch (error) {
    console.error('Error assembling video:', error);
    res.status(500).json({ error: 'Failed to assemble video' });
  }
});

// Get project status
router.get('/project/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project files exist
    const lyricsFile = path.join(__dirname, '../public/outputs/lyrics', `${id}.json`);
    if (!fs.existsSync(lyricsFile)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const lyricsData = JSON.parse(fs.readFileSync(lyricsFile, 'utf8'));
    
    // Check for music file
    const musicDir = path.join(__dirname, '../public/outputs/music');
    const musicFiles = fs.readdirSync(musicDir).filter(file => file.startsWith(id));
    
    // Check for image files
    const imagesDir = path.join(__dirname, '../public/outputs/images');
    const imageFiles = fs.readdirSync(imagesDir).filter(file => file.startsWith(id));
    
    // Check for video file
    const videosDir = path.join(__dirname, '../public/outputs/videos');
    const videoFiles = fs.readdirSync(videosDir).filter(file => file.startsWith(id));
    
    res.json({
      id,
      prompt: lyricsData.prompt,
      lyrics: lyricsData.lyrics,
      hasMusicGenerated: musicFiles.length > 0,
      hasImagesGenerated: imageFiles.length > 0,
      hasVideoAssembled: videoFiles.length > 0,
      musicUrl: musicFiles.length > 0 ? `/outputs/music/${musicFiles[0]}` : null,
      imageUrls: imageFiles.map(file => `/outputs/images/${file}`),
      videoUrl: videoFiles.length > 0 ? `/outputs/videos/${videoFiles[0]}` : null
    });
  } catch (error) {
    console.error('Error getting project status:', error);
    res.status(500).json({ error: 'Failed to get project status' });
  }
});

module.exports = router;