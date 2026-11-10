import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaderboardComponent {
  private leaderboardService = inject(LeaderboardService);
  private authService = inject(AuthService);

  readonly topUsers = toSignal(this.leaderboardService.getTopUsers(20), {
    initialValue: []
  });

  readonly currentUserId = computed(() => this.authService.currentUser()?.uid ?? null);

  rankIcon(position: number): string {
    if (position === 0) return 'emoji_events';
    if (position === 1) return 'military_tech';
    if (position === 2) return 'workspace_premium';
    return 'person';
  }
}
