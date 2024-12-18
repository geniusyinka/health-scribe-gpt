// src/utils/storage.js

const handleStorageError = (error, defaultValue) => {
  console.error('Storage operation failed:', error);
  return defaultValue;
};

export const storageUtils = {
  // Journal Entries
  saveJournalEntries: (entries) => {
    try {
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      return true;
    } catch (error) {
      return handleStorageError(error, false);
    }
  },

  getJournalEntries: () => {
    try {
      const entries = localStorage.getItem('journalEntries');
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      return handleStorageError(error, []);
    }
  },

  addJournalEntry: (entry) => {
    try {
      const entries = storageUtils.getJournalEntries();
      const updatedEntries = [entry, ...entries];
      storageUtils.saveJournalEntries(updatedEntries);
      return updatedEntries;
    } catch (error) {
      return handleStorageError(error, null);
    }
  },

  // Analysis Data
  saveAnalysis: (data) => {
    try {
      localStorage.setItem('journalAnalysis', JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      return handleStorageError(error, false);
    }
  },

  getAnalysis: () => {
    try {
      const data = localStorage.getItem('journalAnalysis');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return handleStorageError(error, null);
    }
  },

  // Nutrition Data
  saveNutritionData: (meals, waterIntake) => {
    try {
      localStorage.setItem('nutritionData', JSON.stringify({
        meals,
        waterIntake,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      return handleStorageError(error, false);
    }
  },

  getNutritionData: () => {
    try {
      const data = localStorage.getItem('nutritionData');
      return data ? JSON.parse(data) : { meals: [], waterIntake: 0, timestamp: null };
    } catch (error) {
      return handleStorageError(error, { meals: [], waterIntake: 0, timestamp: null });
    }
  },

  // Goals Data
  saveGoalsData: (goals, habits) => {
    try {
      localStorage.setItem('goalsData', JSON.stringify({
        goals,
        habits,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      return handleStorageError(error, false);
    }
  },

  getGoalsData: () => {
    try {
      const data = localStorage.getItem('goalsData');
      return data ? JSON.parse(data) : { goals: [], habits: [], timestamp: null };
    } catch (error) {
      return handleStorageError(error, { goals: [], habits: [], timestamp: null });
    }
  }
};