import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  limit,
  orderBy,
  query
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private firestore = inject(Firestore);

  /** Live top-N leaderboard ordered by total XP descending. */
  getTopUsers(count: number = 20): Observable<UserProfile[]> {
    const ref = collection(this.firestore, 'users');
    const q = query(ref, orderBy('totalXp', 'desc'), limit(count));
    return collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;
  }
}
