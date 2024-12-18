// src/app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { 
  Clock, 
  Brain,
  BarChart3,
  MessageSquare,
  PlusCircle,
  Search
} from 'lucide-react';
import { storageUtils } from '@/utils/storage';
import { getConsistentNow, getConsistentISOString } from '../../utils/dateUtils';

export default function Dashboard() {
  const [journalEntry, setJournalEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    const savedEntries = storageUtils.getJournalEntries();
    setJournalEntries(savedEntries);
    
    // Get the latest analysis from storage if available
    const savedAnalysis = localStorage.getItem('journalAnalysis');
    if (savedAnalysis) {
      const parsedAnalysis = JSON.parse(savedAnalysis);
      setAnalysis(parsedAnalysis);
      setLastUpdateTime(parsedAnalysis.timestamp);
    }

    // Get the health score from storage if available
    const savedHealthScore = localStorage.getItem('healthScore');
    if (savedHealthScore) {
      const parsedHealthScore = JSON.parse(savedHealthScore);
      setHealthScore(parsedHealthScore);
    }

    // Listen for health score updates
    const handleStorageChange = (e) => {
      if (e.key === 'healthScore') {
        const newHealthScore = e.newValue ? JSON.parse(e.newValue) : null;
        setHealthScore(newHealthScore);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    
    const newEntry = {
      id: getConsistentNow(),
      date: getConsistentISOString(),
      content: journalEntry
    };

    const updatedEntries = storageUtils.addJournalEntry(newEntry);
    if (updatedEntries) {
      setJournalEntries(updatedEntries);
      setJournalEntry('');
    }
  };

  const handleAnalyzeReport = async () => {
    try {
      // Send all entries in a single API call
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: journalEntries,
          type: 'batch'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze journal entries');
      }

      const analysisData = await response.json();
      const timestamp = new Date().toISOString();
      
      // Store the analysis data in localStorage
      localStorage.setItem('journalAnalysis', JSON.stringify({
        ...analysisData,
        timestamp
      }));

      // Update the analysis state
      setAnalysis(analysisData);
      setLastUpdateTime(timestamp);
      
    } catch (error) {
      console.error('Error analyzing journal entries:', error);
      alert('Failed to analyze journal entries. Please try again.');
    }
  };

  const filteredEntries = journalEntries.filter(entry =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Health Score Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Health Score</p>
                <h3 className="text-2xl font-bold">
                  {healthScore ? `${healthScore.score}%` : 'N/A'}
                </h3>
                {healthScore && (
                  <p className="text-sm text-emerald-100 mt-1">
                    Last updated: {new Date(healthScore.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-200" />
            </div>
            {healthScore?.details && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-emerald-100">Sleep Quality</p>
                  <p className="font-medium">{healthScore.details.sleep}%</p>
                </div>
                <div>
                  <p className="text-emerald-100">Exercise</p>
                  <p className="font-medium">{healthScore.details.exercise}%</p>
                </div>
                <div>
                  <p className="text-emerald-100">Active Habits</p>
                  <p className="font-medium">{healthScore.details.habits}</p>
                </div>
                <div>
                  <p className="text-emerald-100">Mood</p>
                  <p className="font-medium capitalize">{healthScore.details.mood}</p>
                </div>
              </div>
            )}
          </div>

          {/* Total Entries Card */}
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100">Total Entries</p>
                <h3 className="text-2xl font-bold">{journalEntries.length}</h3>
              </div>
              <MessageSquare className="h-8 w-8 text-violet-200" />
            </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100">Last Analysis</p>
                <h3 className="text-lg font-medium">
                  {lastUpdateTime ? new Date(lastUpdateTime).toLocaleDateString() : 'No analysis yet'}
                </h3>
              </div>
              <Brain className="h-8 w-8 text-sky-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Journal Entry Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-600" />
                Today's Journal
              </h2>
              <p className="text-sm text-gray-500 mt-1">Write freely about your day, feelings, and experiences.</p>
            </div>
            <form onSubmit={handleJournalSubmit} className="space-y-4">
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="How are you feeling today? Pour your thoughts here..."
                className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm resize-none transition-all"
              />
              <div className="flex justify-between items-center">
                <button
                  type="submit"
                  disabled={!journalEntry.trim()}
                  className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 transition-colors"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Save Entry
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAnalyzeReport}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {lastUpdateTime && new Date(lastUpdateTime).toDateString() === new Date().toDateString() ? (
                      `Updated ${new Date(lastUpdateTime).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}`
                    ) : 'Analyze Report'}
                  </button>
                  <a 
                    href="/analytics" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Health Insights
                  </a>
                </div>
              </div>
            </form>
          </div>

          {/* Journal Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Journal Timeline</h2>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[500px] pr-2 -mr-2">
              {filteredEntries.length > 0 ? (
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="border-l-2 border-violet-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors"
                    >
                      <p className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="mt-2 text-gray-700">{entry.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No entries match your search.' : 'Your journal entries will appear here. Start writing to create your first entry!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}