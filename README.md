# Micro-Learning App — Angular 17+ & Firebase

A gamified micro-learning app: 2-minute quizzes, XP, day streaks (flame stats),
badges, and a live leaderboard. Built with Angular standalone components,
Signals, the new `@if`/`@for` control flow, Angular Material (dark theme), and
Firebase (Auth, Firestore, Hosting).

---

## 1. CLI Setup & Project Initialization

```bash
# 1. Install the Angular CLI and Firebase CLI globally
npm install -g @angular/cli firebase-tools

# 2. Generate a new standalone Angular project
ng new micro-learning-app --standalone --style=scss --routing
cd micro-learning-app

# 3. Log in to Firebase and create/select a project
firebase login
firebase projects:create micro-learning-app-prod   # or use an existing project
firebase use micro-learning-app-prod

# 4. Add Angular Fire (wires Auth + Firestore providers, updates app.config.ts)
ng add @angular/fire
#   -> select: Authentication, Firestore
#   -> select your Firebase project when prompted

# 5. Add Angular Material with a custom theme
ng add @angular/material
#   -> choose "Custom" theme (this repo ships a hand-rolled dark theme in styles.scss)
#   -> set up global Angular Material typography styles: Yes
#   -> set up browser animations: Yes
```

Then copy every file from this repo over the freshly scaffolded project
(overwriting `src/app`, `src/environments`, `src/styles.scss`,
`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`).

Fill in your real Firebase Web config in `src/environments/environment.ts`
and `environment.prod.ts` (from Firebase Console → Project Settings → Your apps).

Enable sign-in providers in Firebase Console → Authentication → Sign-in method:
- **Email/Password**
- **Google**

---

## 2. Folder Architecture

```
src/
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── styles.scss                     # Global dark Material theme
├── index.html
├── main.ts
└── app/
    ├── app.config.ts                # provideFirebaseApp / provideAuth / provideFirestore / provideAnimations
    ├── app.routes.ts                # Lazy-loaded standalone routes + guards
    ├── app.component.ts/.html/.scss
    │
    ├── core/                        # Singleton, app-wide logic (no UI)
    │   ├── models/
    │   │   ├── user-profile.model.ts
    │   │   ├── badge.model.ts
    │   │   └── quiz.model.ts
    │   ├── services/
    │   │   ├── auth.service.ts          # Google / Email auth + profile bootstrap
    │   │   ├── gamification.service.ts  # Streak calc + badge unlock logic
    │   │   ├── quiz.service.ts          # Question bank + RxJS countdown timer
    │   │   └── leaderboard.service.ts   # Top-N XP query
    │   └── guards/
    │       └── auth.guard.ts            # authGuard / guestGuard
    │
    ├── shared/                      # Reusable, presentational, no business logic
    │   ├── directives/
    │   │   └── bounce.directive.ts      # [appBounce] completion/feedback animation
    │   └── components/
    │       └── badge-chip/
    │
    └── features/                    # Route-level feature areas (each lazy-loaded)
        ├── auth/login/
        ├── dashboard/
        ├── quiz-runner/
        └── leaderboard/
```

**Why this shape:** `core` holds one-instance-per-app services/models that
have no template; `shared` holds dumb, reusable UI pieces with `@Input()`s
only; `features` holds route-owning smart components that inject `core`
services and compose `shared` UI. Every feature component is lazy-loaded via
`loadComponent` in `app.routes.ts`, so the initial bundle only contains the
Login screen.

---

## 3. Configuration & Firebase Setup

- **`firebase.json`** — Hosting points at `dist/micro-learning-app/browser`
  (the Angular 17 application builder's output folder), rewrites all routes
  to `index.html` for the Angular Router, and references Firestore rules.
- **`.firebaserc`** — Maps the `default` alias to your Firebase project ID.
- **`firestore.rules`** — Users can only write their own `users/{uid}` doc;
  all authenticated users can read (needed for the leaderboard); the
  `quizzes` collection is read-only from the client.
- **`environment.ts` / `environment.prod.ts`** — Firebase Web config plus
  gamification tuning constants (`quiz.durationSeconds`, XP rewards).
- **`app.config.ts`** — Registers `provideFirebaseApp`, `provideAuth`,
  `provideFirestore`, `provideAnimations()`, and `provideRouter(routes)` as
  application-wide providers for the standalone bootstrap.

To seed the Firestore quiz bank instead of relying on the local fallback
quiz, add a document to `quizzes/{quizId}` matching the shape of
`QuizDefinition` in `core/models/quiz.model.ts`.

---

## 4. Feature Walkthrough

### Auth (`features/auth/login`)
`LoginComponent` uses `MatCard`, `MatFormField`/`MatInput` reactive forms,
and `MatButton`. It toggles between **Sign In** and **Create Account** modes
and offers **Continue with Google** via `AuthService.loginWithGoogle()`
(`signInWithPopup` + `GoogleAuthProvider`). On every successful auth event,
`AuthService.ensureProfileExists()` writes a default `users/{uid}` Firestore
document (`totalXp: 0`, `currentStreak: 0`, `badges: []`, ...) with
`{ merge: true }` so existing profiles are never clobbered.

### Dashboard (`features/dashboard`)
`DashboardComponent` renders a `MatToolbar` + `MatSidenav` shell. The
toolbar shows a live flame streak counter and XP counter (bound to Signals
derived from `AuthService.profile$` via `toSignal`). The sidenav has profile
info and nav links. The content area has:
- 3 stat cards (Day Streak, XP + level `MatProgressBar`, Quizzes Completed).
- A **Badge Gallery** rendering every badge in `BADGE_CATALOG` as an
  `app-badge-chip` (`MatChips`), greyed out until unlocked.
- A quiz list with **Start Quiz** buttons routing to `/quiz/:quizId`.

### Quiz Engine (`features/quiz-runner`)
`QuizRunnerComponent`:
- Starts an RxJS countdown via `QuizService.startCountdown()`, which is
  `interval(1000)` mapped down from `environment.quiz.durationSeconds` (120s)
  to `0`, driving a `MatProgressBar` (color flips primary → accent → warn as
  time runs low) and auto-submitting the quiz on timeout.
- Renders each question's options as a `MatSelectionList` of
  `mat-list-option`s. Selecting an option immediately marks it correct/
  incorrect with color + icon feedback (`optionState()`), reveals an
  explanation panel, and enables a **Next Question** `MatButton`.
- The results screen and the per-answer explanation panel both use the
  custom `[appBounce]` directive for a spring/bounce animation whenever
  the underlying trigger flips to `true` — that's the "completion feedback"
  the brief asked for, implemented as a real `Directive` (`ElementRef` +
  `Renderer2`, `ml-bounce` keyframes in `styles.scss`), not a library.

### Gamification Engine (`core/services/gamification.service.ts`)
`GamificationService.applyQuizResult()` runs after every quiz:
1. Reads the current `users/{uid}` document.
2. Calls `calculateStreak(lastActiveDate, currentStreak, longestStreak)`:
   - Same calendar day as last activity → streak unchanged.
   - Exactly 1 day later → streak **increments**.
   - Any gap of 2+ days (a missed day) → streak **resets to 1**.
   - No prior activity → streak **starts at 1**.
3. Computes new XP (`correctCount * xpPerCorrectAnswer` + perfect-run bonus).
4. Runs `computeNewlyUnlockedBadges()` against `BADGE_CATALOG`'s declarative
   `isUnlocked(stats)` predicates (streak thresholds, XP thresholds, perfect
   run, quiz count) and diffs against badges already owned.
5. Writes everything back to Firestore in a single `updateDoc()` call.

### Leaderboard (`features/leaderboard`)
`LeaderboardService.getTopUsers()` runs a live Firestore query:
`query(collection('users'), orderBy('totalXp', 'desc'), limit(20))`, streamed
into the component with `collectionData` + `toSignal`.

---

## 5. Run & Deploy

```bash
# Local development
ng serve
# → http://localhost:4200

# Production build
ng build
# output: dist/micro-learning-app/browser

# Deploy Firestore rules/indexes + hosting
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

Or, using the convenience script defined in `package.json`:

```bash
npm run deploy
```
