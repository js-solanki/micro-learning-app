import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizDefinition } from '../../../core/models/quiz.model';

const DEFAULT_JSON_TEMPLATE = JSON.stringify(
  [
    {
      id: 'react-mastery',
      title: 'React & UI Component Architecture',
      category: 'Web Development',
      questions: [
        {
          id: 'rq1',
          prompt: 'Which hook manages local component state in React?',
          options: ['useEffect', 'useState', 'useContext', 'useReducer'],
          correctOptionIndex: 1,
          explanation: 'useState is the primary React hook for declaring and updating component state.'
        },
        {
          id: 'rq2',
          prompt: 'What is the purpose of React.memo()?',
          options: [
            'Caching API requests',
            'Preventing unnecessary re-renders of components when props do not change',
            'Managing global application state',
            'Handling async routing'
          ],
          correctOptionIndex: 1,
          explanation: 'React.memo is a higher-order component that skips re-rendering if props are unchanged.'
        }
      ]
    },
    {
      id: 'python-backend',
      title: 'Python Backend & FastAPI',
      category: 'Backend Development',
      questions: [
        {
          id: 'py1',
          prompt: 'Which Python decorator defines an HTTP GET route in FastAPI?',
          options: ['@app.route()', '@app.get()', '@app.fetch()', '@app.request()'],
          correctOptionIndex: 1,
          explanation: '@app.get() is the path operation decorator for GET requests in FastAPI.'
        },
        {
          id: 'py2',
          prompt: 'What library does FastAPI use for data validation and settings management?',
          options: ['Pydantic', 'Marshmallow', 'SQLAlchemy', 'Django ORM'],
          correctOptionIndex: 0,
          explanation: 'FastAPI uses Pydantic to enforce type hints and data validation at runtime.'
        }
      ]
    }
  ],
  null,
  2
);

@Component({
  selector: 'app-add-quizzes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatToolbarModule,
    MatChipsModule
  ],
  templateUrl: './add-quizzes.component.html',
  styleUrl: './add-quizzes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddQuizzesComponent {
  private quizService = inject(QuizService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  readonly jsonInput = signal<string>(DEFAULT_JSON_TEMPLATE);
  readonly isUploading = signal(false);
  readonly jsonError = signal<string | null>(null);

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonInput());
      this.jsonInput.set(JSON.stringify(parsed, null, 2));
      this.jsonError.set(null);
      this.snackBar.open('JSON formatted successfully!', 'Dismiss', { duration: 2500 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      this.jsonError.set(msg);
    }
  }

  loadSampleTemplate(): void {
    this.jsonInput.set(DEFAULT_JSON_TEMPLATE);
    this.jsonError.set(null);
    this.snackBar.open('Loaded sample template!', 'Dismiss', { duration: 2000 });
  }

  async uploadMultipleQuizzes(): Promise<void> {
    if (this.isUploading()) return;

    this.jsonError.set(null);
    let quizzes: QuizDefinition[] = [];

    try {
      const parsed = JSON.parse(this.jsonInput());
      quizzes = Array.isArray(parsed) ? parsed : [parsed];

      if (quizzes.length === 0) {
        throw new Error('Please provide at least one quiz definition.');
      }

      // Basic structure validation
      for (const q of quizzes) {
        if (!q.id || !q.title || !q.category || !Array.isArray(q.questions)) {
          throw new Error(`Quiz "${q.title || 'Untitled'}" is missing required fields (id, title, category, questions).`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON input';
      this.jsonError.set(msg);
      this.snackBar.open(`Validation Error: ${msg}`, 'Dismiss', { duration: 5000 });
      return;
    }

    this.isUploading.set(true);

    try {
      await this.quizService.seedQuizzesToFirestore(quizzes);
      this.snackBar.open(`Successfully added ${quizzes.length} quiz(zes) to Cloud Firebase!`, 'Go to Dashboard', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigateByUrl('/dashboard');
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      this.snackBar.open(`Firebase Upload Error: ${msg}`, 'Dismiss', { duration: 6000 });
    } finally {
      this.isUploading.set(false);
    }
  }
}
