const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Suno API endpoints
const SUNO_API_URL = 'https://api.suno.ai/v1';
const SUNO_API_KEY = process.env.SUNO_API_KEY;

/**
 * Generate music from lyrics using Suno AI,
 * with fallback to a local audio file if the API is unavailable
 * @param {string} lyrics - Song lyrics
 * @returns {Promise<string>} - Filename of generated music file
 */
async function generateMusic(lyrics) {
  try {
    // Process lyrics to prepare for Suno
    // Suno has limitations on input length, so we need to make sure
    // the lyrics aren't too long
    const processedLyrics = lyrics.substring(0, 2000); // Limit to 2000 chars
    
    // Clean up the lyrics - remove any special characters that might cause issues
    const cleanLyrics = processedLyrics
      .replace(/[^\w\s\n,.!?'"-]/g, '') // Keep only basic text characters and punctuation
      .trim();
    
    // Determine tone and style from lyrics
    // This could be enhanced with sentiment analysis
    const isMajor = Math.random() > 0.5; // Randomly choose major or minor key
    const styles = ['pop', 'rock', 'indie', 'electronic', 'folk', 'hip-hop'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    
    console.log(`Generating music with style: ${randomStyle}, tonic: ${isMajor ? 'C major' : 'A minor'}`);
    console.log(`Lyrics length: ${cleanLyrics.length} characters`);
    
    try {
      // Create a generation request
      const response = await axios.post(
        `${SUNO_API_URL}/generate`, 
        {
          prompt: cleanLyrics.slice(0, 300), // Short prompt for title generation
          style: randomStyle,
          tonic: isMajor ? 'C major' : 'A minor',
          lyrics: cleanLyrics,
          model_version: 'v3', // Use latest Suno model
        },
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      // Get generation ID from response
      const generationId = response.data.generation_id;

      // Poll for status until generation is complete
      let status = 'in_progress';
      let audioUrl = null;
      let maxAttempts = 10;
      let attempts = 0;
      
      while ((status === 'in_progress' || status === 'queued') && attempts < maxAttempts) {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
        const statusResponse = await axios.get(
          `${SUNO_API_URL}/generations/${generationId}`,
          {
            headers: {
              'Authorization': `Bearer ${SUNO_API_KEY}`
            },
            timeout: 10000
          }
        );
        
        status = statusResponse.data.status;
        
        if (status === 'complete') {
          audioUrl = statusResponse.data.audio_url;
          break;
        }
      }
      
      if (!audioUrl) {
        console.log("No audio URL received from Suno API, using fallback");
        return useFallbackAudio();
      }
      
      // Download the audio file
      const audioResponse = await axios({
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
        timeout: 15000
      });
      
      // Generate unique filename
      const id = uuidv4();
      const filename = `${id}.mp3`;
      const audioPath = path.join(__dirname, '../public/outputs/music', filename);
      
      // Save audio file
      const writer = fs.createWriteStream(audioPath);
      audioResponse.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filename));
        writer.on('error', reject);
      });
      
    } catch (apiError) {
      console.error('Error generating music with Suno:', apiError);
      return useFallbackAudio();
    }
  } catch (error) {
    console.error('Error in music generation process:', error);
    return useFallbackAudio();
  }
}

/**
 * Use a fallback audio file when Suno API is unavailable
 * @returns {Promise<string>} - Filename of the fallback music file
 */
async function useFallbackAudio() {
  try {
    // Set up fallback audio paths
    const fallbackDir = path.join(__dirname, '../public/fallback');
    const outputDir = path.join(__dirname, '../public/outputs/music');
    
    // Create fallback directory if it doesn't exist
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    
    // Path to the fallback MP3 file 
    const fallbackPath = path.join(fallbackDir, 'fallback.mp3');
    
    // Check if fallback already exists
    if (!fs.existsSync(fallbackPath)) {
      // Create a placeholder text file if MP3 not available
      console.log("No fallback MP3 found, using a placeholder file");
      const placeholderPath = path.join(fallbackDir, 'fallback.txt');
      fs.writeFileSync(placeholderPath, 'Placeholder for audio file');
      
      // Generate unique filename for text file
      const id = uuidv4();
      const filename = `${id}.txt`;
      const outputPath = path.join(outputDir, filename);
      
      fs.copyFileSync(placeholderPath, outputPath);
      return filename;
    }
    
    // Copy fallback to output with unique name
    const id = uuidv4();
    const filename = `${id}.mp3`;
    const outputPath = path.join(outputDir, filename);
    
    fs.copyFileSync(fallbackPath, outputPath);
    console.log(`Using fallback audio file: ${fallbackPath}`);
    
    return filename;
  } catch (error) {
    console.error('Error using fallback audio:', error);
    throw new Error('Failed to generate music');
  }
}

module.exports = {
  generateMusic
};