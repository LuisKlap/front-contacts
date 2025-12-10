import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { AuthResponse, LoginRequest, SignupRequest, RefreshTokenRequest } from '../models/auth.model';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private accountService!: AccountService; // Injeção tardia para evitar dependência circular

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Injeção tardia do AccountService para evitar dependência circular
    setTimeout(() => {
      this.accountService = inject(AccountService);
    });
  }

  private hasValidToken(): boolean {
    return !!this.tokenService.getAccessToken() &&
      !this.tokenService.isAccessTokenExpired();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        this.tokenService.saveTokens(response.accessToken, response.refreshToken);
        this.isAuthenticatedSubject.next(true);

        // Agenda refresh automático
        this.tokenService.scheduleTokenRefresh(response.expiresIn, () => {
          this.refreshToken().subscribe();
        });
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  signup(data: SignupRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/signup`, data);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, request).pipe(
      tap(response => {
        this.tokenService.saveTokens(response.accessToken, response.refreshToken);
        this.isAuthenticatedSubject.next(true);

        // Agenda próximo refresh
        this.tokenService.scheduleTokenRefresh(response.expiresIn, () => {
          this.refreshToken().subscribe();
        });
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (refreshToken) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken })
        .subscribe({
          complete: () => this.completeLogout()
        });
    } else {
      this.completeLogout();
    }
  }

  private completeLogout(): void {
    this.tokenService.clearTokens();
    this.isAuthenticatedSubject.next(false);

    // Limpa os dados do usuário do AccountService
    if (this.accountService) {
      this.accountService.clearUser();
    }

    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Método legado para compatibilidade
  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }
}
