// signup.ts
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
import { finalize, switchMap } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';
import { AccountService } from '../../service/account.service';

@Component({
  selector: 'app-signup',
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
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class Signup {
  signUpForm: FormGroup;
  isLoading = false;
  hide = true;

  // regex: at least one lowercase, one uppercase, one digit, one special char
  private passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.signUpForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      // adicionadas validações no campo password
      password: [''],
    });
  }

  get fullName() { return this.signUpForm.get('fullName'); }
  get email() { return this.signUpForm.get('email'); }
  get password() { return this.signUpForm.get('password'); }

  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      this.snackBar.open('Please fix the errors in the form.', 'OK', { duration: 3000 });
      return;
    }

    const payload = {
      fullName: this.fullName?.value,
      email: this.email?.value,
      password: this.password?.value
    };

    this.isLoading = true;
    console.debug('Signup payload', payload);

    this.authService.signup(payload)
      .pipe(
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (res) => {
          console.debug('Signup response', res);
          this.snackBar.open('Account created successfully! Please login.', 'OK', { duration: 3000 });
          this.signUpForm.reset();
          // Redireciona para a tela de login após cadastro bem-sucedido
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Signup error', err);
          // tenta obter mensagem do backend
          const backendMessage =
            err?.error?.message ||
            (err?.error && typeof err.error === 'string' ? err.error : null);
          const message = backendMessage || err?.message || 'Signup failed';
          this.snackBar.open(message, 'OK', { duration: 6000 });
        }
      });
  }

  onSignIn(): void {
    this.router.navigate(['/login']);
  }
}
