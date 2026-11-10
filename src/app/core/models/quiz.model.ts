export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizDefinition {
  id: string;
  title: string;
  category: string;
  questions: QuizQuestion[];
}

export interface QuizAnswerRecord {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface QuizRunResult {
  quizId: string;
  answers: QuizAnswerRecord[];
  correctCount: number;
  totalQuestions: number;
  isPerfect: boolean;
  xpEarned: number;
  timedOut: boolean;
}
