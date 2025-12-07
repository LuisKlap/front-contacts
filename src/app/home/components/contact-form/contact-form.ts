// src/app/home/components/contact-form/contact-form.ts
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrls: ['./contact-form.css'],
})
export class ContactFormComponent implements OnChanges {
  @Input() contact: any | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      cpf: ['', Validators.required],
      phone: ['', Validators.required],
      cep: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      complement: [''],
      neighborhood: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contact']) {
      if (this.contact) this.form.patchValue(this.contact);
      else this.form.reset();
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.save.emit(this.form.value);
  }

  // método chamado pelo template para fechar/cancelar
  cancel() {
    this.close.emit();
  }
}
