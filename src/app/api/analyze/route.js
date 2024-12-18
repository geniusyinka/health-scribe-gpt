// src/app/api/analyze/route.js
import { NextResponse } from 'next/server';
import { analyzeJournalEntry } from '@/lib/analyzeJournal';

// Rate limiting setup with automatic cleanup
const RATE_LIMIT = 10; // requests per minute
const COOLDOWN = 60 * 1000; // 1 minute in milliseconds
const requestLog = new Map(); // Store IP -> timestamps

// Cleanup function for rate limiting
const cleanupRequestLog = () => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog.entries()) {
    const validTimestamps = timestamps.filter(time => now - time < COOLDOWN);
    if (validTimestamps.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, validTimestamps);
    }
  }
};

// Run cleanup every minute
setInterval(cleanupRequestLog, COOLDOWN);

// Helper function to validate entry content
function validateContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  // Ensure content isn't too long or too short
  if (content.length < 1 || content.length > 10000) {
    return false;
  }
  return true;
}

// Helper function to sanitize error messages
function sanitizeError(error) {
  // Remove any sensitive information from error messages
  const message = error.message || 'An error occurred';
  return message.replace(/key-[a-zA-Z0-9-_]+/g, 'KEY-REDACTED')
                .replace(/sk-[a-zA-Z0-9-_]+/g, 'SK-REDACTED');
}

// Retry mechanism for analysis
async function retryAnalysis(content, maxRetries = 2) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await analyzeJournalEntry(content);
      return result;
    } catch (error) {
      lastError = error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError;
}

export async function POST(req) {
  try {
    // Get client IP (in production, you'd get this from headers)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // More efficient rate limit check
    const timestamps = requestLog.get(clientIp) || [];
    const now = Date.now();
    const recentRequests = timestamps.filter(time => now - time < COOLDOWN);
    
    if (recentRequests.length >= RATE_LIMIT) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((COOLDOWN - (now - oldestRequest)) / 1000);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    requestLog.set(clientIp, [...recentRequests, now]);

    // Parse request body
    const body = await req.json();
    const { entries, type } = body;

    // Validate input
    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { 
          error: 'Invalid entries provided',
          details: 'Entries must be an array'
        },
        { status: 400 }
      );
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { 
          error: 'No entries provided',
          details: 'At least one entry is required'
        },
        { status: 400 }
      );
    }

    // Process all entries in parallel for better performance
    const analysisPromises = entries.map(async entry => {
      if (!validateContent(entry.content)) {
        return {
          id: entry.id,
          error: 'Invalid content',
          details: 'Content must be a string between 1 and 10000 characters'
        };
      }

      try {
        const result = await retryAnalysis(entry.content);
        return {
          id: entry.id,
          ...result
        };
      } catch (error) {
        console.error(`Analysis error for entry ${entry.id}:`, error);
        return {
          id: entry.id,
          error: 'Analysis failed',
          details: sanitizeError(error)
        };
      }
    });

    // Wait for all analyses to complete
    const results = await Promise.all(analysisPromises);

    // Aggregate results
    const successfulAnalyses = results.filter(r => !r.error);
    const failedAnalyses = results.filter(r => r.error);

    // Calculate aggregate metrics
    const aggregateMetrics = {
      totalEntries: entries.length,
      successfulAnalyses: successfulAnalyses.length,
      failedAnalyses: failedAnalyses.length,
      averageMetrics: calculateAverageMetrics(successfulAnalyses),
      trends: analyzeTrends(successfulAnalyses),
      analysisTimestamp: new Date().toISOString()
    };

    const response = {
      type: 'batch',
      results,
      aggregateMetrics
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Request processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}

function calculateAverageMetrics(analyses) {
  if (analyses.length === 0) return null;

  const totals = analyses.reduce((acc, analysis) => {
    const metrics = analysis.metrics || {};
    return {
      sleep: acc.sleep + (metrics.sleep || 0),
      exercise: acc.exercise + (metrics.exercise || 0),
      symptoms: acc.symptoms.concat(metrics.symptoms || []),
      moods: [...acc.moods, metrics.mood || 'neutral'],
      energy: [...acc.energy, metrics.energy || 'medium']
    };
  }, { sleep: 0, exercise: 0, symptoms: [], moods: [], energy: [] });

  return {
    averageSleep: totals.sleep / analyses.length,
    averageExercise: totals.exercise / analyses.length,
    commonSymptoms: findMostCommon(totals.symptoms),
    predominantMood: findMostCommon(totals.moods)[0],
    predominantEnergy: findMostCommon(totals.energy)[0]
  };
}

function analyzeTrends(analyses) {
  if (analyses.length < 2) return null;

  // Sort analyses by date
  const sortedAnalyses = [...analyses].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Calculate trends
  const trends = {
    sleep: calculateTrend(sortedAnalyses.map(a => a.metrics?.sleep || 0)),
    exercise: calculateTrend(sortedAnalyses.map(a => a.metrics?.exercise || 0)),
    mood: analyzeMoodTrend(sortedAnalyses.map(a => a.metrics?.mood))
  };

  return trends;
}

function calculateTrend(values) {
  if (values.length < 2) return 'stable';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = average(firstHalf);
  const secondAvg = average(secondHalf);
  
  const changePct = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (changePct > 10) return 'improving';
  if (changePct < -10) return 'declining';
  return 'stable';
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function findMostCommon(arr) {
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .map(([val]) => val);
}

function analyzeMoodTrend(moods) {
  const moodValues = {
    'positive': 3,
    'neutral': 2,
    'negative': 1
  };
  
  const numericMoods = moods
    .filter(mood => mood in moodValues)
    .map(mood => moodValues[mood]);
  
  return calculateTrend(numericMoods);
}

// Optional: Add HEAD method for health checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'x-api-version': '1.0',
      'x-api-status': 'healthy'
    }
  });
}