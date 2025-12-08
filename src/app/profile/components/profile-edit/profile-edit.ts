import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../../auth/service/account.service';
import { UpdateUserDto } from '../../../auth/models/user.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './profile-edit.html',
  styleUrls: ['./profile-edit.css']
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProfileEditComponent>);

  editForm!: FormGroup;
  loading = false;
  submitting = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  ngOnInit(): void {
    this.initializeForm();

    // Tenta pegar do cache primeiro
    const cachedUser = this.accountService.getCurrentUserValue();

    if (cachedUser) {
      this.editForm.patchValue({
        fullName: cachedUser.fullName,
        email: cachedUser.email
      });
      this.loading = false;
    } else {
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.editForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    });
  }

  private loadUserData(): void {
    this.loading = true;
    this.accountService.getCurrentUser().subscribe({
      next: (user) => {
        this.editForm.patchValue({
          fullName: user.fullName,
          email: user.email
        });
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
        console.error('Error loading user data:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    // Validar se as senhas coincidem quando está alterando a senha
    const newPassword = this.editForm.get('newPassword')?.value;
    const confirmPassword = this.editForm.get('confirmPassword')?.value;
    const currentPassword = this.editForm.get('currentPassword')?.value;

    if (newPassword && newPassword !== confirmPassword) {
      this.snackBar.open('As senhas não coincidem', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (newPassword && !currentPassword) {
      this.snackBar.open('Informe a senha atual para alterar a senha', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.submitting = true;

    const updateData: UpdateUserDto = {
      fullName: this.editForm.get('fullName')?.value,
      email: this.editForm.get('email')?.value
    };

    if (currentPassword && newPassword) {
      updateData.currentPassword = currentPassword;
      updateData.password = newPassword;
    }

    this.accountService.updateUser(updateData).subscribe({
      next: (updatedUser) => {
        console.log('Usuário atualizado:', updatedUser);
        this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.submitting = false;
        // Aguarda um pouco para garantir que o BehaviorSubject emitiu
        setTimeout(() => {
          this.dialogRef.close(true);
        }, 100);
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erro ao atualizar perfil';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.submitting = false;
        console.error('Error updating profile:', error);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.editForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('email')) {
      return 'E-mail inválido';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo de ${minLength} caracteres`;
    }
    return '';
  }
}
