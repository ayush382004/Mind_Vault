// Background script for processing audio and generating insights
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processAudio') {
    processAudioData(request.audioData, request.transcription);
    sendResponse({status: 'processed'});
  } else if (request.action === 'generateInsights') {
    generateInsightsFromTranscription(request.transcription)
      .then((result) => {
        sendResponse({status: 'success', insights: result});
      })
      .catch((error) => {
        console.error('Error in generateInsights:', error);
        sendResponse({status: 'error', error: error.message});
      });
    return true; // Keep message channel open for async response
  }
});

async function processAudioData(audioData, transcription) {
  try {
    console.log('Audio data received, transcription length:', transcription.length);
    
    // Store the complete transcription
    const meetingData = {
      timestamp: new Date().toISOString(),
      transcription: transcription,
      processed: false
    };
    
    const storageKey = `meeting_${Date.now()}`;
    await chrome.storage.local.set({
      [storageKey]: meetingData
    });
    
    console.log('Meeting data stored with key:', storageKey);
    
  } catch (error) {
    console.error('Error processing audio:', error);
  }
}

async function generateInsightsFromTranscription(transcriptionText) {
  try {
    console.log('Generating insights for transcription:', transcriptionText.substring(0, 100) + '...');
    
    // Get API key from storage
    const result = await chrome.storage.sync.get(['groqApiKey']);
    if (!result.groqApiKey) {
      console.error('Groq API key not found');
      throw new Error('Groq API key not configured');
    }
    
    const insights = await callGroqAPI(transcriptionText, result.groqApiKey);
    console.log('Insights generated:', insights);
    
    // Store insights with a unique key
    const meetingInsights = {
      timestamp: new Date().toISOString(),
      transcription: transcriptionText,
      insights: insights,
      processed: true
    };
    
    const storageKey = `meeting_${Date.now()}`;
    await chrome.storage.local.set({
      [storageKey]: meetingInsights
    });
    
    console.log('Meeting insights stored with key:', storageKey);
    
    // Send to website if configured
    try {
      await sendToWebsite(meetingInsights);
    } catch (websiteError) {
      console.log('Website sending failed (optional):', websiteError.message);
    }
    
    return meetingInsights;
    
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Store error state for debugging
    const errorData = {
      timestamp: new Date().toISOString(),
      transcription: transcriptionText,
      error: error.message,
      processed: false
    };
    
    const storageKey = `meeting_error_${Date.now()}`;
    await chrome.storage.local.set({
      [storageKey]: errorData
    });
    
    throw error;
  }
}

// Helper function to extract JSON from text that may contain additional content
function extractJsonFromText(text) {
  // Look for JSON object patterns
  const jsonPattern = /\{[\s\S]*\}/;
  const match = text.match(jsonPattern);
  
  if (match) {
    try {
      // Try to parse the extracted JSON
      return JSON.parse(match[0]);
    } catch (parseError) {
      console.warn('Failed to parse extracted JSON:', parseError);
      // If that fails, try to find the largest valid JSON object
      const openBrace = text.indexOf('{');
      const closeBrace = text.lastIndexOf('}');
      
      if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
        const jsonString = text.substring(openBrace, closeBrace + 1);
        return JSON.parse(jsonString);
      }
    }
  }
  
  throw new Error('No valid JSON found in text');
}

async function callGroqAPI(transcription, apiKey) {
  const prompt = `
    Analyze the following meeting transcription and provide your response ONLY as a JSON object with this exact structure:
    
    {
      "summary": "Brief meeting summary",
      "keyInsights": ["insight1", "insight2"],
      "actionItems": [
        {
          "task": "description",
          "assignee": "person or unknown",
          "priority": "high|medium|low",
          "dueDate": "if mentioned or null"
        }
      ],
      "decisions": ["decision1", "decision2"],
      "followUps": ["followup1", "followup2"]
    }
    
    Important: Return ONLY the JSON object, no additional text, explanations, or formatting.
    
    Transcription:
    ${transcription}
  `;
  
  console.log('Calling Groq API...');
  
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'compound-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a meeting analysis assistant. Always respond with valid JSON only, no additional text or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent JSON output
      max_tokens: 2048
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('Groq API response:', data);
  
  if (data.choices && data.choices[0]) {
    try {
      const content = data.choices[0].message.content.trim();
      console.log('Raw content from Groq:', content);
      
      // First try direct JSON parsing
      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch (directParseError) {
        console.log('Direct JSON parse failed, trying extraction...');
        
        // Try to extract JSON from the content
        const extracted = extractJsonFromText(content);
        console.log('Successfully extracted JSON:', extracted);
        return extracted;
      }
      
    } catch (parseError) {
      console.error('Error parsing insights JSON:', parseError);
      console.log('Raw content that failed to parse:', data.choices[0].message.content);
      
      // Return a fallback structure with raw content
      return {
        summary: data.choices[0].message.content,
        keyInsights: ["Failed to parse structured insights - see summary for raw content"],
        actionItems: [],
        decisions: [],
        followUps: []
      };
    }
  }
  
  throw new Error('Invalid response from Groq API');
}

async function sendToWebsite(meetingData) {
  try {
    // Get website URL from storage
    const result = await chrome.storage.sync.get(['websiteUrl']);
    if (!result.websiteUrl) {
      console.log('Website URL not configured');
      return;
    }
    
    const response = await fetch(`${result.websiteUrl}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });
    
    if (response.ok) {
      console.log('Meeting data sent to website successfully');
    } else {
      console.error('Failed to send to website:', response.status, await response.text());
    }
    
  } catch (error) {
    console.error('Error sending to website:', error);
    throw error;
  }
}