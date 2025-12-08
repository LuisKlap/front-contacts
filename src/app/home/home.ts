import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from './service/contact.service';

// imports dos componentes standalone
import { ContactFiltersComponent } from './components/contact-filters/contact-filters';
import { ContactListComponent } from './components/contact-list/contact-list';
import { ContactFormComponent } from './components/contact-form/contact-form';
import { MapComponent } from './components/map/map';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ContactFiltersComponent,
    ContactListComponent,
    ContactFormComponent,
    MapComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  contacts = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);

  selectedContact = signal<any | null>(null);
  showForm = signal(false);
  editingContact = signal<any | null>(null);

  filter = signal('');
  page = signal(0);
  size = signal(10);

  constructor(private contactService: ContactService) {
    effect(() => {
      this.fetchContacts();
    });
  }

  fetchContacts() {
    this.loading.set(true);

    this.contactService
      .getContacts(this.filter(), this.page(), this.size())
      .subscribe({
        next: (res) => {
          this.contacts.set(res.content || []);
          this.total.set(res.totalElements || 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  // eventos da UI

  onFilter(term: string) {
    this.filter.set(term);
    this.page.set(0);
  }

  onSelect(contact: any) {
    // toggle: se clicar no mesmo contato, fecha; senão, abre o novo
    if (this.selectedContact()?.id === contact.id) {
      this.selectedContact.set(null);
    } else {
      this.selectedContact.set(contact);
    }
  }

  onCreate() {
    this.editingContact.set(null);
    this.showForm.set(true);
  }

  onEdit(contact: any) {
    this.editingContact.set(contact);
    this.showForm.set(true);
  }

  onSave(contact: any) {
    const editing = !!contact.id;

    const request = editing
      ? this.contactService.updateContact(contact.id, contact)
      : this.contactService.createContact(contact);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.fetchContacts();
      }
    });
  }

  onDelete(contact: any) {
    this.contactService.deleteContact(contact.id).subscribe({
      next: () => {
        if (this.selectedContact()?.id === contact.id) {
          this.selectedContact.set(null);
        }
        this.fetchContacts();
      }
    });
  }

  onCloseForm() {
    this.showForm.set(false);
  }
}
