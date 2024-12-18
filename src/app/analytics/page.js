// src/app/analytics/page.js
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Brain, ActivitySquare, Thermometer } from 'lucide-react';
import { AnalyzeButton } from '@/components/analytics/AnalyzeButton';
import { SleepQualityChart } from '@/components/analytics/SleepQualityChart';
import { MoodTracker } from '@/components/analytics/MoodTracker';
import { SymptomFrequency } from '@/components/analytics/SymptomFrequency';
import HealthInsights from '@/components/analytics/HealthInsights';
import { storageUtils } from '@/utils/storage';
import { MessageSquare, BarChart3 } from 'lucide-react';

const determinePattern = (data) => {
  if (!data || data.length < 2) return 'Not enough data';
  
  const movingAvg = data.reduce((acc, val, i, arr) => {
    if (i < 2) return acc;
    const slice = arr.slice(i - 2, i + 1);
    const avg = slice.reduce((sum, num) => sum + num, 0) / 3;
    return [...acc, avg];
  }, []);
  
  const trend = movingAvg[movingAvg.length - 1] - movingAvg[0];
  if (Math.abs(trend) < 0.5) return 'Stable';
  return trend > 0 ? 'Improving' : 'Declining';
};

export default function Analytics() {
  const [entriesCount, setEntriesCount] = useState(7);
  const [journalEntries, setJournalEntries] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEntries = () => {
      const savedEntries = storageUtils.getJournalEntries();
      setJournalEntries(savedEntries);
    };

    // Load stored analysis data if available
    const loadStoredAnalysis = () => {
      try {
        const storedAnalysis = localStorage.getItem('journalAnalysis');
        if (storedAnalysis) {
          const parsedAnalysis = JSON.parse(storedAnalysis);
          // Check if the analysis is from today
          const analysisDate = new Date(parsedAnalysis.timestamp);
          const today = new Date();
          if (analysisDate.toDateString() === today.toDateString()) {
            setAnalysis(parsedAnalysis);
            setLastUpdateTime(parsedAnalysis.timestamp);
          }
        }
      } catch (error) {
        console.error('Error loading stored analysis:', error);
      }
    };

    const loadJournalEntries = () => {
      try {
        const storedEntries = localStorage.getItem('journalEntries');
        if (storedEntries) {
          setJournalEntries(JSON.parse(storedEntries));
        }

        // Also load any existing analysis
        const storedAnalysis = localStorage.getItem('journalAnalysis');
        if (storedAnalysis) {
          setAnalysis(JSON.parse(storedAnalysis));
        }
      } catch (error) {
        console.error('Error loading data from local storage:', error);
      }
    };

    loadEntries();
    loadStoredAnalysis();
    loadJournalEntries();
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'journalAnalysis') {
        loadStoredAnalysis();
      } else if (e.key === 'journalEntries') {
        loadEntries();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const processAnalysisResults = (results) => {
    if (!results || results.length === 0) return null;

    const validResults = results.filter(r => !r.error);
    
    // Calculate averages and aggregate metrics
    const metrics = validResults.reduce((acc, result) => {
      const metrics = result.metrics || {};
      return {
        sleep: acc.sleep + (metrics.sleep || 0),
        exercise: acc.exercise + (metrics.exercise || 0),
        symptoms: [...acc.symptoms, ...(metrics.symptoms || [])],
        moods: [...acc.moods, metrics.mood || 'neutral'],
        energy: [...acc.energy, metrics.energy || 'medium']
      };
    }, { sleep: 0, exercise: 0, symptoms: [], moods: [], energy: [] });

    // Calculate averages
    const totalEntries = validResults.length;
    const averageSleep = totalEntries > 0 ? metrics.sleep / totalEntries : 0;
    const averageExercise = totalEntries > 0 ? metrics.exercise / totalEntries : 0;

    // Find most common values
    const commonSymptoms = findMostCommon(metrics.symptoms);
    const predominantMood = findMostCommon(metrics.moods)[0];
    const predominantEnergy = findMostCommon(metrics.energy)[0];

    // Aggregate insights and recommendations
    const allInsights = validResults.reduce((acc, result) => {
      return [...acc, ...(result.insights || [])];
    }, []);

    const allRecommendations = validResults.reduce((acc, result) => {
      return [...acc, ...(result.recommendations || [])];
    }, []);

    // Remove duplicates and take top items
    const uniqueInsights = [...new Set(allInsights)].slice(0, 5);
    const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);

    return {
      metrics: {
        sleep: averageSleep,
        exercise: averageExercise,
        symptoms: commonSymptoms.slice(0, 5), // Top 5 symptoms
        mood: predominantMood,
        energy: predominantEnergy
      },
      insights: uniqueInsights,
      recommendations: uniqueRecommendations,
      analysisCount: totalEntries,
      successRate: (totalEntries / results.length) * 100
    };
  };

  // Helper function to find most common items in an array
  const findMostCommon = (arr) => {
    if (!arr || arr.length === 0) return [];
    
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .map(([val]) => val);
  };

  const handleAnalyze = async () => {
    if (!journalEntries.length) return;

    setIsAnalyzing(true);
    setError(null);
    setLoading(true);

    try {
      const entriesToAnalyze = journalEntries.slice(0, entriesCount);
      
      // Send all entries in a single batch request
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entries: entriesToAnalyze,
          type: 'batch'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Analysis error:', data);
        setError(data.error || 'Failed to analyze entries. Please try again.');
        return;
      }

      const analysisData = await response.json();
      
      if (analysisData.results.length === 0) {
        setError('No valid analysis results obtained. Please try again.');
        return;
      }

      // Process the batch results
      const processedAnalysis = processAnalysisResults(analysisData.results);
      if (processedAnalysis) {
        setAnalysis(processedAnalysis);
        // Store the processed analysis in localStorage
        localStorage.setItem('journalAnalysis', JSON.stringify({
          ...processedAnalysis,
          timestamp: new Date().toISOString()
        }));
      } else {
        setError('Could not process analysis results');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Failed to complete analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <LineChart className="h-5 w-5 text-violet-600" />
              Health Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {journalEntries.length === 0 && 'Start by adding entries in your journal'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={entriesCount}
              onChange={(e) => setEntriesCount(Number(e.target.value))}
              className="text-sm border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 p-2"
              disabled={isAnalyzing || journalEntries.length === 0}
            >
              <option value={3}>Last 3 entries</option>
              <option value={7}>Last 7 entries</option>
              <option value={14}>Last 14 entries</option>
              <option value={30}>Last 30 entries</option>
            </select>

            <AnalyzeButton 
              onClick={handleAnalyze}
              isAnalyzing={isAnalyzing}
              disabled={journalEntries.length === 0}
              lastUpdateTime={lastUpdateTime}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <p>{error}</p>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100">Mental Well-being</p>
                    <h3 className="text-2xl font-bold">
                      {analysis?.metrics?.mood || 'No data'}
                    </h3>
                  </div>
                  <Brain className="h-8 w-8 text-violet-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-100">Sleep Pattern</p>
                    <h3 className="text-2xl font-bold">
                      {analysis?.metrics?.sleep ? `${analysis.metrics.sleep.toFixed(1)}h` : 'No data'}
                    </h3>
                  </div>
                  <ActivitySquare className="h-8 w-8 text-sky-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100">Health Indicators</p>
                    <h3 className="text-2xl font-bold">
                      {analysis?.metrics?.symptoms?.length || 0}
                    </h3>
                  </div>
                  <Thermometer className="h-8 w-8 text-emerald-200" />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SleepQualityChart data={analysis?.metrics?.sleep || 0} />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <MoodTracker data={analysis?.metrics?.mood || 'neutral'} />
              </div>
            </div>

            {/* Health Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <HealthInsights 
                  insights={analysis?.insights || []} 
                  recommendations={analysis?.recommendations || []}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SymptomFrequency data={analysis?.metrics?.symptoms || []} />
              </div>
            </div>
          </div>
        )}

        {!analysis && !error && !isAnalyzing && journalEntries.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Ready to Analyze</h2>
            <p className="text-gray-600">
              Click the Analyze button to generate insights from your journal entries.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold">Analyzing Your Entries</h2>
            <p className="text-gray-600 mt-2">This may take a moment...</p>
          </div>
        )}
      </div>
    </div>
  );
}