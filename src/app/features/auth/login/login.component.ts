import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly mode = signal<AuthMode>('login');
  readonly isSubmitting = signal(false);
  readonly hidePassword = signal(true);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  switchMode(next: AuthMode): void {
    this.mode.set(next);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.isSubmitting.set(true);
    try {
      await this.authService.loginWithEmail(email, password);
    } catch (error) {
      this.showError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.registerForm.getRawValue();
    this.isSubmitting.set(true);
    try {
      await this.authService.registerWithEmail(name, email, password);
    } catch (error) {
      this.showError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.showError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private showError(error: unknown): void {
    let message = 'Something went wrong. Please try again.';
    if (error instanceof Error) {
      if (error.message.includes('auth/operation-not-allowed')) {
        message = 'Google sign-in is disabled in Firebase Console. Please enable Google provider in Firebase Authentication settings.';
      } else if (error.message.includes('auth/popup-closed-by-user')) {
        message = 'Sign-in popup was closed before completing.';
      } else if (
        error.message.includes('permission') ||
        error.message.includes('permission-denied') ||
        error.message.includes('Missing or insufficient permissions')
      ) {
        message = 'Firestore access denied. Please deploy/update your Cloud Firestore Security Rules in Firebase Console.';
      } else {
        message = error.message;
      }
    }
    this.snackBar.open(message, 'Dismiss', { duration: 6000 });
  }
}
