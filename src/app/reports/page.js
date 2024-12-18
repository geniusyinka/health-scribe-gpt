// src/app/reports/page.js
'use client';
import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, Calendar, Brain, Heart } from 'lucide-react';
import ReportContent from '@/components/reports/ReportContent';
import { getConsistentDate } from '../../utils/dateUtils';

// Analysis helper functions
const calculateConsistencyScore = (data, targetValue = null) => {
  if (!data || data.length < 2) return 0;
  
  const daysInRange = data.length;
  let score = 100;
  
  // Calculate variance based on target value or day-to-day consistency
  if (targetValue !== null) {
    // Calculate deviation from target value
    const deviations = data.map(item => Math.abs(item.value - targetValue));
    const avgDeviation = deviations.reduce((acc, dev) => acc + dev, 0) / daysInRange;
    score -= (avgDeviation * 10); // Reduce score based on average deviation
  } else {
    // Calculate day-to-day consistency
    const variance = data.reduce((acc, curr, i) => {
      if (i === 0) return acc;
      const diff = Math.abs(curr.value - data[i - 1].value);
      return acc + (diff * 10); // Penalize big variations more heavily
    }, 0) / daysInRange;
    score -= variance;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

const analyzeSleepPatterns = (entries) => {
  if (!entries || entries.length === 0) return {
    data: [],
    average: "0.0",
    consistency: 0,
    insights: [],
    qualityScore: 0
  };

  const sleepData = entries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    value: entry.metrics?.sleep || 0,
    quality: entry.metrics?.sleepQuality || 'normal'
  }));

  const avgSleep = sleepData.reduce((acc, curr) => acc + curr.value, 0) / sleepData.length;
  const consistencyScore = calculateConsistencyScore(sleepData, 8); // Target 8 hours of sleep
  
  // Calculate quality score
  const qualityMap = { good: 100, normal: 70, poor: 40 };
  const qualityScore = Math.round(
    sleepData.reduce((acc, curr) => acc + (qualityMap[curr.quality] || 70), 0) / sleepData.length
  );

  const insights = [];

  // Sleep duration insights
  if (avgSleep < 6) {
    insights.push("Critical: You're significantly under-sleeping. Aim for 7-9 hours.");
  } else if (avgSleep < 7) {
    insights.push("Warning: You're getting less than recommended sleep (7-9 hours).");
  } else if (avgSleep > 9) {
    insights.push("Note: You might be oversleeping. Try adjusting your sleep schedule.");
  } else {
    insights.push("Great! Your sleep duration is within the recommended range.");
  }

  // Sleep consistency insights
  if (consistencyScore >= 90) {
    insights.push("Excellent sleep schedule consistency! Keep it up!");
  } else if (consistencyScore >= 70) {
    insights.push("Good sleep consistency with minor variations.");
  } else if (consistencyScore >= 50) {
    insights.push("Your sleep schedule shows some irregularity. Try to maintain consistent sleep times.");
  } else {
    insights.push("Your sleep schedule is quite irregular. Consider setting a consistent sleep routine.");
  }

  // Sleep quality insights
  if (qualityScore >= 80) {
    insights.push("You're experiencing good quality sleep overall.");
  } else if (qualityScore >= 60) {
    insights.push("Your sleep quality is moderate. Consider factors that might be affecting your sleep.");
  } else {
    insights.push("Your sleep quality needs improvement. Consider factors like room temperature, noise, and pre-sleep routine.");
  }

  return {
    data: sleepData,
    average: avgSleep.toFixed(1),
    consistency: consistencyScore,
    qualityScore,
    insights
  };
};

const analyzeExercisePatterns = (entries) => {
  if (!entries || entries.length === 0) return {
    data: [],
    weeklyAverage: 0,
    mostActiveDay: "N/A",
    consistency: 0,
    insights: [],
    intensityScore: 0
  };

  const exerciseData = entries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    value: entry.metrics?.exercise || 0,
    intensity: entry.metrics?.exerciseIntensity || 'moderate'
  }));

  const totalMinutes = exerciseData.reduce((acc, curr) => acc + curr.value, 0);
  const avgMinutes = totalMinutes / exerciseData.length;
  const weeklyAverage = Math.round(avgMinutes * 7);
  const consistencyScore = calculateConsistencyScore(exerciseData, 30); // Target 30 minutes per day
  
  // Calculate intensity score
  const intensityMap = { high: 100, moderate: 70, low: 40 };
  const intensityScore = Math.round(
    exerciseData.reduce((acc, curr) => acc + (intensityMap[curr.intensity] || 70), 0) / exerciseData.length
  );

  const mostActive = exerciseData.reduce((max, curr) => 
    curr.value > max.value ? curr : max, exerciseData[0]);

  const insights = [];

  // Weekly average insights
  if (weeklyAverage >= 150) {
    insights.push("Excellent! Meeting or exceeding weekly exercise recommendations.");
  } else if (weeklyAverage >= 100) {
    insights.push("Good progress! Try to reach 150 minutes of exercise per week.");
  } else if (weeklyAverage > 0) {
    insights.push("You're making a start! Aim to gradually increase to 150 minutes per week.");
  } else {
    insights.push("No exercise recorded. Try to incorporate some physical activity into your routine.");
  }

  // Consistency insights
  if (consistencyScore >= 80) {
    insights.push("You're maintaining a very consistent exercise routine!");
  } else if (consistencyScore >= 60) {
    insights.push("Your exercise routine is fairly consistent. Try to maintain regular sessions.");
  } else {
    insights.push("Your exercise pattern is irregular. Consider scheduling regular workout times.");
  }

  // Intensity insights
  if (intensityScore >= 80) {
    insights.push("You're maintaining good exercise intensity. Remember to include recovery periods.");
  } else if (intensityScore >= 60) {
    insights.push("Moderate intensity exercise is good. Consider including some high-intensity sessions.");
  } else {
    insights.push("Try to gradually increase your exercise intensity for better health benefits.");
  }

  return {
    data: exerciseData,
    weeklyAverage,
    mostActiveDay: mostActive.date,
    consistency: consistencyScore,
    intensityScore,
    insights
  };
};

const calculateHealthScore = (entries, habits) => {
  if (!entries || entries.length === 0) return 0;
  if (!habits) habits = [];

  const weights = {
    sleep: 0.25,
    exercise: 0.25,
    mood: 0.20,
    habits: 0.15,
    nutrition: 0.15
  };

  try {
    // Calculate sleep score (0-100)
    const sleepAnalysis = analyzeSleepPatterns(entries);
    const sleepScore = sleepAnalysis ? (
      (sleepAnalysis.consistency || 0) * 0.4 + 
      (sleepAnalysis.qualityScore || 0) * 0.6
    ) : 0;

    // Calculate exercise score (0-100)
    const exerciseAnalysis = analyzeExercisePatterns(entries);
    const exerciseScore = exerciseAnalysis ? (
      ((exerciseAnalysis.consistency || 0) * 0.4) + 
      ((exerciseAnalysis.intensityScore || 0) * 0.3) + 
      (Math.min(100, ((exerciseAnalysis.weeklyAverage || 0) / 150) * 100) * 0.3)
    ) : 0;

    // Calculate mood score (0-100)
    const moodScore = entries.reduce((acc, entry) => {
      const moodValues = { 
        'very positive': 100,
        'positive': 80,
        'neutral': 60,
        'negative': 40,
        'very negative': 20
      };
      const mood = (entry.mood || entry.metrics?.mood || 'neutral').toLowerCase();
      return acc + (moodValues[mood] || 60);
    }, 0) / entries.length;

    // Calculate habits score (0-100)
    const habitsScore = habits.length > 0 ? habits.reduce((acc, habit) => {
      const streakScore = Math.min(100, (habit.streak || 0) * 10);
      const completionRate = habit.completedDays && habit.totalDays ? 
        (habit.completedDays / Math.max(1, habit.totalDays) * 100) : 0;
      return acc + (streakScore * 0.6 + completionRate * 0.4);
    }, 0) / habits.length : 0;

    // Calculate nutrition score (0-100)
    const nutritionScore = entries.reduce((acc, entry) => {
      const metrics = entry.metrics || {};
      const waterIntake = metrics.waterIntake || 0;
      const mealsLogged = metrics.mealsLogged || 0;
      const waterScore = Math.min(100, (waterIntake / 2000) * 100);
      const mealsScore = Math.min(100, mealsLogged * 25);
      return acc + (waterScore * 0.5 + mealsScore * 0.5);
    }, 0) / entries.length;

    const finalScore = (
      sleepScore * weights.sleep +
      exerciseScore * weights.exercise +
      moodScore * weights.mood +
      habitsScore * weights.habits +
      nutritionScore * weights.nutrition
    );

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  } catch (error) {
    console.error('Error calculating health score:', error);
    return 0;
  }
};

const calculateAverageCalories = (meals, startDate, endDate) => {
  if (!meals || meals.length === 0) return 0;

  const filteredMeals = meals.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate >= startDate && mealDate <= endDate;
  });

  if (filteredMeals.length === 0) return 0;

  const totalCalories = filteredMeals.reduce((acc, meal) => acc + (meal.calories || 0), 0);
  return Math.round(totalCalories / filteredMeals.length);
};

const downloadReport = (reportData, reportPeriod) => {
  if (!reportData) return;

  const reportText = `Health Report (${reportPeriod})
Generated on: ${new Date().toLocaleDateString()}

Overview:
- Total Journal Entries: ${reportData.overview.totalEntries}
- Completed Goals: ${reportData.overview.completedGoals}
- Active Habits: ${reportData.overview.activeHabits}
- Average Daily Calories: ${reportData.overview.avgCalories}

Health Score: ${reportData.healthScore}%

Sleep Analysis:
- Average Sleep: ${reportData.sleepAnalysis.average} hours
- Sleep Consistency: ${reportData.sleepAnalysis.consistency}%
- Sleep Quality: ${reportData.sleepAnalysis.qualityScore}%
Insights:
${reportData.sleepAnalysis.insights.map(i => '- ' + i).join('\n')}

Exercise Analysis:
- Weekly Average: ${reportData.exerciseAnalysis.weeklyAverage} minutes
- Most Active Day: ${reportData.exerciseAnalysis.mostActiveDay}
- Exercise Consistency: ${reportData.exerciseAnalysis.consistency}%
- Exercise Intensity: ${reportData.exerciseAnalysis.intensityScore}%
Insights:
${reportData.exerciseAnalysis.insights.map(i => '- ' + i).join('\n')}
`;

  const blob = new Blob([reportText], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `health-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export default function Reports() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [meals, setMeals] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadData();
  }, [reportPeriod]);

  const loadData = () => {
    try {
      // Use consistent storage keys and add error handling
      const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      const userGoals = JSON.parse(localStorage.getItem('goalsData'))?.goals || [];
      const userHabits = JSON.parse(localStorage.getItem('goalsData'))?.habits || [];
      const nutritionData = JSON.parse(localStorage.getItem('nutritionData'));
      const userMeals = nutritionData?.meals || [];

      setJournalEntries(entries);
      setGoals(userGoals);
      setHabits(userHabits);
      setMeals(userMeals);
      
      if (entries.length > 0 || userGoals.length > 0 || userHabits.length > 0 || userMeals.length > 0) {
        generateReport(entries, userGoals, userHabits, userMeals);
      } else {
        setLoading(false);
        setReportData(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
      setReportData(null);
    }
  };

  const generateReport = (entries, goals, habits, meals) => {
    setLoading(true);
    
    const endDate = getConsistentDate();
    const startDate = getConsistentDate();
    if (reportPeriod === 'week') startDate.setDate(endDate.getDate() - 7);
    if (reportPeriod === 'month') startDate.setDate(endDate.getDate() - 30);
    if (reportPeriod === 'quarter') startDate.setDate(endDate.getDate() - 90);

    // Format dates consistently for comparison
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const filteredEntries = entries.filter(entry => {
      const entryDate = formatDate(new Date(entry.date));
      return entryDate >= startDateStr && entryDate <= endDateStr;
    });

    const filteredMeals = meals.filter(meal => {
      const mealDate = formatDate(new Date(meal.date));
      return mealDate >= startDateStr && mealDate <= endDateStr;
    });

    const healthScore = calculateHealthScore(filteredEntries, habits);
    const sleepAnalysis = analyzeSleepPatterns(filteredEntries);
    const exerciseAnalysis = analyzeExercisePatterns(filteredEntries);

    // Save health score to local storage with timestamp
    try {
      localStorage.setItem('healthScore', JSON.stringify({
        score: healthScore,
        timestamp: new Date().toISOString(),
        details: {
          sleep: sleepAnalysis.consistency,
          exercise: exerciseAnalysis.consistency,
          mood: filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].mood : 'neutral',
          habits: habits.filter(h => h.streak > 0).length
        }
      }));
    } catch (error) {
      console.error('Error saving health score:', error);
    }

    const analysis = {
      overview: {
        totalEntries: filteredEntries.length,
        completedGoals: goals.filter(g => g.completed).length,
        activeHabits: habits.filter(h => h.streak > 0).length,
        avgCalories: calculateAverageCalories(filteredMeals, startDate, endDate)
      },
      healthScore,
      sleepAnalysis,
      exerciseAnalysis,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      }
    };

    setReportData(analysis);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Health Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your health progress over time
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="text-sm border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 p-2"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
            <button
              onClick={() => downloadReport(reportData, reportPeriod)}
              disabled={!reportData}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Generating your health report...</p>
          </div>
        ) : !reportData ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No journal entries found for the selected period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100">Health Score</p>
                    <h3 className="text-2xl font-bold">{reportData.healthScore}%</h3>
                  </div>
                  <Heart className="h-8 w-8 text-violet-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-100">Sleep Quality</p>
                    <h3 className="text-2xl font-bold">{reportData.sleepAnalysis.consistency}%</h3>
                  </div>
                  <Brain className="h-8 w-8 text-sky-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100">Active Habits</p>
                    <h3 className="text-2xl font-bold">{reportData.overview.activeHabits}</h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-violet-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-100">Avg. Calories</p>
                    <h3 className="text-2xl font-bold">{reportData.overview.avgCalories}</h3>
                  </div>
                  <Calendar className="h-8 w-8 text-sky-200" />
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sleep Analysis */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  Sleep Analysis
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-violet-50">
                    <div>
                      <p className="text-sm text-gray-600">Average Sleep</p>
                      <p className="text-xl font-semibold text-violet-700">{reportData.sleepAnalysis.average} hours</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Insights:</p>
                    {reportData.sleepAnalysis.insights.map((insight, index) => (
                      <p key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exercise Analysis */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  Exercise Analysis
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-violet-50">
                    <div>
                      <p className="text-sm text-gray-600">Weekly Average</p>
                      <p className="text-xl font-semibold text-violet-700">{reportData.exerciseAnalysis.weeklyAverage} min</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Insights:</p>
                    {reportData.exerciseAnalysis.insights.map((insight, index) => (
                      <p key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}