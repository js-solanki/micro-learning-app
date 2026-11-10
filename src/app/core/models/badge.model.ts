export interface Badge {
  id: string;
  label: string;
  icon: string; // Material icon name
  description: string;
  isUnlocked?: (stats: BadgeCheckStats) => boolean;
}

export interface BadgeCheckStats {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  quizzesCompleted: number;
  lastQuizWasPerfect: boolean;
}

export const BADGE_CATALOG: Badge[] = [
  {
    id: 'first-steps',
    label: 'First Steps',
    icon: 'flag',
    description: 'Complete your first quiz.',
    isUnlocked: (s) => s.quizzesCompleted >= 1
  },
  {
    id: 'streak-3',
    label: '3-Day Streak',
    icon: 'local_fire_department',
    description: 'Keep a 3 day learning streak alive.',
    isUnlocked: (s) => s.currentStreak >= 3
  },
  {
    id: 'streak-7',
    label: 'Week Warrior',
    icon: 'whatshot',
    description: 'Keep a 7 day learning streak alive.',
    isUnlocked: (s) => s.currentStreak >= 7
  },
  {
    id: 'streak-30',
    label: 'Unstoppable',
    icon: 'bolt',
    description: 'Keep a 30 day learning streak alive.',
    isUnlocked: (s) => s.currentStreak >= 30
  },
  {
    id: 'xp-100',
    label: 'Century Club',
    icon: 'military_tech',
    description: 'Earn 100 total XP.',
    isUnlocked: (s) => s.totalXp >= 100
  },
  {
    id: 'xp-500',
    label: 'XP Master',
    icon: 'emoji_events',
    description: 'Earn 500 total XP.',
    isUnlocked: (s) => s.totalXp >= 500
  },
  {
    id: 'perfectionist',
    label: 'Perfectionist',
    icon: 'star',
    description: 'Score a perfect run on a quiz.',
    isUnlocked: (s) => s.lastQuizWasPerfect
  },
  {
    id: 'ten-quizzes',
    label: 'Dedicated Learner',
    icon: 'school',
    description: 'Complete 10 quizzes.',
    isUnlocked: (s) => s.quizzesCompleted >= 10
  }
];
