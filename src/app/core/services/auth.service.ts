import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  doc,
  docData,
  setDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, switchMap, of } from 'rxjs';
import { UserProfile, createDefaultProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  /** Signal mirroring the current Firebase Auth user (null when signed out). */
  readonly currentUser = signal<User | null>(null);

  /** Signal mirroring loading state while the initial auth check resolves. */
  readonly authReady = signal(false);

  /** Live observable of the Firestore profile document for the signed-in user. */
  readonly profile$: Observable<UserProfile | null> = authState(this.auth).pipe(
    switchMap((user) => {
      if (!user) {
        return of(null);
      }
      const ref = doc(this.firestore, `users/${user.uid}`);
      return docData(ref) as Observable<UserProfile>;
    })
  );

  constructor() {
    authState(this.auth).subscribe((user) => {
      this.currentUser.set(user);
      this.authReady.set(true);
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    await this.ensureProfileExists(credential.user);
    this.router.navigateByUrl('/dashboard');
  }

  async registerWithEmail(
    name: string,
    email: string,
    password: string
  ): Promise<void> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    await updateProfile(credential.user, { displayName: name });
    await this.ensureProfileExists(credential.user, name);
    this.router.navigateByUrl('/dashboard');
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    await this.ensureProfileExists(credential.user);
    this.router.navigateByUrl('/dashboard');
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigateByUrl('/login');
  }

  /** Creates the Firestore user document on first login; no-op if it already exists. */
  private async ensureProfileExists(
    user: User,
    fallbackName?: string
  ): Promise<void> {
    const ref = doc(this.firestore, `users/${user.uid}`);
    const defaults = createDefaultProfile(
      user.uid,
      user.displayName ?? fallbackName ?? 'Learner',
      user.email ?? '',
      user.photoURL
    );
    await setDoc(
      ref,
      { ...defaults, createdAt: Timestamp.now() },
      { merge: true }
    );
  }
}
