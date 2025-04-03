const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize OpenAI with API key only, no organization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract key lines from lyrics for image generation
 * @param {string} lyrics - Full song lyrics
 * @returns {Array<string>} - Array of key lines for visualization
 */
function extractKeyLines(lyrics) {
  // Split lyrics into lines
  const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
  
  // If lyrics are short, use all lines
  if (lines.length <= 8) {
    return lines;
  }
  
  // Otherwise, select key lines: first line of each verse, chorus lines, etc.
  const keyLines = [];
  let inChorus = false;
  let lastLineAdded = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line.length === 0) continue;
    
    // Skip if too similar to last added line (avoid duplicates)
    if (line === lastLineAdded) continue;
    
    // Check if this is likely a chorus marker
    if (line.toLowerCase().includes('chorus') || 
        line.toLowerCase().includes('[chorus]') ||
        line.toLowerCase().includes('refrain')) {
      inChorus = true;
      continue;
    }
    
    // Check if this is likely a verse marker
    if (line.toLowerCase().includes('verse') || 
        line.toLowerCase().includes('[verse]')) {
      inChorus = false;
      // Add the first line of the verse
      if (i + 1 < lines.length) {
        keyLines.push(lines[i + 1].trim());
        lastLineAdded = lines[i + 1].trim();
      }
      continue;
    }
    
    // Always include chorus lines
    if (inChorus) {
      keyLines.push(line);
      lastLineAdded = line;
      continue;
    }
    
    // For other lines, add selectively
    if (keyLines.length < 8 && 
        // Add lines that are likely to have visual imagery (contains nouns, etc.)
        (line.length > 20 || 
         i === 0 || // First line of song
         i === lines.length - 1 || // Last line of song
         i % 5 === 0)) { // Every 5th line
      keyLines.push(line);
      lastLineAdded = line;
    }
  }
  
  // If we still have too few, add more lines
  if (keyLines.length < 5 && lines.length > keyLines.length) {
    for (let i = 0; i < lines.length; i++) {
      if (!keyLines.includes(lines[i].trim()) && 
          lines[i].trim().length > 0 &&
          keyLines.length < 8) {
        keyLines.push(lines[i].trim());
      }
    }
  }
  
  // Limit to 8 images maximum
  return keyLines.slice(0, 8);
}

/**
 * Generate images for each key line of the lyrics
 * @param {string} lyrics - Full song lyrics
 * @returns {Promise<Array<string>>} - Array of image filenames
 */
async function generateImages(lyrics) {
  try {
    const keyLines = extractKeyLines(lyrics);
    const imageFiles = [];
    
    // Generate an image for each key line
    for (let i = 0; i < keyLines.length; i++) {
      const line = keyLines[i];
      
      try {
        // Create a detailed prompt for the image
        const prompt = `Create a visually striking scene for a music video based on these lyrics: "${line}". 
                      Make the image cinematic, emotionally resonant, and visually rich.`;
        
        // Generate image using DALL-E
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        
        if (!response.data || !response.data[0] || !response.data[0].url) {
          console.error('OpenAI returned an unexpected response format:', response);
          throw new Error('Invalid response from image generation API');
        }
        
        const imageUrl = response.data[0].url;
      
      // Download image
      const imageResponse = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream'
      });
      
      // Generate unique filename
      const id = uuidv4();
      const filename = `${id}_${i}.png`;
      const imagePath = path.join(__dirname, '../public/outputs/images', filename);
      
      // Save image file
      const writer = fs.createWriteStream(imagePath);
      imageResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      imageFiles.push(filename);
      
      // Add a delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (imageError) {
        console.error(`Error generating image for line ${i}: ${imageError.message}`);
        // Continue with next image instead of failing the whole process
        continue;
      }
    }
    
    if (imageFiles.length === 0) {
      throw new Error('Failed to generate any images');
    }
    
    return imageFiles;
  } catch (error) {
    console.error('Error generating images:', error);
    throw new Error('Failed to generate images');
  }
}

/**
 * Create a single placeholder image for when API generation fails
 * @param {number} index - Index of the image
 * @returns {Promise<string>} - Filename of the placeholder image
 */
async function createPlaceholderImage(index) {
  try {
    // Create required directories
    const placeholderDir = path.join(__dirname, '../public/fallback/images');
    const outputDir = path.join(__dirname, '../public/outputs/images');
    
    if (!fs.existsSync(placeholderDir)) {
      fs.mkdirSync(placeholderDir, { recursive: true });
    }
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // First: Try to use placeholder images from the fallback directory
    let sourceFile = null;
    
    // Look for images in fallback/images
    if (fs.existsSync(placeholderDir)) {
      const files = fs.readdirSync(placeholderDir)
        .filter(file => 
          file.endsWith('.jpg') || 
          file.endsWith('.jpeg') || 
          file.endsWith('.png'));
      
      if (files.length > 0) {
        sourceFile = path.join(placeholderDir, files[index % files.length]);
      }
    }
    
    // If no placeholder files found, create a simple colored image
    if (!sourceFile) {
      // Fall back to creating a simple colored rectangle as absolute last resort
      console.log("No placeholder images available. Creating a basic colored image.");
      
      // Use node-canvas or another solution to create a simple image
      // For this example, we'll just create empty files with different names
      const solidColor = path.join(__dirname, '../public/outputs/images', `solid_color_${index}.png`);
      
      // Basic touch file to create an empty file
      fs.writeFileSync(solidColor, `Placeholder for image ${index}`);
      
      return path.basename(solidColor);
    }
    
    // Generate a unique filename for the output
    const id = uuidv4();
    const filename = `${id}_${index}.png`;
    const outputPath = path.join(outputDir, filename);
    
    // Copy the source image to the output directory
    fs.copyFileSync(sourceFile, outputPath);
    
    return filename;
  } catch (error) {
    console.error('Error creating placeholder image:', error);
    
    // Last resort - create an empty file if everything else fails
    try {
      const emergencyFilename = `emergency_${uuidv4()}_${index}.png`;
      const emergencyPath = path.join(__dirname, '../public/outputs/images', emergencyFilename);
      fs.writeFileSync(emergencyPath, 'Emergency placeholder');
      return emergencyFilename;
    } catch (e) {
      console.error('Failed even emergency placeholder creation:', e);
      return null;
    }
  }
}

/**
 * Create multiple placeholder images
 * @param {number} count - Number of images to create
 * @returns {Promise<Array<string>>} - Array of filenames
 */
async function createPlaceholderImages(count) {
  const filenames = [];
  
  // Create a set of placeholder images
  for (let i = 0; i < count; i++) {
    const filename = await createPlaceholderImage(i);
    if (filename) {
      filenames.push(filename);
    }
  }
  
  return filenames;
}

module.exports = {
  generateImages
};