import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ThisReceiver } from '@angular/compiler';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
}

export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest { username: string; email: string; displayName: string; password: string; }

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  // Reactive state using Angular signals
  isAdmin = signal<boolean>(this.loadFromStorage()?.role === 'Admin');
  isLoggedIn = signal<boolean>(!!this.loadFromStorage());
  iobjCurrentUser = signal<AuthResponse|null>(null);
  constructor(private http:HttpClient,private router:Router) { }

//#region Public Methods
  login(aobjLogin:LoginRequest):Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, aobjLogin).pipe(
      tap(res=>this.setSession(res)),
      catchError(err=>throwError(()=>err))
    );
  }

  register(aobjRegister:RegisterRequest):Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, aobjRegister).pipe(
      tap(res=>this.setSession(res)),
      catchError(err=>throwError(()=>err))
    );
  }

  refreshToken():Observable<AuthResponse> {
    let lobjCurrentUser: AuthResponse | null = this.iobjCurrentUser();
    if (!lobjCurrentUser) return throwError(() => new Error("not Logged in"));
    
   return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {
      accessToken: lobjCurrentUser.accessToken,
      resfreshToken: lobjCurrentUser.refreshToken
    }).pipe(tap(res=>this.setSession(res)));

  }

  logOut(): void{
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['auth/login']);
  }
  
  getAccessToken(): string|null{
    return this.iobjCurrentUser()?.accessToken ?? null;
  }

//#endregion

//#region Private Methods

private setSession(aobjAuthResponse: AuthResponse): void { 
    localStorage.setItem('auth', JSON.stringify(aobjAuthResponse));
    this.isLoggedIn.set(true);
    this.iobjCurrentUser.set(aobjAuthResponse);
    this.isAdmin.set(aobjAuthResponse.role === 'Admin');
}  

private loadFromStorage(): AuthResponse | null {
  const userData = localStorage.getItem('auth');
  return userData ? JSON.parse(userData) : null;
  }
  
private clearSession() {
  localStorage.removeItem('auth');
  this.iobjCurrentUser.set(null);
  this.isLoggedIn.set(false);
  this.isAdmin.set(false);
}  

  //#endregion
}
