import express from 'express';
const router = express.Router();

// In-memory storage for meetings (replace with your database)
let meetings = [];

console.log('🚀 Meeting router initialized');
console.log('📊 Initial meetings array:', meetings);

// Middleware to validate meeting data
const validateMeetingData = (req, res, next) => {
  console.log('🔍 Validating meeting data...');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  const { timestamp, transcription, insights } = req.body;
  
  console.log('🏷️ Extracted fields:');
  console.log('  - timestamp:', timestamp);
  console.log('  - transcription length:', transcription ? transcription.length : 'undefined');
  console.log('  - insights:', insights ? 'present' : 'not present');
  
  if (!timestamp || !transcription) {
    console.log('❌ Validation failed - missing required fields');
    console.log('  - timestamp missing:', !timestamp);
    console.log('  - transcription missing:', !transcription);
    
    return res.status(400).json({
      error: 'Missing required fields: timestamp and transcription are required'
    });
  }
  
  console.log('✅ Validation passed');
  next();
};

// POST /api/meetings - Receive meeting data from Chrome extension
router.post('/', validateMeetingData, async (req, res) => {
  console.log('\n🔄 POST /api/meetings - Starting meeting creation...');
  console.log('📅 Request timestamp:', new Date().toISOString());
  
  try {
    const meetingData = {
      id: Date.now().toString(), // Simple ID generation
      timestamp: req.body.timestamp,
      transcription: req.body.transcription,
      insights: req.body.insights || null,
      processed: req.body.processed || false,
      duration: req.body.duration || null,
      participants: req.body.participants || [],
      createdAt: new Date().toISOString(),
      ...req.body // Include any additional fields
    };

    console.log('📋 Meeting data created:');
    console.log('  - ID:', meetingData.id);
    console.log('  - Timestamp:', meetingData.timestamp);
    console.log('  - Transcription length:', meetingData.transcription.length);
    console.log('  - Has insights:', !!meetingData.insights);
    console.log('  - Processed:', meetingData.processed);
    console.log('  - Duration:', meetingData.duration);
    console.log('  - Participants count:', meetingData.participants.length);
    console.log('  - Created at:', meetingData.createdAt);

    // Store meeting (replace with database save)
    const previousCount = meetings.length;
    meetings.unshift(meetingData); // Add to beginning of array
    
    console.log('💾 Meeting stored in memory');
    console.log('  - Previous count:', previousCount);
    console.log('  - New count:', meetings.length);
    
    // Keep only last 100 meetings to prevent memory issues
    if (meetings.length > 100) {
      const beforeTrim = meetings.length;
      meetings = meetings.slice(0, 100);
      console.log('✂️ Trimmed meetings array');
      console.log('  - Before trim:', beforeTrim);
      console.log('  - After trim:', meetings.length);
    }

    console.log(`✅ Meeting saved successfully: ${meetingData.id} at ${meetingData.timestamp}`);
    console.log('📊 Current meetings in memory:', meetings.length);
    
    const response = {
      message: 'Meeting data saved successfully',
      id: meetingData.id,
      timestamp: meetingData.timestamp
    };
    
    console.log('📤 Sending response:', response);
    res.status(201).json(response);

  } catch (error) {
    console.error('💥 Error saving meeting:', error);
    console.error('📍 Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to save meeting data',
      details: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// GET /api/meetings - Get all meetings
router.get('/', async (req, res) => {
  console.log('\n🔄 GET /api/meetings - Fetching meetings...');
  console.log('📅 Request timestamp:', new Date().toISOString());
  console.log('🔍 Query parameters:', req.query);
  
  try {
    const { limit = 20, offset = 0, processed } = req.query;
    
    console.log('⚙️ Processing parameters:');
    console.log('  - limit:', limit, '(type:', typeof limit, ')');
    console.log('  - offset:', offset, '(type:', typeof offset, ')');
    console.log('  - processed filter:', processed);
    
    let filteredMeetings = meetings;
    console.log('📊 Total meetings before filtering:', filteredMeetings.length);
    
    // Filter by processed status if specified
    if (processed !== undefined) {
      const isProcessed = processed === 'true';
      console.log('🔍 Filtering by processed status:', isProcessed);
      
      const beforeFilter = filteredMeetings.length;
      filteredMeetings = meetings.filter(meeting => meeting.processed === isProcessed);
      
      console.log('📊 After processed filter:');
      console.log('  - Before:', beforeFilter);
      console.log('  - After:', filteredMeetings.length);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    
    console.log('📄 Pagination:');
    console.log('  - Start index:', startIndex);
    console.log('  - End index:', endIndex);
    
    const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);
    
    console.log('📊 Pagination results:');
    console.log('  - Filtered total:', filteredMeetings.length);
    console.log('  - Returned count:', paginatedMeetings.length);
    console.log('  - Has more:', endIndex < filteredMeetings.length);
    
    const response = {
      meetings: paginatedMeetings,
      total: filteredMeetings.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: endIndex < filteredMeetings.length
    };
    
    console.log('📤 Sending response with', response.meetings.length, 'meetings');
    console.log('📊 Response metadata:', {
      total: response.total,
      limit: response.limit,
      offset: response.offset,
      hasMore: response.hasMore
    });
    
    res.json(response);

  } catch (error) {
    console.error('💥 Error fetching meetings:', error);
    console.error('📍 Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to fetch meetings',
      details: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// GET /api/meetings/:id - Get specific meeting
router.get('/:id', async (req, res) => {
  console.log('\n🔄 GET /api/meetings/:id - Fetching specific meeting...');
  console.log('📅 Request timestamp:', new Date().toISOString());
  
  try {
    const { id } = req.params;
    console.log('🔍 Looking for meeting ID:', id);
    console.log('📊 Total meetings to search:', meetings.length);
    
    const meeting = meetings.find(m => m.id === id);
    
    if (!meeting) {
      console.log('❌ Meeting not found');
      console.log('📋 Available meeting IDs:', meetings.map(m => m.id));
      
      const errorResponse = { error: 'Meeting not found' };
      console.log('📤 Sending 404 response:', errorResponse);
      
      return res.status(404).json(errorResponse);
    }
    
    console.log('✅ Meeting found:');
    console.log('  - ID:', meeting.id);
    console.log('  - Timestamp:', meeting.timestamp);
    console.log('  - Transcription length:', meeting.transcription.length);
    console.log('  - Has insights:', !!meeting.insights);
    console.log('  - Processed:', meeting.processed);
    
    console.log('📤 Sending meeting data');
    res.json(meeting);

  } catch (error) {
    console.error('💥 Error fetching meeting:', error);
    console.error('📍 Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to fetch meeting',
      details: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// DELETE /api/meetings/:id - Delete specific meeting
router.delete('/:id', async (req, res) => {
  console.log('\n🔄 DELETE /api/meetings/:id - Deleting specific meeting...');
  console.log('📅 Request timestamp:', new Date().toISOString());
  
  try {
    const { id } = req.params;
    console.log('🗑️ Attempting to delete meeting ID:', id);
    
    const initialLength = meetings.length;
    console.log('📊 Meetings before deletion:', initialLength);
    
    meetings = meetings.filter(m => m.id !== id);
    
    console.log('📊 Meetings after deletion:', meetings.length);
    console.log('📊 Meetings removed:', initialLength - meetings.length);
    
    if (meetings.length === initialLength) {
      console.log('❌ No meeting was deleted - ID not found');
      console.log('📋 Available meeting IDs:', meetings.map(m => m.id));
      
      const errorResponse = { error: 'Meeting not found' };
      console.log('📤 Sending 404 response:', errorResponse);
      
      return res.status(404).json(errorResponse);
    }
    
    console.log('✅ Meeting deleted successfully');
    const response = { message: 'Meeting deleted successfully' };
    console.log('📤 Sending success response:', response);
    
    res.json(response);

  } catch (error) {
    console.error('💥 Error deleting meeting:', error);
    console.error('📍 Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to delete meeting',
      details: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// DELETE /api/meetings - Delete all meetings
router.delete('/', async (req, res) => {
  console.log('\n🔄 DELETE /api/meetings - Deleting all meetings...');
  console.log('📅 Request timestamp:', new Date().toISOString());
  
  try {
    const count = meetings.length;
    console.log('🗑️ Deleting all meetings. Current count:', count);
    
    meetings = [];
    
    console.log('✅ All meetings deleted');
    console.log('📊 New meetings count:', meetings.length);
    
    const response = {
      message: `${count} meetings deleted successfully`
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('💥 Error deleting meetings:', error);
    console.error('📍 Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to delete meetings',
      details: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// GET /api/meetings/stats/summary - Get meeting statistics
router.get('/stats/summary', async (req, res) => {
  console.log('\n🔄 GET /api/meetings/stats/summary - Calculating statistics...');
  console.log('📅 Request timestamp:', new Date().toISOString());
  
  try {
    const totalMeetings = meetings.length;
    console.log('📊 Total meetings:', totalMeetings);
    
    const processedMeetings = meetings.filter(m => m.processed).length;
    console.log('📊 Processed meetings:', processedMeetings);
    
    const pendingMeetings = totalMeetings - processedMeetings;
    console.log('📊 Pending meetings:', pendingMeetings);
    
    // Calculate total action items
    console.log('🔍 Calculating action items...');
    const totalActionItems = meetings.reduce((total, meeting, index) => {
      const actionItemsCount = meeting.insights && meeting.insights.actionItems ? meeting.insights.actionItems.length : 0;
      if (actionItemsCount > 0) {
        console.log(`  - Meeting ${index + 1} (ID: ${meeting.id}): ${actionItemsCount} action items`);
      }
      return total + actionItemsCount;
    }, 0);
    
    console.log('📊 Total action items:', totalActionItems);
    
    // Get recent meetings (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    console.log('📅 Week ago cutoff:', weekAgo.toISOString());
    
    const recentMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.timestamp);
      const isRecent = meetingDate > weekAgo;
      if (isRecent) {
        console.log(`  - Recent meeting: ${meeting.id} (${meeting.timestamp})`);
      }
      return isRecent;
    }).length;
    
    console.log('📊 Recent meetings (last 7 days):', recentMeetings);
    
    const lastMeetingDate = meetings.length > 0 ? meetings[0].timestamp : null;
    console.log('📅 Last meeting date:', lastMeetingDate);
    
    const response = {
      totalMeetings,
      processedMeetings,
      pendingMeetings,
      totalActionItems,
      recentMeetings,
      lastMeetingDate
    };
    
    console.log('📊 Statistics summary:');
    console.log(JSON.stringify(response, null, 2));
    console.log('📤 Sending statistics response');
    
    res.json(response);

  } catch (error) {
    console.error('💥 Error fetching stats:', error);
    console.error('📍 Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to fetch statistics',
      details: error.message
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

console.log('🎯 Meeting router setup complete with all endpoints registered');
export default router;