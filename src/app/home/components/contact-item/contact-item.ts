// src/app/home/components/contact-item/contact-item.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-item.html',
  styleUrls: ['./contact-item.css'],
})
export class ContactItemComponent {
  @Input() contact: any;
  @Input() selected = false;

  @Output() select = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  // chamado pelo template (click no item)
  onSelect() {
    this.select.emit(this.contact);
  }

  // chamados pelos botões (parar propagação no template)
  onEdit(event: MouseEvent) {
    event.stopPropagation();
    this.edit.emit(this.contact);
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.delete.emit(this.contact);
  }

  // obter iniciais do nome (primeiras letras das primeiras duas palavras)
  getInitials(): string {
    if (!this.contact?.name) return '?';
    const words = this.contact.name.trim().split(' ').filter((w: string) => w.length > 0);
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  // formatar telefone com máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  formatPhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return phone;
  }

  // formatar CPF com máscara XXX.XXX.XXX-XX
  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
    }
    return cpf;
  }

  // obter endereço completo
  getFullAddress(): string {
    if (!this.contact) return '';
    const { street, number, complement, neighborhood, city, state, cep } = this.contact;
    let address = `${street}, ${number}`;
    if (complement) address += ` - ${complement}`;
    address += ` - ${neighborhood}, ${city}/${state}`;
    if (cep) address += ` - CEP: ${cep}`;
    return address;
  }
}
