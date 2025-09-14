// Meet Transcriber Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const groqApiKeyInput = document.getElementById('groq-api-key');
  const websiteUrlInput = document.getElementById('website-url');
  const saveConfigBtn = document.getElementById('save-config');
  const viewWebsiteBtn = document.getElementById('view-website');
  const statusMessage = document.getElementById('status-message');
  const refreshMeetingsBtn = document.getElementById('refresh-meetings');
  const recentMeetingsDiv = document.getElementById('recent-meetings');
  const clearStorageBtn = document.getElementById('clear-storage');

  // Load saved configuration
  loadConfig();
  
  // Load recent meetings
  loadRecentMeetings();

  // Event listeners
  saveConfigBtn.addEventListener('click', saveConfiguration);
  viewWebsiteBtn.addEventListener('click', openWebsiteDashboard);
  refreshMeetingsBtn.addEventListener('click', loadRecentMeetings);
  clearStorageBtn.addEventListener('click', clearAllData);

  function loadConfig() {
    chrome.storage.sync.get(['groqApiKey', 'websiteUrl'], function(result) {
      if (result.groqApiKey) {
        groqApiKeyInput.value = result.groqApiKey;
      }
      if (result.websiteUrl) {
        websiteUrlInput.value = result.websiteUrl;
      }
    });
  }

  function saveConfiguration() {
    const groqApiKey = groqApiKeyInput.value.trim();
    const websiteUrl = websiteUrlInput.value.trim();

    if (!groqApiKey) {
      showStatus('Please enter a Groq API key', 'error');
      return;
    }

    chrome.storage.sync.set({
      groqApiKey: groqApiKey,
      websiteUrl: websiteUrl
    }, function() {
      showStatus('Configuration saved successfully!', 'success');
    });
  }

  function openWebsiteDashboard() {
    chrome.storage.sync.get(['websiteUrl'], function(result) {
      if (result.websiteUrl) {
        chrome.tabs.create({ url: result.websiteUrl });
      } else {
        showStatus('Please set a website URL first', 'error');
      }
    });
  }

  function loadRecentMeetings() {
    chrome.storage.local.get(null, function(items) {
      const meetings = [];
      
      // Filter and collect meeting data
      for (const key in items) {
        if (key.startsWith('meeting_')) {
          const meetingData = items[key];
          if (meetingData && meetingData.timestamp) {
            meetings.push({
              id: key,
              ...meetingData
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      meetings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      displayMeetings(meetings.slice(0, 5)); // Show last 5 meetings
    });
  }

  function displayMeetings(meetings) {
    if (meetings.length === 0) {
      recentMeetingsDiv.innerHTML = `
        <div class="meeting-item">
          <div class="meeting-date">No meetings found</div>
          <div class="meeting-summary">Start a Google Meet to see transcriptions here</div>
        </div>
      `;
      return;
    }

    const meetingsHtml = meetings.map(meeting => {
      const date = new Date(meeting.timestamp).toLocaleDateString();
      const time = new Date(meeting.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const status = meeting.insights ? 'processed' : 'pending';
      const duration = meeting.duration || 'Unknown';
      const participantCount = meeting.participants ? meeting.participants.length : 0;
      const actionCount = meeting.insights && meeting.insights.actionItems ? meeting.insights.actionItems.length : 0;
      
      // Create a brief summary from the transcription
      let summary = 'No summary available';
      if (meeting.insights && meeting.insights.summary) {
        summary = meeting.insights.summary.substring(0, 100) + (meeting.insights.summary.length > 100 ? '...' : '');
      } else if (meeting.transcription) {
        summary = meeting.transcription.substring(0, 100) + (meeting.transcription.length > 100 ? '...' : '');
      }

      let actionSt = 'No task available';

        if (meeting.insights && meeting.insights.actionItems && meeting.insights.actionItems.length > 0) {
        const taskItem = meeting.insights.actionItems[0];
        const task = taskItem.task;
        const truncatedTask = task.length > 100 ? task.substring(0, 100) + '...' : task;
        const assignee = taskItem.assignee || 'Unassigned';
        const dueDate = taskItem.dueDate || 'No due date';

        actionSt = `Task: ${truncatedTask}\nAssignee: ${assignee}\nDue Date: ${dueDate}`;
        }


      return `
        <div class="meeting-item" onclick="showMeetingDetails('${meeting.id}')">
          <div class="meeting-header">
            <div class="meeting-date">${date} at ${time}</div>
            <div class="meeting-status ${status}">●</div>
          </div>
          <div class="meeting-summary">${summary}</div>
          <div class="meeting-actionSt">${actionSt}</div>
          <div class="meeting-stats">
            <div class="stat">${duration}</div>
            <div class="stat">${participantCount} participants</div>
            <div class="stat">${actionCount} actions</div>
          </div>
        </div>
      `;
    }).join('');

    recentMeetingsDiv.innerHTML = meetingsHtml;
  }

  function clearAllData() {
    if (confirm('Are you sure you want to clear all meeting data? This cannot be undone.')) {
      chrome.storage.local.clear(function() {
        showStatus('All data cleared successfully', 'success');
        loadRecentMeetings();
      });
    }
  }

  function showStatus(message, type) {
    statusMessage.innerHTML = `<div class="status ${type}">${message}</div>`;
    setTimeout(() => {
      statusMessage.innerHTML = '';
    }, 3000);
  }

  // Make showMeetingDetails available globally
  window.showMeetingDetails = function(meetingId) {
    chrome.storage.local.get([meetingId], function(result) {
      const meetingData = result[meetingId];
      if (meetingData) {
        displayMeetingModal(meetingData);
      }
    });
  };

  function displayMeetingModal(meetingData) {
    // Create modal HTML
    const modalHtml = `
      <div class="modal" id="meeting-modal">
        <div class="modal-content">
          <span class="close" onclick="closeMeetingModal()">&times;</span>
          <h2>Meeting Details</h2>
          <p><strong>Date:</strong> ${new Date(meetingData.timestamp).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${meetingData.duration || 'Unknown'}</p>
          <p><strong>Participants:</strong> ${meetingData.participants ? meetingData.participants.length : 0}</p>
          
          ${meetingData.insights ? `
            <div class="insights">
              <h4>📝 Summary</h4>
              <p>${meetingData.insights.summary || 'No summary available'}</p>
              
              <h4>🔑 Key Points</h4>
              ${meetingData.insights.keyPoints && meetingData.insights.keyPoints.length > 0 ? 
                '<ul>' + meetingData.insights.keyPoints.map(point => `<li>${point}</li>`).join('') + '</ul>' :
                '<p>No key points identified</p>'
              }
              
              <h4>✅ Action Items</h4>
              ${meetingData.insights.actions && meetingData.insights.actions.length > 0 ? 
                '<ul>' + meetingData.insights.actions.map(action => `<li><strong>${action.assignee || 'Unassigned'}:</strong> ${action.task} <em>(Due: ${action.deadline || 'No deadline'})</em></li>`).join('') + '</ul>' :
                '<p>No action items identified</p>'
              }
              
              <h4>🤝 Decisions Made</h4>
              ${meetingData.insights.decisions && meetingData.insights.decisions.length > 0 ? 
                '<ul>' + meetingData.insights.decisions.map(decision => `<li>${decision}</li>`).join('') + '</ul>' :
                '<p>No decisions recorded</p>'
              }
              
              <h4>❓ Follow-up Questions</h4>
              ${meetingData.insights.followUpQuestions && meetingData.insights.followUpQuestions.length > 0 ? 
                '<ul>' + meetingData.insights.followUpQuestions.map(question => `<li>${question}</li>`).join('') + '</ul>' :
                '<p>No follow-up questions identified</p>'
              }
            </div>
          ` : '<p>Processing insights...</p>'}
          
          <h4>📜 Full Transcription</h4>
          <div class="transcription">
            ${meetingData.transcription || 'No transcription available'}
          </div>
          
          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="button" onclick="exportMeeting('${meetingData.timestamp}')">Export as Text</button>
            <button class="button secondary" onclick="copyToClipboard('${meetingData.timestamp}')">Copy Summary</button>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('meeting-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    document.getElementById('meeting-modal').style.display = 'block';
  }

  // Make modal functions available globally
  window.closeMeetingModal = function() {
    const modal = document.getElementById('meeting-modal');
    if (modal) {
      modal.remove();
    }
  };

  window.exportMeeting = function(timestamp) {
    chrome.storage.local.get([`meeting_${timestamp}`], function(result) {
      const meetingData = result[`meeting_${timestamp}`];
      if (meetingData) {
        const exportText = generateExportText(meetingData);
        downloadTextFile(exportText, `meeting_${timestamp}.txt`);
      }
    });
  };

  window.copyToClipboard = function(timestamp) {
    chrome.storage.local.get([`meeting_${timestamp}`], function(result) {
      const meetingData = result[`meeting_${timestamp}`];
      if (meetingData && meetingData.insights) {
        const summaryText = `
Meeting Summary - ${new Date(meetingData.timestamp).toLocaleString()}

Summary: ${meetingData.insights.summary || 'No summary available'}

Key Points:
${meetingData.insights.keyPoints ? meetingData.insights.keyPoints.map(point => `• ${point}`).join('\n') : 'None identified'}

Action Items:
${meetingData.insights.actions ? meetingData.insights.actions.map(action => `• ${action.assignee || 'Unassigned'}: ${action.task} (Due: ${action.deadline || 'No deadline'})`).join('\n') : 'None identified'}

Decisions:
${meetingData.insights.decisions ? meetingData.insights.decisions.map(decision => `• ${decision}`).join('\n') : 'None recorded'}
        `.trim();

        navigator.clipboard.writeText(summaryText).then(() => {
          showStatus('Summary copied to clipboard!', 'success');
        });
      }
    });
  };

  function generateExportText(meetingData) {
    return `
MEETING TRANSCRIPT AND ANALYSIS
================================

Date: ${new Date(meetingData.timestamp).toLocaleString()}
Duration: ${meetingData.duration || 'Unknown'}
Participants: ${meetingData.participants ? meetingData.participants.length : 0}

${meetingData.insights ? `
EXECUTIVE SUMMARY
-----------------
${meetingData.insights.summary || 'No summary available'}

KEY POINTS
----------
${meetingData.insights.keyPoints ? meetingData.insights.keyPoints.map(point => `• ${point}`).join('\n') : 'None identified'}

ACTION ITEMS
------------
${meetingData.insights.actions ? meetingData.insights.actions.map(action => `• ${action.assignee || 'Unassigned'}: ${action.task} (Due: ${action.deadline || 'No deadline'})`).join('\n') : 'None identified'}

DECISIONS MADE
--------------
${meetingData.insights.decisions ? meetingData.insights.decisions.map(decision => `• ${decision}`).join('\n') : 'None recorded'}

FOLLOW-UP QUESTIONS
-------------------
${meetingData.insights.followUpQuestions ? meetingData.insights.followUpQuestions.map(question => `• ${question}`).join('\n') : 'None identified'}
` : 'Processing insights...'}

FULL TRANSCRIPTION
------------------
${meetingData.transcription || 'No transcription available'}
    `.trim();
  }

  function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('meeting-modal');
    if (event.target === modal) {
      closeMeetingModal();
    }
  });
});