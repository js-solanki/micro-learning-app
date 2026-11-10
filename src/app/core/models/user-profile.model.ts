import { Timestamp } from '@angular/fire/firestore';

export interface CompletedQuizRecord {
  quizId: string;
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  isPerfect: boolean;
  completedAt: string; // ISO timestamp string
  attemptsCount: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date string, e.g. '2026-09-06'
  badges: string[]; // array of Badge ids the user has unlocked
  quizzesCompleted: number;
  completedQuizHistory?: Record<string, CompletedQuizRecord>;
  createdAt: Timestamp | null;
}

export const createDefaultProfile = (
  uid: string,
  displayName: string,
  email: string,
  photoURL: string | null
): Omit<UserProfile, 'createdAt'> => ({
  uid,
  displayName,
  email,
  photoURL,
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  badges: [],
  quizzesCompleted: 0,
  completedQuizHistory: {}
});
