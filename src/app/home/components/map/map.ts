// src/app/home/components/map/map.ts
import { Component, Input, OnChanges, SimpleChanges, ViewChild, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Contact } from '../../models/contact.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements OnChanges {
  @Input() contacts: Contact[] = [];
  @Input() selectedContacts: Contact[] = [];

  @ViewChild(MapInfoWindow) infoWindow?: MapInfoWindow;
  @ViewChildren(MapMarker) markers?: QueryList<MapMarker>;

  // Configurações do mapa - centralizado no Brasil
  center: google.maps.LatLngLiteral = { lat: -14.235004, lng: -51.925280 };
  zoom = 4;

  // Opções do mapa
  options: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 3,
  };

  // Contato atualmente selecionado para exibir no info window
  selectedMarkerContact: Contact | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Quando contatos são selecionados, ajusta o mapa para mostrar todos
    if (changes['selectedContacts'] && this.selectedContacts.length > 0) {
      this.centerOnSelectedContacts();
    } else if (changes['selectedContacts'] && this.selectedContacts.length === 0) {
      // Volta para a visão padrão do Brasil
      this.center = { lat: -14.235004, lng: -51.925280 };
      this.zoom = 4;
    }
  }

  /**
   * Centraliza o mapa para mostrar todos os contatos selecionados
   */
  centerOnSelectedContacts(): void {
    const contactsWithCoords = this.selectedContacts.filter(
      c => c.latitude != null && c.longitude != null
    );

    if (contactsWithCoords.length === 0) return;

    if (contactsWithCoords.length === 1) {
      // Um único contato: centraliza nele com zoom próximo
      const contact = contactsWithCoords[0];
      this.center = {
        lat: contact.latitude!,
        lng: contact.longitude!
      };
      this.zoom = 15;
    } else {
      // Múltiplos contatos: calcula o centro e ajusta zoom para mostrar todos
      const bounds = new google.maps.LatLngBounds();

      contactsWithCoords.forEach(contact => {
        bounds.extend({
          lat: contact.latitude!,
          lng: contact.longitude!
        });
      });

      // Calcula o centro dos bounds
      const center = bounds.getCenter();
      this.center = {
        lat: center.lat(),
        lng: center.lng()
      };

      // Ajusta o zoom baseado na distância entre os pontos
      // Zoom menor para mostrar todos os pontos
      this.zoom = this.calculateZoomLevel(bounds);
    }
  }

  /**
   * Calcula o nível de zoom apropriado para mostrar todos os pontos
   */
  private calculateZoomLevel(bounds: google.maps.LatLngBounds): number {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 15;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const latFraction = (this.latRad(ne.lat()) - this.latRad(sw.lat())) / Math.PI;
    const lngDiff = ne.lng() - sw.lng();
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = Math.floor(Math.log(1 / latFraction) / Math.LN2);
    const lngZoom = Math.floor(Math.log(1 / lngFraction) / Math.LN2);

    return Math.min(latZoom, lngZoom, ZOOM_MAX) - 1; // -1 para dar uma margem
  }

  private latRad(lat: number): number {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  /**
   * Retorna as coordenadas do marcador para um contato
   */
  getMarkerPosition(contact: Contact): google.maps.LatLngLiteral | null {
    if (contact.latitude && contact.longitude) {
      return {
        lat: contact.latitude,
        lng: contact.longitude
      };
    }
    return null;
  }

  /**
   * Verifica se o contato está selecionado
   */
  isSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

  /**
   * Abre a janela de informações ao clicar no marcador
   */
  openInfoWindow(index: number, contact: Contact): void {
    this.selectedMarkerContact = contact;
    if (this.infoWindow && this.markers) {
      const markersArray = this.markers.toArray();
      const marker = markersArray[index];
      if (marker) {
        this.infoWindow.open(marker);
      }
    }
  }

  /**
   * Retorna a cor do marcador baseado na seleção
   */
  getMarkerOptions(contact: Contact): google.maps.MarkerOptions {
    const isSelected = this.isSelected(contact);

    return {
      icon: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: isSelected ? '#DC143C' : '#E53935',
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#FFFFFF',
        scale: isSelected ? 2 : 1.5,
        anchor: new google.maps.Point(12, 22),
      },
      animation: undefined,
    };
  }

  /**
   * Formata o endereço completo para exibição
   */
  getFullAddress(contact: Contact): string {
    const parts = [
      contact.street,
      contact.number,
      contact.complement,
      contact.neighborhood,
      contact.city,
      contact.state,
      `CEP: ${contact.cep}`
    ].filter(part => part); // Remove partes vazias

    return parts.join(', ');
  }
}
