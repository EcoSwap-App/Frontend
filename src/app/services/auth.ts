import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { User } from '../models';
import { HttpClient } from '@angular/common/http';
import { tap, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {
    // Simple mock persistence
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this.currentUserSubject.next(JSON.parse(saved));
    }
  }

  login(email: string, password?: string): Observable<User> {
    return from(this.supabaseService.signIn(email, password || '')).pipe(
      switchMap(response => {
        if (response.error) {
          throw response.error;
        }
        const user = response.data.user;
        if (!user) {
          throw new Error('No user data returned from Supabase');
        }
        
        const metadata = user.user_metadata || {};
        return this.http.post<User>(`${this.apiUrl}/users/sync`, {
          name: metadata['name'] || user.email?.split('@')[0] || 'Estudiante UPC',
          career: metadata['career'] || 'General',
          cycle: metadata['cycle'] || 1
        });
      }),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout() {
    this.supabaseService.signOut();
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
