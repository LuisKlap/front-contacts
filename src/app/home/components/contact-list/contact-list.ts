// src/app/home/components/contact-list/contact-list.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactItemComponent } from '../contact-item/contact-item';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, ContactItemComponent],
  templateUrl: './contact-list.html',
  styleUrls: ['./contact-list.css'],
})
export class ContactListComponent {
  @Input() contacts: any[] = [];
  @Input() loading = false;
  @Input() selectedContacts: any[] = [];

  @Output() select = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() create = new EventEmitter<void>();

  // Verifica se o contato está na lista de selecionados
  isSelected(contact: any): boolean {
    return this.selectedContacts?.some(c => c.id === contact.id) || false;
  }

  // métodos usados no template -> re-emit para o pai
  onSelect(contact: any) {
    this.select.emit(contact);
  }

  onEdit(contact: any) {
    this.edit.emit(contact);
  }

  onDelete(contact: any) {
    this.delete.emit(contact);
  }

  onCreate() {
    this.create.emit();
  }
}
