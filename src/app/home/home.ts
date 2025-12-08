import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContactService } from './service/contact.service';

// imports dos componentes standalone
import { ContactFiltersComponent } from './components/contact-filters/contact-filters';
import { ContactListComponent } from './components/contact-list/contact-list';
import { ContactFormComponent } from './components/contact-form/contact-form';
import { MapComponent } from './components/map/map';
import { HeaderComponent } from './components/header/header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ContactFiltersComponent,
    ContactListComponent,
    ContactFormComponent,
    MapComponent,
    HeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  contacts = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);

  selectedContacts = signal<any[]>([]);
  showForm = signal(false);
  editingContact = signal<any | null>(null);

  filter = signal('');
  page = signal(0);
  size = signal(10);

  private snackBar = inject(MatSnackBar);

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
    // toggle: se clicar no mesmo contato, remove da seleção; senão, adiciona
    const currentSelection = this.selectedContacts();
    const index = currentSelection.findIndex(c => c.id === contact.id);

    if (index >= 0) {
      // Remove da seleção
      const newSelection = currentSelection.filter(c => c.id !== contact.id);
      this.selectedContacts.set(newSelection);
    } else {
      // Adiciona à seleção
      this.selectedContacts.set([...currentSelection, contact]);
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
    console.log('Salvando contato:', contact);
    const editing = !!contact.id;

    const request = editing
      ? this.contactService.updateContact(contact.id, contact)
      : this.contactService.createContact(contact);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.fetchContacts();
      },
      error: (err) => {
        // Extrai a mensagem de erro do backend
        const errorMsg = err?.error?.message || 'Erro ao salvar contato. Tente novamente.';
        this.snackBar.open(errorMsg, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onDelete(contact: any) {
    this.contactService.deleteContact(contact.id).subscribe({
      next: () => {
        // Remove da seleção se estava selecionado
        const currentSelection = this.selectedContacts();
        const newSelection = currentSelection.filter(c => c.id !== contact.id);
        this.selectedContacts.set(newSelection);

        this.fetchContacts();
      }
    });
  }

  onCloseForm() {
    this.showForm.set(false);
  }
}
