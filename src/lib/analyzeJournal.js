// src/lib/analyzeJournal.js
import { ChatOpenAI } from "@langchain/openai";

// Pattern definitions for text analysis
const patterns = {
  sleep: /(?:slept|sleep)\s*(?:for\s*)?(\d+(?:\.\d+)?)\s*hours?/i,
  exercise: /(?:exercised?|worked?\s*out|ran|jogged|walked)\s*(?:for\s*)?(\d+)\s*(?:min(?:ute)?s?|hours?)/i,
  mood: {
    good: /(?:feel(?:ing)|felt)\s*(?:great|good|happy|excellent|amazing|fantastic|positive|energetic)/i,
    bad: /(?:feel(?:ing)|felt)\s*(?:bad|terrible|awful|depressed|sad|angry|negative|down)/i,
    neutral: /(?:feel(?:ing)|felt)\s*(?:okay|fine|alright|normal|neutral)/i
  },
  energy: {
    high: /(?:energy|feeling)\s*(?:high|great|excellent|fantastic|full|lots)/i,
    low: /(?:energy|feeling)\s*(?:low|tired|exhausted|drained|no|little)/i,
    medium: /(?:energy|feeling)\s*(?:okay|fine|alright|normal|moderate)/i
  },
  symptoms: {
    headache: /(?:headache|migraine|head\s*pain|head\s*hurts)/i,
    fever: /(?:fever|temperature|hot\s*flash|chills)/i,
    cough: /(?:cough(?:ing)?|chest\s*congestion|wheez(?:e|ing))/i,
    fatigue: /(?:fatigue|tired(?:ness)?|exhausted|drained|no\s*energy)/i,
    pain: /(?:pain|ache|sore(?:ness)?|hurt(?:s|ing)?)/i,
    nausea: /(?:nausea|sick\s*to\s*stomach|queasy|vomit(?:ing)?)/i,
    dizziness: /(?:dizzy|vertigo|light\s*headed|spinning)/i,
    anxiety: /(?:anxious|anxiety|worried|stress(?:ed)?|nervous)/i,
    insomnia: /(?:insomnia|can't\s*sleep|trouble\s*sleeping|restless)/i,
    digestive: /(?:stomach|digest(?:ion|ive)|bowel|constipation|diarrhea)/i
  }
};

export async function analyzeJournalEntry(entry) {
  // Start with local analysis
  const metrics = analyzeLocally(entry);
  
  try {
    // Enhance with AI if available
    const enhancedAnalysis = await getAIAnalysis(entry, metrics);
    return {
      metrics,
      ...enhancedAnalysis
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
  // Extract sleep data
  const sleepMatch = entry.match(patterns.sleep);
  const sleep = sleepMatch ? parseFloat(sleepMatch[1]) : 0;

  // Extract exercise data
  const exerciseMatch = entry.match(patterns.exercise);
  const exercise = exerciseMatch ? parseInt(exerciseMatch[1]) : 0;

  // Determine mood
  let mood = 'neutral';
  Object.entries(patterns.mood).forEach(([key, pattern]) => {
    if (pattern.test(entry)) mood = key;
  });

  // Determine energy level
  let energy = 'medium';
  Object.entries(patterns.energy).forEach(([key, pattern]) => {
    if (pattern.test(entry)) energy = key;
  });

  // Detect symptoms
  const symptoms = Object.entries(patterns.symptoms)
    .filter(([_, pattern]) => pattern.test(entry))
    .map(([symptom]) => symptom);

  return {
    sleep,
    exercise,
    mood,
    energy,
    symptoms
  };
}
async function getAIAnalysis(entry, metrics) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
    timeout: 5000,
    maxRetries: 2,
  });

  const systemPrompt = `You are an expert health analyst. Analyze the journal entry and metrics to provide specific, actionable insights and recommendations. Focus on sleep quality, exercise habits, mood patterns, energy levels, and any health concerns.`;

  const userPrompt = `Analyze this health journal entry and the extracted metrics:

Entry: "${entry}"

Metrics detected:
- Sleep: ${metrics.sleep} hours
- Exercise: ${metrics.exercise} minutes
- Mood: ${metrics.mood}
- Energy Level: ${metrics.energy}
- Symptoms: ${metrics.symptoms.length > 0 ? metrics.symptoms.join(', ') : 'none reported'}

Provide detailed insights and suggestions. Format response as JSON with:
{
  "insights": [
    "Insight about sleep patterns and their impact",
    "Insight about exercise habits and energy levels",
    "Insight about overall wellbeing and any health patterns"
  ],
  "suggestions": [
    "Specific, actionable recommendation for improvement",
    "Practical health management suggestion"
  ]
}`;

  try {
    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const parsed = JSON.parse(response.content);
    
    if (!parsed.insights || !parsed.suggestions || 
        !Array.isArray(parsed.insights) || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid AI response format');
    }

    return parsed;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('AI analysis failed');
  }
}

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