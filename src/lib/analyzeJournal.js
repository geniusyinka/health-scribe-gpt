// src/lib/analyzeJournal.js
import { ChatOpenAI } from "@langchain/openai";

// Pattern definitions for text analysis
const patterns = {
  sleep: /(?:slept|sleep)\s*(?:for|about)?\s*(\d+(?:\.\d+)?)\s*hours?/i,
  exercise: /(?:exercised|worked out|ran|jogged|walked)\s*(?:for)?\s*(\d+)\s*(?:min(?:ute)?s?|hours?)/i,
  mood: {
    positive: /\b(?:happy|great|good|excellent|wonderful|amazing|fantastic)\b/i,
    negative: /\b(?:sad|bad|terrible|awful|depressed|unhappy|stressed)\b/i,
    neutral: /\b(?:okay|fine|alright|normal)\b/i
  },
  energy: {
    high: /\b(?:energetic|energized|active|full of energy)\b/i,
    low: /\b(?:tired|exhausted|fatigued|low energy)\b/i,
    medium: /\b(?:moderate energy|decent energy)\b/i
  },
  symptoms: {
    headache: /\b(?:headache|migraine)\b/i,
    nausea: /\b(?:nausea|nauseated|sick to (?:my|the) stomach)\b/i,
    pain: /\b(?:pain|ache|sore)\b/i,
    anxiety: /\b(?:anxiety|anxious|worried|stress)\b/i,
    fatigue: /\b(?:fatigue|exhaustion|tired)\b/i
  }
};

// Cache for OpenAI analysis results
const analysisCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function analyzeJournalEntry(entry) {
  // Start with optimized local analysis
  const metrics = analyzeLocally(entry);
  
  try {
    // Use cached AI analysis if available
    const enhancedAnalysis = await getAIAnalysis(entry, metrics);
    return {
      metrics,
      ...enhancedAnalysis,
      cached: analysisCache.has(`${entry}_${JSON.stringify(metrics)}`)
    };
  } catch (error) {
    console.error('AI analysis failed, using local analysis:', error);
    return {
      metrics,
      insights: generateLocalInsights(metrics),
      suggestions: generateLocalSuggestions(metrics)
    };
  }
}

function analyzeLocally(entry) {
  // Extract sleep data with improved regex
  const sleepMatch = entry.match(patterns.sleep);
  const sleep = sleepMatch ? parseFloat(sleepMatch[1]) : null;

  // Extract exercise data with improved regex
  const exerciseMatch = entry.match(patterns.exercise);
  const exercise = exerciseMatch ? parseInt(exerciseMatch[1]) : null;

  // Determine mood with single pass
  let mood = 'neutral';
  const lowerEntry = entry.toLowerCase();
  for (const [type, pattern] of Object.entries(patterns.mood)) {
    if (pattern.test(lowerEntry)) {
      mood = type;
      break;
    }
  }

  // Determine energy level with single pass
  let energy = null;
  for (const [level, pattern] of Object.entries(patterns.energy)) {
    if (pattern.test(lowerEntry)) {
      energy = level;
      break;
    }
  }

  // Detect symptoms efficiently
  const symptoms = Object.entries(patterns.symptoms)
    .filter(([_, pattern]) => pattern.test(lowerEntry))
    .map(([symptom]) => symptom);

  return {
    sleep,
    exercise,
    mood,
    energy,
    symptoms,
    timestamp: Date.now()
  };
}

async function getAIAnalysis(entry, metrics) {
  const cacheKey = `${entry}_${JSON.stringify(metrics)}`;
  const cachedResult = analysisCache.get(cacheKey);
  
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return cachedResult.analysis;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
    timeout: 5000,
    maxRetries: 2,
  });

  try {
    const response = await model.invoke([
      {
        role: "system",
        content: `You are an expert health analyst. Analyze the journal entry and metrics to provide specific, actionable insights and recommendations. Focus on sleep quality, exercise habits, mood patterns, energy levels, and any health concerns.`
      },
      {
        role: "user",
        content: `Analyze this health journal entry and the extracted metrics:\n\nEntry: "${entry}"\n\nMetrics detected:\n${JSON.stringify(metrics, null, 2)}\n\nProvide detailed insights and suggestions in JSON format.`
      }
    ]);

    const analysis = JSON.parse(response.content);
    
    // Cache the result
    analysisCache.set(cacheKey, {
      analysis,
      timestamp: Date.now()
    });

    return analysis;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('AI analysis failed');
  }
}

// Cleanup cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
}, CACHE_TTL);

function generateLocalInsights(metrics) {
  const insights = [];

  // Sleep insights
  if (metrics.sleep > 0) {
    const sleepQuality = metrics.sleep >= 7 ? "healthy" : "below recommended";
    insights.push(
      `Sleep duration is ${metrics.sleep} hours (${sleepQuality}). ${
        metrics.sleep < 7 
          ? "Consider aiming for 7-9 hours for optimal health."
          : "Maintain this healthy sleep pattern."
      }`
    );
  }

  // Exercise insights
  if (metrics.exercise > 0) {
    const exerciseQuality = metrics.exercise >= 30 ? "meeting" : "below";
    insights.push(
      `Exercise duration is ${metrics.exercise} minutes (${exerciseQuality} recommended levels). ${
        metrics.exercise < 30
          ? "Aim for at least 30 minutes of daily activity."
          : "Keep up this good level of activity."
      }`
    );
  }

  // Mood and energy insights
  insights.push(
    `Overall wellbeing shows ${metrics.mood} mood with ${metrics.energy} energy levels` +
    (metrics.symptoms.length 
      ? `. Health concerns noted: ${metrics.symptoms.join(', ')}` 
      : " with no reported symptoms."
    )
  );

  return insights;
}

function generateLocalSuggestions(metrics) {
  const suggestions = [];

  // Sleep suggestions
  if (metrics.sleep < 7) {
    suggestions.push(
      "Establish a consistent bedtime routine and aim for 7-9 hours of sleep"
    );
  }

  // Exercise suggestions
  if (metrics.exercise < 30) {
    suggestions.push(
      "Start with short exercise sessions and gradually work up to 30 minutes daily"
    );
  }

  // Health management suggestions
  if (metrics.symptoms.length > 0) {
    suggestions.push(
      "Monitor your symptoms and consider consulting a healthcare provider if they persist"
    );
  }

  // If we need more suggestions
  if (suggestions.length < 2) {
    if (metrics.energy === 'low') {
      suggestions.push(
        "Try to identify and address factors affecting your energy levels"
      );
    } else if (metrics.mood === 'bad') {
      suggestions.push(
        "Consider activities that boost your mood like exercise or socializing"
      );
    } else {
      suggestions.push(
        "Maintain your current healthy routines and track any changes in your wellbeing"
      );
    }
  }

  return suggestions;
}

export default analyzeJournalEntry;