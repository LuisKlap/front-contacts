import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../../auth/service/account.service';
import { AuthService } from '../../../auth/service/auth.service';
import { DeleteAccountDto } from '../../../auth/models/user.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-profile-delete',
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
  templateUrl: './profile-delete.html',
  styleUrls: ['./profile-delete.css']
})
export class ProfileDeleteComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ProfileDeleteComponent>);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  deleteForm: FormGroup;
  submitting = false;
  hidePassword = true;

  constructor() {
    this.deleteForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.deleteForm.invalid) {
      this.markFormGroupTouched(this.deleteForm);
      return;
    }

    const confirmation = this.deleteForm.get('confirmation')?.value;
    if (confirmation.toUpperCase() !== 'EXCLUIR') {
      this.snackBar.open('Digite "EXCLUIR" para confirmar', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Abrir diálogo de confirmação final
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmação Final',
        message: 'Esta ação é IRREVERSÍVEL. Todos os seus dados e contatos serão permanentemente excluídos. Deseja continuar?',
        confirmText: 'Sim, excluir minha conta',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteAccount();
      }
    });
  }

  private deleteAccount(): void {
    this.submitting = true;

    const deleteData: DeleteAccountDto = {
      password: this.deleteForm.get('password')?.value
    };

    this.accountService.deleteAccount(deleteData).subscribe({
      next: () => {
        this.snackBar.open('Conta excluída com sucesso', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Fechar o diálogo e fazer logout
        this.dialogRef.close(true);
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Erro ao excluir conta. Verifique sua senha.';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.submitting = false;
        console.error('Error deleting account:', error);
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
    const control = this.deleteForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo de ${minLength} caracteres`;
    }
    return '';
  }
}
