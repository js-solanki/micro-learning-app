import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectionList, MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { QuizService } from '../../core/services/quiz.service';
import { GamificationService } from '../../core/services/gamification.service';
import { QuizAnswerRecord, QuizDefinition, QuizRunResult } from '../../core/models/quiz.model';
import { environment } from '../../../environments/environment';
import { BounceDirective } from '../../shared/directives/bounce.directive';

type QuestionFeedback = 'unanswered' | 'correct' | 'incorrect';

@Component({
  selector: 'app-quiz-runner',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule,
    MatChipsModule,
    BounceDirective
  ],
  templateUrl: './quiz-runner.component.html',
  styleUrl: './quiz-runner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizRunnerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private gamificationService = inject(GamificationService);
  private destroyRef = inject(DestroyRef);

  private readonly totalDuration = environment.quiz.durationSeconds;

  readonly quiz = signal<QuizDefinition | null>(null);
  readonly currentQuestionIndex = signal(0);
  readonly answers = signal<QuizAnswerRecord[]>([]);
  readonly selectedOptionIndex = signal<number | null>(null);
  readonly feedback = signal<QuestionFeedback>('unanswered');
  readonly remainingSeconds = signal(this.totalDuration);
  readonly isQuizComplete = signal(false);
  readonly isTimedOut = signal(false);
  readonly result = signal<QuizRunResult | null>(null);
  readonly newBadgeIds = signal<string[]>([]);
  readonly isSaving = signal(false);

  readonly currentQuestion = computed(() => {
    const quiz = this.quiz();
    if (!quiz) {
      return null;
    }
    return quiz.questions[this.currentQuestionIndex()] ?? null;
  });

  readonly progressPercent = computed(
    () => (this.remainingSeconds() / this.totalDuration) * 100
  );

  readonly timerColor = computed(() => {
    const pct = this.progressPercent();
    if (pct > 50) return 'primary';
    if (pct > 20) return 'accent';
    return 'warn';
  });

  readonly questionNumberLabel = computed(() => {
    const quiz = this.quiz();
    if (!quiz) return '';
    return `Question ${this.currentQuestionIndex() + 1} of ${quiz.questions.length}`;
  });

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('quizId');
    this.quizService.getQuizzes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((quizzes) => {
      const found = quizzes.find((q) => q.id === quizId) ?? quizzes[0] ?? null;
      this.quiz.set(found);
      if (found) {
        this.startTimer();
      }
    });
  }

  private startTimer(): void {
    this.quizService
      .startCountdown(this.totalDuration)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (remaining) => {
          this.remainingSeconds.set(remaining);
          if (remaining === 0 && !this.isQuizComplete()) {
            this.isTimedOut.set(true);
            this.finishQuiz();
          }
        }
      });
  }

  selectOption(optionIndex: number): void {
    if (this.feedback() !== 'unanswered') {
      return; // Already answered this question; ignore further clicks.
    }
    const question = this.currentQuestion();
    if (!question) {
      return;
    }

    const isCorrect = optionIndex === question.correctOptionIndex;
    this.selectedOptionIndex.set(optionIndex);
    this.feedback.set(isCorrect ? 'correct' : 'incorrect');

    this.answers.update((existing) => [
      ...existing,
      { questionId: question.id, selectedIndex: optionIndex, isCorrect }
    ]);
  }

  optionState(optionIndex: number): 'default' | 'correct' | 'incorrect' | 'missed' {
    const question = this.currentQuestion();
    if (!question || this.feedback() === 'unanswered') {
      return 'default';
    }
    const isCorrectOption = optionIndex === question.correctOptionIndex;
    const isSelected = optionIndex === this.selectedOptionIndex();

    if (isSelected && isCorrectOption) return 'correct';
    if (isSelected && !isCorrectOption) return 'incorrect';
    if (!isSelected && isCorrectOption && this.feedback() === 'incorrect') return 'missed';
    return 'default';
  }

  goToNextQuestion(): void {
    const quiz = this.quiz();
    if (!quiz) return;

    const nextIndex = this.currentQuestionIndex() + 1;
    if (nextIndex >= quiz.questions.length) {
      this.finishQuiz();
      return;
    }

    this.currentQuestionIndex.set(nextIndex);
    this.selectedOptionIndex.set(null);
    this.feedback.set('unanswered');
  }

  private async finishQuiz(): Promise<void> {
    if (this.isQuizComplete()) {
      return;
    }
    this.isQuizComplete.set(true);

    const quiz = this.quiz();
    if (!quiz) return;

    const finalAnswers = this.answers();
    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const isPerfect = correctCount === totalQuestions && totalQuestions > 0;

    const xpEarned =
      correctCount * environment.quiz.xpPerCorrectAnswer +
      (isPerfect ? environment.quiz.xpBonusPerfectRun : 0);

    const runResult: QuizRunResult = {
      quizId: quiz.id,
      answers: finalAnswers,
      correctCount,
      totalQuestions,
      isPerfect,
      xpEarned,
      timedOut: this.isTimedOut()
    };

    this.result.set(runResult);
    this.isSaving.set(true);

    try {
      const { newBadgeIds } = await this.gamificationService.applyQuizResult(runResult);
      this.newBadgeIds.set(newBadgeIds);
    } finally {
      this.isSaving.set(false);
    }
  }

  backToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  retryCurrentQuiz(): void {
    this.currentQuestionIndex.set(0);
    this.answers.set([]);
    this.selectedOptionIndex.set(null);
    this.feedback.set('unanswered');
    this.remainingSeconds.set(this.totalDuration);
    this.isQuizComplete.set(false);
    this.isTimedOut.set(false);
    this.result.set(null);
    this.newBadgeIds.set([]);
    this.isSaving.set(false);
    this.startTimer();
  }
}
