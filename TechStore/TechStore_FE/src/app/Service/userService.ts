import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../Models/users';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class userService {
private apiUrl = `${environment.apiUrl}/Users`;

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    }),
    withCredentials: false
  }
  private isAuthenticatedFlag: boolean = false;
  private authenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentUser: User | null = null;

  message: any;
  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }


  getUsers(): Observable<any> {
    const apiUrlWithRole = `${this.apiUrl}`;
    return this.http.get<any>(apiUrlWithRole);
  }

  getUsersRole2(): Observable<any[]> {
    const apiUrl = `${this.apiUrl}`;
    return this.http.get<any[]>(apiUrl);
  }

  //Register
  register(body: any) {
    const url = `${this.apiUrl}`;
    return this.http.post(url, body);
  }

  // Cập nhật mật khẩu
  updatePassword(id: number, body: any): Observable<any> {
    const url = `${this.apiUrl}/${id}/password`;
    return this.http.patch<any>(url, body, this.httpOptions);
  }
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, data: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  get authenticated$(): Observable<boolean> {
    return this.authenticatedSubject.asObservable();
  }

  login(loginRequest: { Username: string; Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginRequest, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: false
    }).pipe(
      tap(response => {
        if (response.Success) {
          this.setAuthenticated(true);
          this.setCurrentUser(response.User);
          if (typeof window !== 'undefined') {
            localStorage.setItem('userId', response.User.user_id);
            localStorage.setItem('username', response.User.username);

            console.log('UserId:', localStorage.getItem('userId'));
            console.log('Username:', localStorage.getItem('username'));
          }
        }
      })
    );
  }

  getUserRole(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') || '';
    }
    return '';
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, this.httpOptions)
      .pipe(
        tap(() => {
          this.setAuthenticated(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
          }
          this.setCurrentUser(null);
        })
      );
  }



  setAuthenticated(flag: boolean) {
    this.isAuthenticatedFlag = flag;
    this.authenticatedSubject.next(flag);
  }



  getUserId() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId');
    }
    return null;
  }


  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      return this.currentUser ?? (this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null'));
    }
    return this.currentUser;
  }
  
  getCurrentUserObservable(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }


  deleteUser(id: number) {
    const url = `${this.apiUrl}/deleteUser/${id}`;
    return this.http.delete<any>(url, this.httpOptions)

  }


  addUser(data: any) {
    const url = `${this.apiUrl}`;
    return this.http.post<any>(url, data)

  }
}
