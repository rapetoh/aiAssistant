import OpenAI from 'openai';
import axios from 'axios';
import { AI_CONFIG } from '../config/aiConfig.js';

class AIService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Generate cache key from inputs
  generateCacheKey(resume, jobDescription) {
    const resumeHash = this.simpleHash(resume);
    const jobHash = this.simpleHash(jobDescription);
    return `${resumeHash}-${jobHash}`;
  }

  // Simple hash function for cache keys
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get cached result if available and not expired
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('Returning cached analysis result');
      return cached.result;
    }
    return null;
  }

  // Store result in cache
  cacheResult(cacheKey, result) {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    console.log('Cached analysis result');
  }

  async generateResponse(messages, provider = AI_CONFIG.defaultProvider, onStream = null) {
    try {
      if (provider === 'cohere') {
        // Clean messages to remove _id and timestamp fields
        const cleanedMessages = messages.map(({ role, content }) => ({
          role,
          content
        }));

        // Validate payload size before sending
        const payload = {
          model: AI_CONFIG.cohere.model,
          messages: cleanedMessages,
          stream: true
        };
        
        const payloadSize = JSON.stringify(payload).length;
        console.log(`Payload size for Cohere API: ${payloadSize} bytes`);
        
        // Cohere has a limit of ~4MB for the entire request
        // Let's be conservative and limit to 100KB
        const MAX_PAYLOAD_SIZE = 100 * 1024; // 100KB
        if (payloadSize > MAX_PAYLOAD_SIZE) {
          throw new Error(`Payload too large: ${payloadSize} bytes (max: ${MAX_PAYLOAD_SIZE} bytes)`);
        }

        const response = await axios.post(
          AI_CONFIG.cohere.baseUrl,
          payload,
          {
            headers: {
              'Authorization': AI_CONFIG.cohere.apiKey,
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
            timeout: 30000 // 30 second timeout
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
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error('API Response Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('API Request Error:', error.request);
      } else {
        console.error('API Error:', error.message);
      }
      
      throw error;
    }
  }

  async generateMatchAnalysis(resume, jobDescription, timestamp = null) {
    // Check cache first (unless timestamp is provided for cache busting)
    if (!timestamp) {
      const cacheKey = this.generateCacheKey(resume, jobDescription);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      // Step 1: Use cosine similarity for deterministic scoring only
      const baseAnalysis = this.applyCosineSimilarityScoring(resume, jobDescription);
      const matchScore = baseAnalysis.matchScore;

      // Step 2: Use AI to extract and format all human-readable fields
      const aiPrompt = `You are a resume/job matcher assistant. Given the following resume and job description, and a pre-calculated match score (${matchScore}%), extract and return a JSON object with these fields:

{
  "jobKeywords": ["keyword1", "keyword2", ...],
  "jobSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", ...],
  "missingExperience": ["experience1", ...],
  "summary": "2-3 sentence summary of the match",
  "improvementSuggestions": ["suggestion1", ...],
  "whatMattersMost": "Top 1-3 critical requirements for this role"
}

- jobKeywords: The 6 most relevant, non-generic keywords from the job description (no stopwords, no generic words like 'with', 'and', 'the', etc). ALWAYS return at least 6.
- jobSkills: The 6 most important skills required for the job. ALWAYS return at least 6.
- missingSkills: Skills required by the job but not found in the resume.
- missingExperience: Experience required by the job but not found in the resume.
- summary: A concise, professional summary of the match.
- improvementSuggestions: 3-5 actionable ways the candidate can improve their match.
- whatMattersMost: 1-2 sentences on the most critical requirements for this job.

If you cannot find 6 keywords or skills, make your best guess based on the job description. Never return empty arrays for jobKeywords or jobSkills.

Resume:
${resume}

Job Description:
${jobDescription}

Match Score: ${matchScore}%

Return ONLY a valid JSON object with all fields filled in. Do not include any explanation or extra text.`;

      const aiResponse = await axios.post(
        AI_CONFIG.cohere.baseUrl,
        {
          model: AI_CONFIG.cohere.model,
          messages: [{ role: 'user', content: aiPrompt }],
          stream: false,
          temperature: 0.3 // Moderate creativity for better writing
        },
        {
          headers: {
            'Authorization': AI_CONFIG.cohere.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      let aiText = null;
      if (aiResponse.data && Array.isArray(aiResponse.data.choices) && aiResponse.data.choices.length > 0 && aiResponse.data.choices[0].message && aiResponse.data.choices[0].message.content) {
        aiText = aiResponse.data.choices[0].message.content;
      } else if (aiResponse.data && aiResponse.data.message && Array.isArray(aiResponse.data.message.content) && aiResponse.data.message.content.length > 0 && aiResponse.data.message.content[0].text) {
        aiText = aiResponse.data.message.content[0].text;
      }

      if (!aiText) {
        console.log('AI extraction failed, using base analysis');
        return baseAnalysis;
      }

      // Clean and parse AI response
      aiText = aiText.replace(/^```json|^```|```$/gm, '').trim();
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('Failed to parse AI extraction response, using base analysis');
        return baseAnalysis;
      }

      const aiFields = JSON.parse(jsonMatch[0]);

      // Fallback: Ensure at least 6 keywords and 6 skills
      if (!Array.isArray(aiFields.jobKeywords) || aiFields.jobKeywords.length < 6) {
        aiFields.jobKeywords = (aiFields.jobKeywords || []).concat(Array(6).fill('No keyword')).slice(0, 6);
      }
      if (!Array.isArray(aiFields.jobSkills) || aiFields.jobSkills.length < 6) {
        aiFields.jobSkills = (aiFields.jobSkills || []).concat(Array(6).fill('No skill')).slice(0, 6);
      }

      // Compose the final result: use AI for all fields except matchScore
      const result = {
        matchScore,
        // For frontend: jobKeywords as array of {word}
        jobKeywords: (aiFields.jobKeywords || []).map(word => ({ word })),
        // For frontend: skills as array of {name, type, status, highlight}
        skills: (aiFields.jobSkills || []).map(skill => ({
          name: skill,
          type: this.categorizeSkill ? this.categorizeSkill(skill) : 'Core',
          status: false,
          highlight: false
        })),
        // Also keep the raw arrays for reference if needed
        jobSkills: aiFields.jobSkills || [],
        missingSkills: aiFields.missingSkills || [],
        missingExperience: aiFields.missingExperience || [],
        summary: aiFields.summary || '',
        improvementSuggestions: aiFields.improvementSuggestions || [],
        whatMattersMost: aiFields.whatMattersMost || '',
        // For compatibility with frontend, also include these:
        missingForPerfectMatch: [
          ...(aiFields.missingSkills || []).map(s => `Skill: ${s}`),
          ...(aiFields.missingExperience || []).map(e => `Experience: ${e}`)
        ]
      };

      // Cache the result (only if not a forced re-analysis)
      if (!timestamp) {
        const cacheKey = this.generateCacheKey(resume, jobDescription);
        this.cacheResult(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error('Error in generateMatchAnalysis:', error);
      throw error;
    }
  }

  // New method: Use AI to polish the analysis while keeping the score unchanged
  async polishWithAI(baseAnalysis, resume, jobDescription) {
    try {
      const polishPrompt = `Based on the following resume-job match analysis, please enhance the human-readable elements. Keep the match score (${baseAnalysis.matchScore}%) exactly the same, but improve the summary, improvement suggestions, and what matters most to be more engaging and helpful.

Current Analysis:
- Match Score: ${baseAnalysis.matchScore}%
- Skills Found: ${baseAnalysis.skills.map(s => s.name).join(', ')}
- Missing Skills: ${baseAnalysis.missingForPerfectMatch.filter(m => m.startsWith('Skill:')).map(m => m.replace('Skill: ', '')).join(', ')}
- Missing Keywords: ${baseAnalysis.missingForPerfectMatch.filter(m => m.startsWith('Keyword:')).map(m => m.replace('Keyword: ', '')).join(', ')}
- Missing Experiences: ${baseAnalysis.missingForPerfectMatch.filter(m => m.startsWith('Experience:')).map(m => m.replace('Experience: ', '')).join(', ')}

Resume Preview: ${resume.substring(0, 500)}...
Job Description Preview: ${jobDescription.substring(0, 500)}...

Please return ONLY a valid JSON object with these enhanced fields:

{
  "summary": "A compelling 2-3 sentence summary that explains the match quality and key strengths/weaknesses",
  "improvementSuggestions": ["3-5 specific, actionable suggestions for improvement"],
  "whatMattersMost": "1-2 sentences highlighting the most critical requirements for this role"
}

Keep the tone professional but engaging. Make suggestions specific and actionable.`;

      const polishResponse = await axios.post(
        AI_CONFIG.cohere.baseUrl,
        {
          model: AI_CONFIG.cohere.model,
          messages: [{ role: 'user', content: polishPrompt }],
          stream: false,
          temperature: 0.3 // Moderate creativity for better writing
        },
        {
          headers: {
            'Authorization': AI_CONFIG.cohere.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      let polishText = null;
      if (polishResponse.data && Array.isArray(polishResponse.data.choices) && polishResponse.data.choices.length > 0 && polishResponse.data.choices[0].message && polishResponse.data.choices[0].message.content) {
        polishText = polishResponse.data.choices[0].message.content;
      } else if (polishResponse.data && polishResponse.data.message && Array.isArray(polishResponse.data.message.content) && polishResponse.data.message.content.length > 0 && polishResponse.data.message.content[0].text) {
        polishText = polishResponse.data.message.content[0].text;
      }

      if (!polishText) {
        console.log('AI polishing failed, using base analysis');
        return baseAnalysis;
      }

      // Clean and parse AI response
      polishText = polishText.replace(/^```json|^```|```$/gm, '').trim();
      const jsonMatch = polishText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('Failed to parse AI polishing response, using base analysis');
        return baseAnalysis;
      }

      const aiEnhancements = JSON.parse(jsonMatch[0]);

      // Combine base analysis with AI enhancements
      return {
        ...baseAnalysis,
        summary: aiEnhancements.summary || baseAnalysis.summary,
        improvementSuggestions: aiEnhancements.improvementSuggestions || baseAnalysis.improvementSuggestions,
        whatMattersMost: aiEnhancements.whatMattersMost || baseAnalysis.whatMattersMost
      };

    } catch (error) {
      console.error('Error in AI polishing:', error);
      // If AI polishing fails, return the base analysis
      return baseAnalysis;
    }
  }

  // New method: Apply cosine similarity scoring algorithm
  applyCosineSimilarityScoring(resume, jobDescription) {
    // Preprocess text: convert to lowercase and remove special characters
    const preprocessText = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const cleanResume = preprocessText(resume);
    const cleanJobDesc = preprocessText(jobDescription);

    // Extract skills and keywords
    const skills = this.extractSkills(cleanResume, cleanJobDesc);
    const jobKeywords = this.extractJobKeywords(cleanJobDesc);
    
    // Calculate cosine similarity for different aspects
    const skillSimilarity = this.calculateCosineSimilarity(
      this.getSkillVector(cleanResume, skills),
      this.getSkillVector(cleanJobDesc, skills)
    );

    const keywordSimilarity = this.calculateCosineSimilarity(
      this.getKeywordVector(cleanResume, jobKeywords),
      this.getKeywordVector(cleanJobDesc, jobKeywords)
    );

    const experienceSimilarity = this.calculateCosineSimilarity(
      this.getExperienceVector(cleanResume),
      this.getExperienceVector(cleanJobDesc)
    );

    // Weighted scoring
    const skillScore = skillSimilarity * 40; // 40% weight
    const keywordScore = keywordSimilarity * 30; // 30% weight
    const experienceScore = experienceSimilarity * 30; // 30% weight

    const totalScore = Math.round(skillScore + keywordScore + experienceScore);

    // Generate missing elements for perfect match
    const missingSkills = this.findMissingSkills(cleanResume, cleanJobDesc, skills);
    const missingKeywords = this.findMissingKeywords(cleanResume, jobKeywords);
    const missingExperiences = this.findMissingExperiences(cleanResume, cleanJobDesc);

    const missingForPerfectMatch = [
      ...missingSkills.map(skill => `Skill: ${skill}`),
      ...missingKeywords.map(keyword => `Keyword: ${keyword}`),
      ...missingExperiences.map(exp => `Experience: ${exp}`)
    ];

    // Generate summary
    const summary = this.generateSummary(totalScore, skillSimilarity, keywordSimilarity, experienceSimilarity);

    // Determine what matters most
    const whatMattersMost = this.determineWhatMattersMost(jobKeywords, skills, totalScore);

    return {
      matchScore: Math.min(100, Math.max(0, totalScore)),
      skills: skills.map(skill => ({
        name: skill,
        type: this.categorizeSkill(skill),
        status: cleanResume.includes(skill.toLowerCase()),
        highlight: cleanResume.includes(skill.toLowerCase())
      })),
      jobKeywords: jobKeywords.map(keyword => ({
        word: keyword,
        category: this.categorizeSkill(keyword)
      })),
      recommendations: this.generateImprovementSuggestions(
        missingSkills, missingKeywords, missingExperiences, totalScore
      ),
      missingForPerfectMatch,
      summary,
      whatMattersMost,
      name: 'Candidate',
      role: 'Current Role'
    };
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vectorA, vectorB) {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Extract skills from both resume and job description
  extractSkills(resume, jobDesc) {
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes',
      'machine learning', 'ai', 'data analysis', 'statistics', 'programming', 'coding',
      'development', 'engineering', 'html', 'css', 'typescript', 'angular', 'vue.js',
      'mongodb', 'postgresql', 'mysql', 'redis', 'git', 'agile', 'scrum', 'leadership',
      'communication', 'teamwork', 'problem solving', 'creativity', 'adaptability',
      'time management', 'organization', 'collaboration', 'project management',
      'user experience', 'ux', 'ui', 'design', 'testing', 'debugging', 'optimization',
      'performance', 'security', 'api', 'rest', 'graphql', 'microservices', 'cloud',
      'devops', 'ci/cd', 'jenkins', 'github', 'bitbucket', 'jira', 'confluence'
    ];

    const foundSkills = new Set();
    
    // Find skills mentioned in either resume or job description
    commonSkills.forEach(skill => {
      if (resume.includes(skill) || jobDesc.includes(skill)) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  // Extract job-specific keywords
  extractJobKeywords(jobDesc) {
    const words = jobDesc.split(/\s+/);
    const keywordCounts = {};
    
    words.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 characters
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
    });

    // Return top keywords by frequency
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  // Get skill vector for cosine similarity
  getSkillVector(text, skills) {
    return skills.map(skill => text.includes(skill) ? 1 : 0);
  }

  // Get keyword vector for cosine similarity
  getKeywordVector(text, keywords) {
    return keywords.map(keyword => text.includes(keyword) ? 1 : 0);
  }

  // Get experience vector (simplified - can be enhanced)
  getExperienceVector(text) {
    const experienceIndicators = [
      'experience', 'years', 'worked', 'developed', 'managed', 'led', 'created',
      'implemented', 'designed', 'built', 'maintained', 'improved', 'optimized'
    ];
    return experienceIndicators.map(indicator => text.includes(indicator) ? 1 : 0);
  }

  // Find missing skills
  findMissingSkills(resume, jobDesc, skills) {
    return skills.filter(skill => 
      jobDesc.includes(skill) && !resume.includes(skill)
    );
  }

  // Find missing keywords
  findMissingKeywords(resume, keywords) {
    return keywords.filter(keyword => !resume.includes(keyword));
  }

  // Find missing experiences
  findMissingExperiences(resume, jobDesc) {
    const experienceKeywords = [
      'leadership', 'management', 'team', 'project', 'agile', 'scrum',
      'mentoring', 'training', 'collaboration', 'communication'
    ];
    
    return experienceKeywords.filter(keyword => 
      jobDesc.includes(keyword) && !resume.includes(keyword)
    );
  }

  // Generate improvement suggestions
  generateImprovementSuggestions(missingSkills, missingKeywords, missingExperiences, score) {
    const suggestions = [];
    
    if (missingSkills.length > 0) {
      suggestions.push(`Develop skills in: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    
    if (missingKeywords.length > 0) {
      suggestions.push(`Include relevant keywords: ${missingKeywords.slice(0, 3).join(', ')}`);
    }
    
    if (missingExperiences.length > 0) {
      suggestions.push(`Highlight experience in: ${missingExperiences.slice(0, 3).join(', ')}`);
    }
    
    if (score < 50) {
      suggestions.push('Consider gaining more relevant experience in the target field');
    }
    
    if (score < 30) {
      suggestions.push('Focus on developing core skills required for this role');
    }
    
    return suggestions.length > 0 ? suggestions : ['Your profile looks well-aligned with this position'];
  }

  // Generate summary
  generateSummary(score, skillSim, keywordSim, experienceSim) {
    if (score >= 80) {
      return `Excellent match! Your skills and experience align very well with this position. Strong technical skills (${Math.round(skillSim * 100)}% match) and relevant keywords (${Math.round(keywordSim * 100)}% match) make you a great candidate.`;
    } else if (score >= 60) {
      return `Good match with room for improvement. Your background shows promise with ${Math.round(skillSim * 100)}% skill alignment and ${Math.round(keywordSim * 100)}% keyword relevance.`;
    } else if (score >= 40) {
      return `Moderate match. While you have some relevant experience (${Math.round(experienceSim * 100)}% match), consider developing more specific skills and keywords for this role.`;
    } else {
      return `Limited match. Significant skill development and experience building needed to align with this position's requirements.`;
    }
  }

  // Determine what matters most
  determineWhatMattersMost(keywords, skills, score) {
    if (score >= 80) {
      return 'Strong technical skills and relevant experience are your key strengths for this role.';
    } else if (score >= 60) {
      return 'Focus on developing specific technical skills and gaining relevant project experience.';
    } else {
      return 'Build foundational skills and gain hands-on experience in the target field.';
    }
  }

  // Helper method to categorize skills
  categorizeSkill(skill) {
    const hardSkills = ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes', 'machine learning', 'ai', 'data analysis', 'statistics', 'programming', 'coding', 'development', 'engineering'];
    const softSkills = ['leadership', 'communication', 'teamwork', 'problem solving', 'creativity', 'adaptability', 'time management', 'organization', 'collaboration'];
    
    const skillLower = skill.toLowerCase();
    
    if (hardSkills.some(hardSkill => skillLower.includes(hardSkill))) {
      return 'Hard Skill';
    } else if (softSkills.some(softSkill => skillLower.includes(softSkill))) {
      return 'Soft Skill';
    } else {
      return 'Core';
    }
  }
}

const aiService = new AIService();
export default aiService;
