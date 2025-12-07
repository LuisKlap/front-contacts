import { Component, signal } from '@angular/core';
import { Signup } from './components/signup/signup';
import { CommonModule } from '@angular/common';
import { Login } from './components/login/login';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, Signup, Login],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class Auth {
  currentStep = signal<'login' | 'sign-up'>('sign-up');
  readonly welcomeMessage = signal('Welcome to Uex Contacts');

  navigateTo(step: string) {
    if (
      step === 'login' ||
      step === 'sign-up'
    ) {
      this.currentStep.set(step);
    } else {
      console.warn('Unknown navigation step:', step);
    }
  }
}
