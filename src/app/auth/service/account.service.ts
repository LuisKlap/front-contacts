import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { User, UpdateUserDto, DeleteAccountDto } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Obtém os dados do usuário atual
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  /**
   * Atualiza os dados do usuário
   */
  updateUser(updateData: UpdateUserDto): Observable<User> {
    return this.http.put<User>(this.apiUrl, updateData).pipe(
      tap(user => {
        console.log('AccountService: Atualizando usuário no BehaviorSubject', user);
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Exclui a conta do usuário (requer senha para confirmação)
   */
  deleteAccount(deleteData: DeleteAccountDto): Observable<void> {
    return this.http.delete<void>(this.apiUrl, {
      body: deleteData
    }).pipe(
      tap(() => this.currentUserSubject.next(null))
    );
  }

  /**
   * Limpa os dados do usuário (usado no logout)
   */
  clearUser(): void {
    this.currentUserSubject.next(null);
  }

  /**
   * Obtém o usuário atual do subject
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
