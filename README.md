# AI Music Video Generator

An AI-powered web application that generates music videos with lyrics, music, and visuals based on user input.

## Overview

This project combines multiple AI technologies to create a complete multimedia experience:

1. **Claude AI** - Generates song lyrics based on a user's theme or idea
2. **Suno AI** - Creates music from the AI-generated lyrics
3. **DALL-E/GPT-4V** - Generates visuals for each key line of the song
4. **FFmpeg** - Assembles the music and images into a complete music video

## Features

- **User-friendly Interface** - Simple web app where users enter a theme or idea
- **AI-Generated Content** - All creative elements (lyrics, music, visuals) are AI-generated
- **Complete Generation Pipeline** - Handles the entire process from text prompt to finished video
- **Progress Tracking** - Shows real-time updates as each component is generated
- **Downloadable Results** - Users can download their finished music videos

## Prerequisites

- Node.js (v14+)
- API keys for:
  - Anthropic Claude API (for lyrics generation)
  - Suno AI API (for music generation) - included in the project
  - OpenAI API (for image generation)
- FFmpeg installed on your system (for video assembly)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/ai-music-video-generator.git
   cd ai-music-video-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-****************************
   SUNO_API_KEY=fa7f4d284e67bd534ed6ce5331d806ce
   OPENAI_API_KEY=sk-proj-*********************************
   PORT=3000
   ```

4. Make sure FFmpeg is installed on your system. You can download it from [ffmpeg.org](https://ffmpeg.org/download.html).

5. Add a placeholder audio file:
   ```
   # Create a public/fallback directory
   mkdir -p public/fallback
   
   # Add your own MP3 file (rename it to fallback.mp3)
   cp your-audio-file.mp3 public/fallback/fallback.mp3
   ```
   This is used as a fallback when the Suno API is unavailable.

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Enter a theme or idea in the input field (e.g., "A journey through a cosmic forest at night")

4. Click "Generate Music Video" and wait for the AI to create your video

5. Once complete, you can watch your music video and download it

## Project Structure

- `server.js` - Main Express server
- `routes/api.js` - API endpoints for each generation step
- `services/` - Service modules for each AI integration:
  - `claude.js` - Handles lyrics generation with Claude AI
  - `suno.js` - Handles music generation with Suno AI
  - `image-gen.js` - Handles image generation with OpenAI
  - `video-assembly.js` - Handles video assembly with FFmpeg
- `public/` - Frontend files:
  - `index.html` - Main web interface
  - `styles.css` - CSS styling
  - `app.js` - Frontend JavaScript
  - `outputs/` - Generated content storage

## Technical Implementation

1. **Lyrics Generation** - Uses Claude 3 Sonnet through Anthropic's API to create original song lyrics based on the user's theme.

2. **Music Generation** - Uses Suno AI's API to transform the lyrics into a complete song with vocals and instrumentation.

3. **Image Generation** - Uses DALL-E through OpenAI's API to create visual scenes for each key line of the lyrics.

4. **Video Assembly** - Uses FFmpeg to stitch together the generated images with the music track, creating transitions and timing the visuals to the music.

## Acknowledgments

This project was created as part of an AI multimedia assignment and uses several AI technologies:

- [Anthropic Claude](https://www.anthropic.com/claude) for lyrics generation
- [Suno AI](https://suno.ai) for music generation
- [OpenAI DALL-E](https://openai.com/dall-e-3) for image generation

## License

This project is intended for educational purposes only. Please respect the terms of service for all AI APIs used.