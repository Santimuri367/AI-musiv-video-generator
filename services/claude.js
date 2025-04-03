const Anthropic = require('@anthropic-ai/sdk').Anthropic;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate song lyrics using Claude AI based on user prompt
 * @param {string} prompt - User's theme or idea
 * @returns {Promise<string>} - Generated lyrics
 */
async function generateLyrics(prompt) {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Write original song lyrics based on this theme or idea: "${prompt}".
          
          The lyrics should:
          - Have a catchy chorus
          - Include 2-3 verses
          - Follow a standard song structure
          - Be emotionally resonant
          - Be appropriate for a music video
          - Have clear visual imagery that could be represented in a music video
          
          Return ONLY the lyrics, formatted with line breaks. Don't include any explanations or notes.`
        }
      ],
    });

    // Handle the content properly based on the expected response format
    const content = message.content;
    let lyrics = '';
    
    // Extract text from content array
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.type === 'text') {
          lyrics += item.text;
        }
      }
    } else {
      // Fallback if the response format is different
      lyrics = typeof content === 'string' ? content : JSON.stringify(content);
    }

    return lyrics;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error('Failed to generate lyrics: ' + error.message);
  }
}

module.exports = {
  generateLyrics
};