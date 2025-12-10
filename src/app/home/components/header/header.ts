import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../auth/service/auth.service';
import { AccountService } from '../../../auth/service/account.service';
import { User } from '../../../auth/models/user.model';
import { ProfileViewComponent } from '../../../profile/components/profile-view/profile-view';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  user: User | null = null;
  isAuthenticated$ = this.authService.isAuthenticated$;

  ngOnInit(): void {
    // Se inscreve para receber atualizações em tempo real
    this.accountService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        console.log('HeaderComponent: Recebeu atualização do usuário', user);
        this.user = user;
        // Força a detecção de mudanças
        this.cdr.markForCheck();
      }
    });

    // Carrega os dados iniciais se não existirem no cache
    const cachedUser = this.accountService.getCurrentUserValue();

    if (!cachedUser) {
      this.accountService.getCurrentUser().pipe(
        takeUntil(this.destroy$)
      ).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToProfile(): void {
    this.dialog.open(ProfileViewComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'profile-dialog',
      hasBackdrop: true,
      backdropClass: 'profile-backdrop'
    });
  }

  logout(): void {
    // Limpa os dados do usuário e faz logout
    this.accountService.clearUser();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getUserInitials(): string {
    if (!this.user?.fullName) return '?';
    const words = this.user.fullName.trim().split(' ').filter(w => w.length > 0);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
}
