import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, DocumentData } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { UserProfile, CompletedQuizRecord } from '../models/user-profile.model';
import { BADGE_CATALOG, BadgeCheckStats } from '../models/badge.model';
import { QuizRunResult } from '../models/quiz.model';

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakChanged: 'incremented' | 'reset' | 'same-day' | 'started';
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  /**
   * Calculates the next streak state given the last active date.
   * - Same calendar day as last active -> streak unchanged ('same-day').
   * - Exactly 1 day after last active -> streak increments ('incremented').
   * - More than 1 day gap (missed day(s)) -> streak resets to 1 ('reset').
   * - No prior lastActiveDate -> streak starts at 1 ('started').
   */
  calculateStreak(
    lastActiveDateIso: string,
    currentStreak: number,
    longestStreak: number,
    today: Date = new Date()
  ): StreakUpdateResult {
    const todayIso = this.toIsoDate(today);

    if (!lastActiveDateIso) {
      return { currentStreak: 1, longestStreak: Math.max(1, longestStreak), streakChanged: 'started' };
    }

    if (lastActiveDateIso === todayIso) {
      return { currentStreak, longestStreak, streakChanged: 'same-day' };
    }

    const lastDate = new Date(lastActiveDateIso + 'T00:00:00');
    const todayDate = new Date(todayIso + 'T00:00:00');
    const diffMs = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      const nextStreak = currentStreak + 1;
      return {
        currentStreak: nextStreak,
        longestStreak: Math.max(longestStreak, nextStreak),
        streakChanged: 'incremented'
      };
    }

    // Missed one or more days: streak resets, today counts as day 1.
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), streakChanged: 'reset' };
  }

  /** Determines which badge ids are newly unlocked given the latest stats. */
  computeNewlyUnlockedBadges(
    stats: BadgeCheckStats,
    alreadyUnlocked: string[]
  ): string[] {
    return BADGE_CATALOG.filter(
      (badge) =>
        !alreadyUnlocked.includes(badge.id) &&
        badge.isUnlocked?.(stats) === true
    ).map((badge) => badge.id);
  }

  /**
   * Applies the result of a completed quiz run to the user's Firestore profile:
   * updates XP, streak, quiz count, and unlocks any newly earned badges.
   */
  async applyQuizResult(result: QuizRunResult): Promise<{
    profile: Partial<UserProfile>;
    newBadgeIds: string[];
    streakChanged: StreakUpdateResult['streakChanged'];
  }> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('Cannot apply quiz result: no authenticated user.');
    }

    const ref = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(ref);
    const existing = (snapshot.data() as UserProfile) ?? undefined;

    const previousXp = existing?.totalXp ?? 0;
    const previousStreak = existing?.currentStreak ?? 0;
    const previousLongest = existing?.longestStreak ?? 0;
    const previousQuizCount = existing?.quizzesCompleted ?? 0;
    const previousBadges = existing?.badges ?? [];

    const streakResult = this.calculateStreak(
      existing?.lastActiveDate ?? '',
      previousStreak,
      previousLongest
    );

    const nextXp = previousXp + result.xpEarned;
    const existingHistory = existing?.completedQuizHistory ?? {};
    const isRetry = Boolean(existingHistory[result.quizId]);
    const previousAttempts = existingHistory[result.quizId]?.attemptsCount ?? 0;

    // Increment quizzesCompleted ONLY if it is a new unique quiz completion (not a retry)
    const nextQuizCount = isRetry ? previousQuizCount : previousQuizCount + 1;

    const quizRecord: CompletedQuizRecord = {
      quizId: result.quizId,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      xpEarned: result.xpEarned,
      isPerfect: result.isPerfect,
      completedAt: new Date().toISOString(),
      attemptsCount: previousAttempts + 1
    };

    const nextHistory = {
      ...existingHistory,
      [result.quizId]: quizRecord
    };

    const stats: BadgeCheckStats = {
      totalXp: nextXp,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      quizzesCompleted: nextQuizCount,
      lastQuizWasPerfect: result.isPerfect
    };

    const newBadgeIds = this.computeNewlyUnlockedBadges(stats, previousBadges);
    const nextBadges = [...previousBadges, ...newBadgeIds];

    const updatedFields: Partial<UserProfile> = {
      totalXp: nextXp,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastActiveDate: this.toIsoDate(new Date()),
      quizzesCompleted: nextQuizCount,
      badges: nextBadges,
      completedQuizHistory: nextHistory
    };

    await updateDoc(ref, updatedFields as DocumentData);

    return {
      profile: updatedFields,
      newBadgeIds,
      streakChanged: streakResult.streakChanged
    };
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
