// login.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  hide = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // sem validação de formato extra no password conforme solicitado
      password: ['', [Validators.required]],
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Please fix the errors in the form.', 'OK', { duration: 3000 });
      return;
    }

    const payload = {
      email: this.email?.value,
      password: this.password?.value
    };

    this.isLoading = true;
    console.debug('Login payload', payload);

    this.authService.login(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          console.debug('Login response', res);
          if (res?.token) {
            localStorage.setItem('auth_token', res.token);
          }
          this.snackBar.open('Login successful.', 'OK', { duration: 2000 });
          this.loginForm.reset();
          // navegar para a rota principal/contatos - ajuste se necessário
          this.router.navigate(['/contacts']);
        },
        error: (err) => {
          console.error('Login error', err);
          const backendMessage =
            err?.error?.message ||
            (err?.error && typeof err.error === 'string' ? err.error : null);
          const message = backendMessage || err?.message || 'Login failed';
          this.snackBar.open(message, 'OK', { duration: 6000 });
        }
      });
  }

  onSignUp(): void {
    this.router.navigate(['/signup']);
  }
}
