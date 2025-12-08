import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountService } from './account.service';

interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private accountService!: AccountService; // Injeção tardia para evitar dependência circular
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  constructor() {
    // Injeção tardia do AccountService para evitar dependência circular
    setTimeout(() => {
      this.accountService = inject(AccountService);
    });
  }

  signup(data: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, data).pipe(
      tap(response => this.setToken(response.token))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap(response => this.setToken(response.token))
    );
  }

  logout(): void {
    this.removeToken();
    // Limpa os dados do usuário do AccountService
    if (this.accountService) {
      this.accountService.clearUser();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
