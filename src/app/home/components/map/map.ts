// src/app/home/components/map/map.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements OnChanges {
  @Input() contacts: any[] = [];
  @Input() selected: any | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // placeholder para reações futuras (ex: panTo)
    if (changes['selected'] && this.selected) {
      // lógica de centralização ficará aqui após integrar o mapa real
    }
  }
}
