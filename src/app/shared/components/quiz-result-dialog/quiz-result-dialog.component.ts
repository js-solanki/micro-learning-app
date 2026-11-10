import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { QuizDefinition } from '../../../core/models/quiz.model';
import { CompletedQuizRecord } from '../../../core/models/user-profile.model';

export interface QuizResultDialogData {
  quiz: QuizDefinition;
  history: CompletedQuizRecord;
}

@Component({
  selector: 'app-quiz-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './quiz-result-dialog.component.html',
  styleUrl: './quiz-result-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizResultDialogComponent {
  readonly data = inject<QuizResultDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<QuizResultDialogComponent>);
  private router = inject(Router);

  get scorePercentage(): number {
    if (!this.data.history.totalQuestions) return 0;
    return Math.round((this.data.history.correctCount / this.data.history.totalQuestions) * 100);
  }

  get completedDateFormatted(): string {
    if (!this.data.history.completedAt) return '';
    const date = new Date(this.data.history.completedAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  retryQuiz(): void {
    this.dialogRef.close();
    this.router.navigate(['/quiz', this.data.quiz.id]);
  }
}
