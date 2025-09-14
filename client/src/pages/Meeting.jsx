import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, CheckCircle, XCircle, Trash2, BarChart3, RefreshCw } from 'lucide-react';

const MeetingDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, processed, pending
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Replace with your actual backend URL
  const API_BASE_URL = 'http://localhost:5000/api/meetings';

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const processedParam = filter === 'all' ? '' : `?processed=${filter === 'processed'}`;
      const response = await fetch(`${API_BASE_URL}${processedParam}`);
      if (!response.ok) throw new Error('Failed to fetch meetings');
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/summary`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const deleteMeeting = async (id) => {
    try {
      setDeleteLoading(id);
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete meeting');
      await fetchMeetings();
      await fetchStats();
      if (selectedMeeting && selectedMeeting.id === id) {
        setSelectedMeeting(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const deleteAllMeetings = async () => {
    if (!confirm('Are you sure you want to delete all meetings? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete all meetings');
      await fetchMeetings();
      await fetchStats();
      setSelectedMeeting(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMeetingDetails = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch meeting details');
      const data = await response.json();
      setSelectedMeeting(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchStats();
  }, [filter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-lg text-zinc-300">Loading meetings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-300">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-zinc-400">Total Meetings</p>
                  <p className="text-2xl font-bold text-white">{stats.totalMeetings}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-zinc-400">Processed</p>
                  <p className="text-2xl font-bold text-white">{stats.processedMeetings}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-zinc-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingMeetings}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-zinc-400">Action Items</p>
                  <p className="text-2xl font-bold text-white">{stats.totalActionItems}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-zinc-300">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-zinc-700 border border-zinc-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Meetings</option>
                <option value="processed">Processed Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => { fetchMeetings(); fetchStats(); }}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {meetings.length > 0 && (
                <button
                  onClick={deleteAllMeetings}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meeting List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg">
            <div className="p-6 border-b border-zinc-700">
              <h2 className="text-xl font-semibold text-white">
                Meetings ({meetings.length})
              </h2>
            </div>
            
            <div className="divide-y divide-zinc-700 max-h-96 overflow-y-auto">
              {meetings.length === 0 ? (
                <div className="p-6 text-center text-zinc-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                  <p>No meetings found</p>
                  <p className="text-sm mt-1">
                    {filter === 'all' ? 'No meetings have been recorded yet.' : 
                     filter === 'processed' ? 'No processed meetings found.' : 
                     'No pending meetings found.'}
                  </p>
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className={`p-4 hover:bg-zinc-700/50 cursor-pointer transition-colors ${
                      selectedMeeting && selectedMeeting.id === meeting.id ? 'bg-blue-900/30 border-r-4 border-blue-400' : ''
                    }`}
                    onClick={() => fetchMeetingDetails(meeting.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            meeting.processed 
                              ? 'bg-green-900/30 text-green-300 border border-green-700/50' 
                              : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50'
                          }`}>
                            {meeting.processed ? 'Processed' : 'Pending'}
                          </span>
                          {meeting.duration && (
                            <span className="text-xs text-zinc-500">
                              {meeting.duration}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-white mb-1">
                          {formatDate(meeting.timestamp)}
                        </p>
                        
                        <p className="text-sm text-zinc-300 mb-2">
                          {truncateText(meeting.transcription)}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-zinc-500">
                          {meeting.participants && meeting.participants.length > 0 && (
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {meeting.participants.length} participants
                            </div>
                          )}
                          
                          {meeting.insights && meeting.insights.actionItems && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {meeting.insights.actionItems.length} action items
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMeeting(meeting.id);
                        }}
                        disabled={deleteLoading === meeting.id}
                        className="ml-2 p-1 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                      >
                        {deleteLoading === meeting.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Meeting Details */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg shadow-lg">
            <div className="p-6 border-b border-zinc-700">
              <h2 className="text-xl font-semibold text-white">
                Meeting Details
              </h2>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {selectedMeeting ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Meeting Information</h3>
                    <div className="bg-zinc-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-400">ID:</span>
                        <span className="text-sm font-mono text-zinc-300">{selectedMeeting.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-400">Date:</span>
                        <span className="text-sm text-zinc-300">{formatDate(selectedMeeting.timestamp)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-400">Status:</span>
                        <span className={`text-sm font-medium ${
                          selectedMeeting.processed ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {selectedMeeting.processed ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                      {selectedMeeting.duration && (
                        <div className="flex justify-between">
                          <span className="text-sm text-zinc-400">Duration:</span>
                          <span className="text-sm text-zinc-300">{selectedMeeting.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white mb-2">Participants</h3>
                      <div className="bg-zinc-700/50 rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedMeeting.participants.map((participant, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/50">
                              {participant}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Transcription</h3>
                    <div className="bg-zinc-700/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedMeeting.transcription}</p>
                    </div>
                  </div>

                  {selectedMeeting.insights && (
                    <div>
                      <h3 className="text-sm font-medium text-white mb-2">Insights</h3>
                      <div className="bg-zinc-700/50 rounded-lg p-4 space-y-4">
                        {selectedMeeting.insights.actionItems && selectedMeeting.insights.actionItems.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-white mb-2">Action Items</h4>
                            <ul className="space-y-2">
                              {selectedMeeting.insights.actionItems.map((item, index) => (
                                <li key={index} className="text-sm text-zinc-300">
                                  {typeof item === 'string' ? (
                                    <div className="flex items-start">
                                      <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                                      {item}
                                    </div>
                                  ) : (
                                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-600">
                                      <div className="flex items-start">
                                        <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="font-medium text-white mb-1">{item.task}</p>
                                          <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                                            {item.assignee && (
                                              <span className="flex items-center">
                                                <Users className="h-3 w-3 mr-1" />
                                                {item.assignee}
                                              </span>
                                            )}
                                            {item.priority && (
                                              <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                item.priority.toLowerCase() === 'high' ? 'bg-red-900/30 text-red-300 border border-red-700/50' :
                                                item.priority.toLowerCase() === 'medium' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' :
                                                'bg-green-900/30 text-green-300 border border-green-700/50'
                                              }`}>
                                                {item.priority}
                                              </span>
                                            )}
                                            {item.dueDate && (
                                              <span className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {item.dueDate}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {typeof selectedMeeting.insights === 'string' && (
                          <div>
                            <h4 className="text-xs font-medium text-white mb-2">Summary</h4>
                            <p className="text-sm text-zinc-300">{selectedMeeting.insights}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">Select a meeting to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDashboard;