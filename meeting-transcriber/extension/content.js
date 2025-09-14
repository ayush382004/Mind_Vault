// Content script for Google Meet transcription
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let transcriptionBuffer = [];
let recognition = null;

// Wait for the page to load
window.addEventListener('load', () => {
  console.log('Google Meet Transcriber loaded');
  initializeTranscription();
});

function initializeTranscription() {
  // Create floating control panel
  createControlPanel();
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startRecording') {
      startRecording();
      sendResponse({status: 'started'});
    } else if (request.action === 'stopRecording') {
      stopRecording();
      sendResponse({status: 'stopped'});
    } else if (request.action === 'getStatus') {
      sendResponse({isRecording: isRecording});
    }
  });
}

function createControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'transcription-panel';
  panel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 200px;
    ">
      <h3 style="margin: 0 0 10px 0; font-size: 14px;">Meet Transcriber</h3>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <button id="start-btn" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Start</button>
        <button id="stop-btn" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        " disabled>Stop</button>
      </div>
      <div id="status" style="font-size: 12px; color: #9ca3af;">Ready to record</div>
      <div id="transcription-preview" style="
        font-size: 10px; 
        color: #9ca3af; 
        margin-top: 10px; 
        max-height: 60px; 
        overflow-y: auto;
        background: rgba(255,255,255,0.1);
        padding: 5px;
        border-radius: 4px;
        display: none;
      "></div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners
  document.getElementById('start-btn').addEventListener('click', startRecording);
  document.getElementById('stop-btn').addEventListener('click', stopRecording);
}

async function startRecording() {
  try {
    // Start speech recognition only (no audio recording for now)
    startSpeechRecognition();
    isRecording = true;
    updateUI();
    updateStatus('Recording speech... Listening for audio');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    updateStatus('Error: Could not start recording');
  }
}

function stopRecording() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
  
  isRecording = false;
  updateUI();
  
  // Process final transcription and generate insights
  generateInsights();
}

function startSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      updateStatus('Listening for speech...');
    };
    
    recognition.onresult = (event) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          
          // Add to transcription buffer
          transcriptionBuffer.push({
            text: transcript,
            timestamp: new Date().toISOString(),
            confidence: event.results[i][0].confidence
          });
          
          // Update preview
          updateTranscriptionPreview(finalTranscript);
          
          // Store in chrome storage
          chrome.storage.local.set({
            'currentTranscription': transcriptionBuffer
          });
          
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results
      if (interimTranscript) {
        updateTranscriptionPreview(finalTranscript + interimTranscript);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      updateStatus(`Error: ${event.error}`);
      
      // Try to restart recognition if it's a temporary error
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (isRecording) {
            recognition.start();
          }
        }, 1000);
      }
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Restart recognition if still recording
      if (isRecording) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error('Error restarting recognition:', error);
          }
        }, 100);
      }
    };
    
    recognition.start();
    
  } else {
    updateStatus('Speech recognition not supported in this browser');
    console.error('Speech Recognition API not supported');
  }
}

function updateTranscriptionPreview(text) {
  const preview = document.getElementById('transcription-preview');
  if (preview) {
    preview.style.display = 'block';
    preview.textContent = text.slice(-200) + (text.length > 200 ? '...' : '');
    preview.scrollTop = preview.scrollHeight;
  }
}

async function generateInsights() {
  const fullTranscription = transcriptionBuffer.map(t => t.text).join(' ');
  
  if (fullTranscription.trim()) {
    updateStatus('Generating insights...');
    
    chrome.runtime.sendMessage({
      action: 'generateInsights',
      transcription: fullTranscription
    });
    
    updateStatus('Insights generated! Check the extension popup.');
  } else {
    updateStatus('No transcription to process');
  }
}

function updateUI() {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  
  if (isRecording) {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('Recording... Click stop when meeting ends');
  } else {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('Ready to record');
    
    // Hide transcription preview when not recording
    const preview = document.getElementById('transcription-preview');
    if (preview) {
      preview.style.display = 'none';
    }
  }
}

function updateStatus(message) {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = message;
  }
}