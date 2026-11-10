import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, writeBatch } from '@angular/fire/firestore';
import { Observable, interval, map, take, takeWhile } from 'rxjs';
import { QuizDefinition } from '../models/quiz.model';
import { environment } from '../../../environments/environment';

/** Local fallback quiz bank containing multiple quizzes across different tech topics. */
const FALLBACK_QUIZZES: QuizDefinition[] = [
  {
    id: 'angular-fundamentals',
    title: 'Angular Fundamentals',
    category: 'Web Development',
    questions: [
      {
        id: 'q1',
        prompt: 'Which decorator marks a class as an Angular standalone component?',
        options: ['@NgModule', '@Component', '@Injectable', '@Directive'],
        correctOptionIndex: 1,
        explanation: '@Component defines a component; setting "standalone: true" removes the need for an NgModule.'
      },
      {
        id: 'q2',
        prompt: 'What Angular primitive introduced in v16+ enables fine-grained reactivity?',
        options: ['Observables', 'Signals', 'Promises', 'Subjects'],
        correctOptionIndex: 1,
        explanation: 'Signals are the new reactive primitive for fine-grained, synchronous state tracking.'
      },
      {
        id: 'q3',
        prompt: 'Which control-flow syntax replaces *ngFor in modern Angular templates?',
        options: ['@each', '@loop', '@for', '@iterate'],
        correctOptionIndex: 2,
        explanation: 'The new built-in control flow uses @for (item of items; track item.id) { ... }.'
      },
      {
        id: 'q4',
        prompt: 'Which Angular Fire function wires up Firebase Auth for dependency injection?',
        options: ['provideAuth', 'initializeAuth', 'useAuth', 'connectAuth'],
        correctOptionIndex: 0,
        explanation: 'provideAuth(() => getAuth()) registers the Auth instance with the Angular injector.'
      },
      {
        id: 'q5',
        prompt: 'Which directive would you write to add a custom bounce animation on an element?',
        options: ['A pipe', 'A guard', 'An attribute directive', 'A resolver'],
        correctOptionIndex: 2,
        explanation: 'Attribute directives (like [appBounce]) change the appearance or behavior of an element.'
      }
    ]
  },
  {
    id: 'typescript-mastery',
    title: 'TypeScript Mastery',
    category: 'Programming Languages',
    questions: [
      {
        id: 'ts1',
        prompt: 'Which modifier makes an object property immutable after initialization?',
        options: ['static', 'readonly', 'const', 'private'],
        correctOptionIndex: 1,
        explanation: 'The "readonly" modifier prevents reassignment to a property after initialization.'
      },
      {
        id: 'ts2',
        prompt: 'What utility type constructs a type with all properties of T set to optional?',
        options: ['Required<T>', 'Pick<T>', 'Partial<T>', 'Omit<T>'],
        correctOptionIndex: 2,
        explanation: 'Partial<T> returns a type with all properties of T marked as optional.'
      },
      {
        id: 'ts3',
        prompt: 'Which top type requires a type check before performing operations on its value?',
        options: ['any', 'never', 'unknown', 'void'],
        correctOptionIndex: 2,
        explanation: 'Unlike "any", "unknown" forces type checking or narrowing before performing operations.'
      },
      {
        id: 'ts4',
        prompt: 'Which nullish coalescing operator provides a default value only for null or undefined?',
        options: ['||', '??', '&&', '?:'],
        correctOptionIndex: 1,
        explanation: 'The ?? operator evaluates to the right-hand operand only when the left-hand operand is null or undefined.'
      },
      {
        id: 'ts5',
        prompt: 'What is the return type of a function that never returns (e.g. throws an exception)?',
        options: ['void', 'null', 'never', 'undefined'],
        correctOptionIndex: 2,
        explanation: 'The "never" type represents values that never occur, such as a function that always throws an error.'
      }
    ]
  },
  {
    id: 'modern-css',
    title: 'Modern CSS & Layouts',
    category: 'UI & Design',
    questions: [
      {
        id: 'css1',
        prompt: 'Which flexbox property aligns flex items along the main axis?',
        options: ['align-items', 'justify-content', 'align-content', 'flex-direction'],
        correctOptionIndex: 1,
        explanation: 'justify-content defines the alignment along the main axis of a flex container.'
      },
      {
        id: 'css2',
        prompt: 'What CSS unit represents 1% of the viewport width?',
        options: ['vh', 'rem', 'vw', 'em'],
        correctOptionIndex: 2,
        explanation: '1vw is equal to 1% of the total width of the viewport.'
      },
      {
        id: 'css3',
        prompt: 'Which CSS media query feature detects if a user prefers dark theme?',
        options: ['prefers-color-scheme', 'color-mode', 'theme-preference', 'display-mode'],
        correctOptionIndex: 0,
        explanation: 'prefers-color-scheme: dark matches when the user has selected dark mode in system settings.'
      },
      {
        id: 'css4',
        prompt: 'Which layout model enables bidirectional (row and column) grid structures?',
        options: ['Flexbox', 'CSS Grid', 'Float Layout', 'Position Relative'],
        correctOptionIndex: 1,
        explanation: 'CSS Grid is designed for two-dimensional layouts, controlling rows and columns simultaneously.'
      },
      {
        id: 'css5',
        prompt: 'What function allows performing mathematical calculations in CSS property values?',
        options: ['math()', 'calc()', 'eval()', 'var()'],
        correctOptionIndex: 1,
        explanation: 'calc() lets you perform calculations when specifying CSS property values (e.g., width: calc(100% - 20px)).'
      }
    ]
  },
  {
    id: 'web-performance',
    title: 'Web Performance & Security',
    category: 'Software Engineering',
    questions: [
      {
        id: 'perf1',
        prompt: 'Which Core Web Vital metric measures visual layout stability during page load?',
        options: ['LCP (Largest Contentful Paint)', 'FID (First Input Delay)', 'CLS (Cumulative Layout Shift)', 'TTFB (Time to First Byte)'],
        correctOptionIndex: 2,
        explanation: 'CLS measures unexpected layout shifts that occur during the visual lifecycle of a page.'
      },
      {
        id: 'perf2',
        prompt: 'Which HTTP header prevents clickjacking by restricting iframe embedding?',
        options: ['Content-Security-Policy', 'X-Frame-Options', 'Access-Control-Allow-Origin', 'Strict-Transport-Security'],
        correctOptionIndex: 1,
        explanation: 'X-Frame-Options indicates whether a browser should be allowed to render a page in a <frame> or <iframe>.'
      },
      {
        id: 'perf3',
        prompt: 'Which attribute defers image loading until it nears the viewport?',
        options: ['async="true"', 'loading="lazy"', 'defer="true"', 'fetchpriority="low"'],
        correctOptionIndex: 1,
        explanation: 'loading="lazy" instructs the browser to defer loading of images until they are near the user viewport.'
      },
      {
        id: 'perf4',
        prompt: 'What technique splits JavaScript bundles into smaller route-based chunks?',
        options: ['Minification', 'Code Splitting / Lazy Loading', 'Tree Shaking', 'Polyfilling'],
        correctOptionIndex: 1,
        explanation: 'Code splitting breaks down code into smaller bundles loaded on demand per route or feature module.'
      },
      {
        id: 'perf5',
        prompt: 'What practice removes unused exports from final production bundles?',
        options: ['Tree Shaking', 'Transpilation', 'Compression', 'Debouncing'],
        correctOptionIndex: 0,
        explanation: 'Tree shaking relies on ES module static analysis to eliminate dead/unused code from the final bundle.'
      }
    ]
  },
  {
    id: 'firebase-cloud',
    title: 'Firebase & Cloud Architecture',
    category: 'Backend & Cloud',
    questions: [
      {
        id: 'fb1',
        prompt: 'Which Firestore method updates specified fields of a document without overwriting it?',
        options: ['setDoc', 'updateDoc', 'addDoc', 'putDoc'],
        correctOptionIndex: 1,
        explanation: 'updateDoc updates specific fields in a document without replacing the entire document.'
      },
      {
        id: 'fb2',
        prompt: 'Which Firebase service manages user authentication and session tokens?',
        options: ['Cloud Firestore', 'Firebase Authentication', 'Cloud Messaging', 'Realtime Database'],
        correctOptionIndex: 1,
        explanation: 'Firebase Authentication provides end-to-end user identity and login provider management.'
      },
      {
        id: 'fb3',
        prompt: 'What Firestore rule expression checks if a request is made by a logged-in user?',
        options: ['request.auth != null', 'user.isLoggedIn == true', 'auth.token != ""', 'request.user.active == true'],
        correctOptionIndex: 0,
        explanation: 'request.auth is non-null when the client making the request is authenticated.'
      },
      {
        id: 'fb4',
        prompt: 'Which Cloud Firestore feature automatically syncs data when clients go offline?',
        options: ['Offline Persistence', 'Cloud Functions', 'Rules Engine', 'App Check'],
        correctOptionIndex: 0,
        explanation: 'Offline persistence caches Firestore data locally so reads and writes work offline and sync upon reconnect.'
      },
      {
        id: 'fb5',
        prompt: 'What property in firebase.json redirects single-page application routes to index.html?',
        options: ['redirects', 'rewrites', 'routes', 'headers'],
        correctOptionIndex: 1,
        explanation: 'The rewrites configuration maps all non-file requests to index.html for client-side routing.'
      }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class QuizService {
  private firestore = inject(Firestore);

  /** Attempts to load quizzes from Firestore; falls back to the local quiz bank if empty/unavailable. */
  getQuizzes(): Observable<QuizDefinition[]> {
    const ref = collection(this.firestore, 'quizzes');
    return new Observable<QuizDefinition[]>((subscriber) => {
      const sub = collectionData(ref, { idField: 'id' }).subscribe({
        next: (docs) => {
          const quizzes = docs as unknown as QuizDefinition[];
          subscriber.next(quizzes.length > 0 ? quizzes : FALLBACK_QUIZZES);
        },
        error: () => {
          subscriber.next(FALLBACK_QUIZZES);
        }
      });
      return () => sub.unsubscribe();
    });
  }

  getFallbackQuiz(quizId?: string): QuizDefinition {
    if (quizId) {
      const found = FALLBACK_QUIZZES.find((q) => q.id === quizId);
      if (found) {
        return found;
      }
    }
    return FALLBACK_QUIZZES[0];
  }

  /**
   * Seeds multiple quizzes into Cloud Firestore atomically using a Firestore Batch Write.
   */
  async seedQuizzesToFirestore(quizzes: QuizDefinition[] = FALLBACK_QUIZZES): Promise<void> {
    const batch = writeBatch(this.firestore);
    for (const quiz of quizzes) {
      const ref = doc(this.firestore, `quizzes/${quiz.id}`);
      batch.set(ref, quiz, { merge: true });
    }
    await batch.commit();
  }

  /**
   * Emits the remaining seconds once per second, counting down from the configured
   * quiz duration to 0, then completes. Used to drive the MatProgressBar timer.
   */
  startCountdown(durationSeconds: number = environment.quiz.durationSeconds): Observable<number> {
    return interval(1000).pipe(
      map((tick) => durationSeconds - (tick + 1)),
      takeWhile((remaining) => remaining >= 0, true),
      take(durationSeconds + 1)
    );
  }
}
