import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { QuizService } from '../../core/services/quiz.service';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip.component';
import { BADGE_CATALOG } from '../../core/models/badge.model';
import { BounceDirective } from '../../shared/directives/bounce.directive';
import { QuizDefinition } from '../../core/models/quiz.model';
import { CompletedQuizRecord } from '../../core/models/user-profile.model';
import { QuizResultDialogComponent } from '../../shared/components/quiz-result-dialog/quiz-result-dialog.component';

/** XP required to reach the next level; used to render the level progress bar. */
const XP_PER_LEVEL = 100;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    BadgeChipComponent,
    BounceDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private quizService = inject(QuizService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly sidenavOpened = signal(true);
  readonly badgeCatalog = BADGE_CATALOG;

  readonly profile = toSignal(this.authService.profile$, { initialValue: null });
  readonly quizzes = toSignal(this.quizService.getQuizzes(), { initialValue: [] });

  readonly displayName = computed(() => this.profile()?.displayName ?? 'Learner');
  readonly photoURL = computed(() => this.profile()?.photoURL ?? null);
  readonly totalXp = computed(() => this.profile()?.totalXp ?? 0);
  readonly currentStreak = computed(() => this.profile()?.currentStreak ?? 0);
  readonly longestStreak = computed(() => this.profile()?.longestStreak ?? 0);
  readonly unlockedBadgeIds = computed(() => this.profile()?.badges ?? []);
  readonly quizzesCompleted = computed(() => this.profile()?.quizzesCompleted ?? 0);

  readonly currentLevel = computed(() => Math.floor(this.totalXp() / XP_PER_LEVEL) + 1);
  readonly xpIntoLevel = computed(() => this.totalXp() % XP_PER_LEVEL);
  readonly levelProgressPercent = computed(() => (this.xpIntoLevel() / XP_PER_LEVEL) * 100);

  readonly streakJustLoaded = computed(() => this.currentStreak() > 0);

  toggleSidenav(): void {
    this.sidenavOpened.update((value) => !value);
  }

  isBadgeUnlocked(badgeId: string): boolean {
    return this.unlockedBadgeIds().includes(badgeId);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  async seedQuizzes(): Promise<void> {
    try {
      await this.quizService.seedQuizzesToFirestore();
      this.snackBar.open('All quizzes seeded to Cloud Firestore successfully!', 'Dismiss', { duration: 4000 });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to seed quizzes';
      this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
    }
  }

  getQuizHistory(quizId: string): CompletedQuizRecord | null {
    const historyMap = this.profile()?.completedQuizHistory;
    return historyMap ? (historyMap[quizId] ?? null) : null;
  }

  openResultDialog(quiz: QuizDefinition, history: CompletedQuizRecord): void {
    this.dialog.open(QuizResultDialogComponent, {
      data: { quiz, history },
      width: '440px'
    });
  }
}
