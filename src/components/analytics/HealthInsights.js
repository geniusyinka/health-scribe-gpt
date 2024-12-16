// src/components/analytics/HealthInsights.js
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const HealthInsights = ({ journalData }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (journalData && journalData.length > 0) {
      const processedData = journalData
        .slice(-7) // Get last 7 entries
        .map(entry => ({
          date: new Date(entry.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          sleep: Number(entry.metrics.sleep) || 0,
          exercise: Number(entry.metrics.exercise) || 0,
          mood: entry.metrics.mood,
          energy: entry.metrics.energy
        }))
        .reverse();
      setChartData(processedData);
    }
  }, [journalData]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Health Trends</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis 
              yAxisId="sleep"
              tick={{ fontSize: 12 }}
              tickMargin={8}
              domain={[0, 12]}
              label={{ 
                value: 'Sleep (hrs)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12 }
              }}
            />
            <YAxis 
              yAxisId="exercise"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickMargin={8}
              domain={[0, 120]}
              label={{ 
                value: 'Exercise (min)', 
                angle: 90, 
                position: 'insideRight',
                style: { fontSize: 12 }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                fontSize: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                padding: '8px'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{
                paddingTop: '8px',
                fontSize: '12px'
              }}
            />
            <Line
              yAxisId="sleep"
              type="monotone"
              dataKey="sleep"
              stroke="#2563eb"
              strokeWidth={2}
              name="Sleep"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="exercise"
              type="monotone"
              dataKey="exercise"
              stroke="#dc2626"
              strokeWidth={2}
              name="Exercise"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthInsights;