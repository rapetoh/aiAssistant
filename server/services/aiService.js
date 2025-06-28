import OpenAI from 'openai';
import axios from 'axios';
import { AI_CONFIG } from '../config/aiConfig.js';

class AIService {


  async generateResponse(messages, provider = AI_CONFIG.defaultProvider, onStream = null) {
    try {
      if (provider === 'cohere') {
        // Clean messages to remove _id and timestamp fields
        const cleanedMessages = messages.map(({ role, content }) => ({
          role,
          content
        }));

        const response = await axios.post(
          AI_CONFIG.cohere.baseUrl,
          {
            model: AI_CONFIG.cohere.model,
            messages: cleanedMessages,
            stream: true // Enable streaming
          },
          {
            headers: {
              'Authorization': AI_CONFIG.cohere.apiKey,
              'Content-Type': 'application/json',
            },
            responseType: 'stream'
          }
        );

        let fullResponse = '';
        
        return new Promise((resolve, reject) => {
          response.data.on('data', (chunk) => {
            try {
              const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                console.log('Raw line from stream:', line); // Keep for debugging
                
                if (line.startsWith('data: ')) {
                  const jsonString = line.slice(6);
                  const data = JSON.parse(jsonString); 
                  console.log('Parsed Cohere stream data:', data); // Keep for debugging
                  
                  if (data.type === 'content-delta') {
                    const text = data.delta?.message?.content?.text;
                    if (text) {
                      fullResponse += text;
                      if (onStream) {
                        onStream(text);
                      }
                    }
                  } else if (data.type === 'message-end') {
                    if (onStream) {
                      onStream(''); 
                    }
                    resolve(fullResponse.trim());
                    return; 
                  }
                } else if (line.startsWith('event: ')) {
                  // Ignore event lines, as they don't contain the data payload
                  console.log('Ignoring event line:', line);
                } else {
                  // Log any other unexpected lines
                  console.warn('Unexpected non-JSON, non-event line:', line);
                }
              }
            } catch (error) {
              console.error('Error processing stream chunk:', error);
              // It's possible some non-JSON data comes through, or partial JSON
            }
          });

          response.data.on('end', () => {
            resolve(fullResponse);
          });

          response.data.on('error', (error) => {
            console.error('Stream error:', error);
            reject(error);
          });
        });
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  async generateMatchAnalysis(resume, jobDescription) {
    const prompt = `
      Analyze the following resume and job description. Provide a detailed analysis in JSON format.

      The JSON object must have the following structure:
      {
        "name": "<candidate's full name>",
        "role": "<candidate's current or most recent job title>",
        "matchScore": <a number between 0 and 100 representing the percentage match>,
        "summary": "<a short, one-sentence summary of the candidate's suitability>",
        "recommendations": [
          "<a string with a specific, actionable recommendation to improve the resume>",
          "<another string with a specific, actionable recommendation>",
          "...and so on"
        ],
        "jobKeywords": [
          { "word": "<keyword>", "category": "<Hard Skill|Soft Skill|Core|Emphasis>" },
          { "word": "<keyword>", "category": "<Hard Skill|Soft Skill|Core|Emphasis>" }
        ]
      }

      Here is the resume:
      ---
      ${resume}
      ---

      Here is the job description:
      ---
      ${jobDescription}
      ---

      Now, provide the JSON object.
    `;

    try {
      const response = await axios.post(
        AI_CONFIG.cohere.baseUrl,
        {
          model: AI_CONFIG.cohere.model,
          messages: [{ role: 'user', content: prompt }],
          stream: false // We need the full response, not a stream
        },
        {
          headers: {
            'Authorization': AI_CONFIG.cohere.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      let responseText = null;
      // Handle OpenAI-style response
      if (response.data && Array.isArray(response.data.choices) && response.data.choices.length > 0 && response.data.choices[0].message && response.data.choices[0].message.content) {
        responseText = response.data.choices[0].message.content;
      }
      // Handle Cohere-style response
      else if (response.data && response.data.message && Array.isArray(response.data.message.content) && response.data.message.content.length > 0 && response.data.message.content[0].text) {
        responseText = response.data.message.content[0].text;
      }
      if (!responseText) {
        throw new Error(
          'AI API did not return expected choices array or message object. Full response: ' + JSON.stringify(response.data)
        );
      }
      // Remove code block markers if present
      responseText = responseText.replace(/^```json|^```|```$/gm, '').trim();
      // Extract the JSON part from the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON response from AI. Full response text: ' + responseText);
      }
    } catch (error) {
      console.error('Error in generateMatchAnalysis:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;
