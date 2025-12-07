// src/app/home/components/contact-item/contact-item.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-contact-item',
  standalone: true,
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
}
