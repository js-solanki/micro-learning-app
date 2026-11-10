import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      )
  },
  {
    path: 'quiz/:quizId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quiz-runner/quiz-runner.component').then(
        (m) => m.QuizRunnerComponent
      )
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.component').then(
        (m) => m.LeaderboardComponent
      )
  },
  {
    path: 'add-quizzes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/add-quizzes/add-quizzes.component').then(
        (m) => m.AddQuizzesComponent
      )
  },
  { path: '**', redirectTo: 'dashboard' }
];
