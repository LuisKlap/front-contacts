import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../../auth/service/account.service';
import { User } from '../../../auth/models/user.model';
import { ProfileEditComponent } from '../profile-edit/profile-edit';
import { ProfileDeleteComponent } from '../profile-delete/profile-delete';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './profile-view.html',
  styleUrls: ['./profile-view.css']
})
export class ProfileViewComponent implements OnInit, OnDestroy {
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<ProfileViewComponent>);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  user: User | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    // Se inscreve para receber atualizações em tempo real
    this.accountService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        console.log('ProfileViewComponent: Recebeu atualização do usuário', user);
        this.user = user;
        this.loading = false;
        // Força a detecção de mudanças
        this.cdr.markForCheck();
      }
    });

    // Pega o valor atual do cache e exibe imediatamente
    const cachedUser = this.accountService.getCurrentUserValue();

    if (cachedUser) {
      // Se tem cache, usa ele imediatamente (já vem do BehaviorSubject atualizado)
      this.user = cachedUser;
      this.loading = false;
      console.log('ProfileViewComponent: Usando dados do cache', cachedUser);
    } else {
      // Se não tem cache, mostra loading e busca da API
      this.loading = true;
      this.accountService.getCurrentUser().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erro ao carregar dados do usuário';
          this.loading = false;
          console.error('Error loading user data:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToEdit(): void {
    const dialogRef = this.dialog.open(ProfileEditComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'profile-dialog',
      hasBackdrop: true,
      backdropClass: 'profile-backdrop'
    });

    // Aguarda o fechamento do diálogo
    // Não é necessário recarregar os dados, pois o AccountService.updateUser()
    // já atualizou o BehaviorSubject com o response da API
    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((updated) => {
      if (updated) {
        console.log('ProfileViewComponent: Diálogo fechado, dados já foram atualizados pelo BehaviorSubject');
      }
    });
  }

  navigateToDelete(): void {
    const deleteDialogRef = this.dialog.open(ProfileDeleteComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'profile-dialog',
      hasBackdrop: true,
      backdropClass: 'profile-backdrop'
    });

    deleteDialogRef.afterClosed().subscribe((deleted) => {
      if (deleted) {
        this.dialogRef.close();
      }
    });
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
