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
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEntries = () => {
      const savedEntries = storageUtils.getJournalEntries();
      setJournalEntries(savedEntries);
    };

    loadEntries();
    window.addEventListener('storage', loadEntries);
    return () => window.removeEventListener('storage', loadEntries);
  }, []);
  const processAnalysisResults = (results) => {
    if (!results.length) return null;

    const processedData = results.map((r, i) => ({
      date: new Date(journalEntries[i].date),
      metrics: {
        sleep: r.metrics?.sleep || 0,
        exercise: r.metrics?.exercise || 0,
        mood: r.metrics?.mood || 'neutral',
        energy: r.metrics?.energy || 'medium',
        symptoms: r.metrics?.symptoms || []
      },
      insights: r.insights || [],
      suggestions: r.suggestions || []
    })).reverse();

    const sleepData = processedData.map(d => ({
      date: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: d.metrics.sleep,
      quality: d.metrics.energy === 'high' ? 100 : 
               d.metrics.energy === 'medium' ? 75 : 50
    }));

    const moodData = processedData.map(d => ({
      date: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: d.metrics.mood,
      energy: d.metrics.energy
    }));

    const symptomsMap = processedData.reduce((acc, d) => {
      d.metrics.symptoms.forEach(symptom => {
        acc[symptom] = (acc[symptom] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      raw: processedData,
      sleep: {
        data: sleepData,
        averageHours: (sleepData.reduce((acc, d) => acc + d.hours, 0) / sleepData.length).toFixed(1),
        bestSleep: Math.max(...sleepData.map(d => d.hours)),
        pattern: determinePattern(sleepData.map(d => d.hours))
      },
      mood: {
        data: moodData,
        predominant: moodData.reduce((acc, curr) => {
          acc[curr.mood] = (acc[curr.mood] || 0) + 1;
          return acc;
        }, {}),
        energyLevels: moodData.reduce((acc, curr) => {
          acc[curr.energy] = (acc[curr.energy] || 0) + 1;
          return acc;
        }, {})
      },
      symptoms: {
        data: Object.entries(symptomsMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }
    };
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const entriesToAnalyze = journalEntries.slice(0, entriesCount);
      
      const results = await Promise.all(
        entriesToAnalyze.map(async (entry) => {
          try {
            const response = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                content: entry.content,
                id: entry.id
              })
            });

            const data = await response.json();
            
            if (!response.ok) {
              console.error(`Analysis error for entry ${entry.id}:`, data);
              return null;
            }

            return data;
          } catch (error) {
            console.error('Entry analysis error:', error);
            return null;
          }
        })
      );

      const validResults = results.filter(Boolean);
      
      if (validResults.length === 0) {
        setError('No valid analysis results obtained. Please try again.');
        return;
      }

      const processedAnalysis = processAnalysisResults(validResults);
      if (processedAnalysis) {
        setAnalysis(processedAnalysis);
      } else {
        setError('Could not process analysis results');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Failed to complete analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Health Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {journalEntries.length 
                ? `Analyzing ${entriesCount} of ${journalEntries.length} entries`
                : 'Start by adding entries in your journal'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={entriesCount}
              onChange={(e) => setEntriesCount(Number(e.target.value))}
              className="text-sm border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-black focus:border-black p-2"
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
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p>{error}</p>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            <HealthInsights journalData={analysis.raw} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SleepQualityChart data={analysis.sleep} />
              <MoodTracker data={analysis.mood} />
              <SymptomFrequency data={analysis.symptoms} />
            </div>
          </div>
        )}

        {!analysis && !error && !isAnalyzing && journalEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Ready to Analyze</h2>
            <p className="text-gray-600">
              Click the Analyze button to generate insights from your journal entries.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold">Analyzing Your Entries</h2>
            <p className="text-gray-600 mt-2">This may take a moment...</p>
          </div>
        )}
      </div>
    </div>
  );
}