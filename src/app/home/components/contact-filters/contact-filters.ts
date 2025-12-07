// src/app/home/components/contact-filters/contact-filters.ts
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-contact-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-filters.html',
  styleUrls: ['./contact-filters.css'],
})
export class ContactFiltersComponent implements OnDestroy {
  @Output() filterChange = new EventEmitter<string>();
  @Output() create = new EventEmitter<void>();

  search = new FormControl<string | null>('');
  private sub: Subscription;
  private readonly DEBOUNCE = 400;

  constructor() {
    this.sub = this.search.valueChanges
      .pipe(debounceTime(this.DEBOUNCE), distinctUntilChanged())
      .subscribe((value) => {
        this.filterChange.emit((value ?? '').trim());
      });
  }

  clear() {
    this.search.setValue('');
    this.filterChange.emit('');
  }

  // método chamado pelo template -> emite create
  onCreate() {
    this.create.emit();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
