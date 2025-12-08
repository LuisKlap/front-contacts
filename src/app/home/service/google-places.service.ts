// src/app/home/service/google-places.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Declaração global do Google Maps para TypeScript
declare global {
  interface Window {
    google: any;
  }
}

export interface PlacePrediction {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
}

export interface PlaceDetails {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  stateCode: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Injectable({
  providedIn: 'root',
})
export class GooglePlacesService {
  private autocompleteService: any;
  private placesService: any;
  private geocoder: any;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    if (typeof window !== 'undefined' && window.google) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
      this.geocoder = new window.google.maps.Geocoder();
      // PlacesService precisa de um elemento div
      const div = document.createElement('div');
      this.placesService = new window.google.maps.places.PlacesService(div);
    } else {
      console.warn('Google Maps API não foi carregada');
    }
  }

  /**
   * Busca sugestões de endereços usando Autocomplete API
   * @param input Texto digitado pelo usuário
   * @param types Tipos de lugares (address, establishment, geocode)
   * @returns Observable com lista de predições
   */
  getPlacePredictions(
    input: string,
    types: string[] = ['address']
  ): Observable<PlacePrediction[]> {
    return new Observable((observer) => {
      if (!this.autocompleteService) {
        observer.error('Google Places API não inicializado');
        return;
      }

      if (!input || input.length < 3) {
        observer.next([]);
        observer.complete();
        return;
      }

      const request = {
        input: input,
        types: types,
        componentRestrictions: { country: 'br' }, // Restringe ao Brasil
        language: 'pt-BR',
      };

      this.autocompleteService.getPlacePredictions(
        request,
        (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results: PlacePrediction[] = predictions.map((p) => ({
              description: p.description,
              placeId: p.place_id,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text,
              structuredFormatting: p.structured_formatting,
            }));
            observer.next(results);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            observer.next([]);
          } else {
            observer.error(`Erro na busca: ${status}`);
          }
          observer.complete();
        }
      );
    });
  }

  /**
   * Obtém detalhes completos de um lugar usando Place ID
   * @param placeId ID do lugar retornado pela Autocomplete API
   * @returns Observable com detalhes do endereço
   */
  getPlaceDetails(placeId: string): Observable<PlaceDetails> {
    return new Observable((observer) => {
      if (!this.placesService) {
        observer.error('Google Places API não inicializado');
        return;
      }

      const request = {
        placeId: placeId,
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      };

      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const details = this.parseAddressComponents(place);
          observer.next(details);
        } else {
          observer.error(`Erro ao obter detalhes: ${status}`);
        }
        observer.complete();
      });
    });
  }

  /**
   * Geocodifica um endereço (converte texto em coordenadas)
   * @param address Endereço completo em texto
   * @returns Observable com coordenadas
   */
  geocodeAddress(address: string): Observable<{ lat: number; lng: number }> {
    return new Observable((observer) => {
      if (!this.geocoder) {
        observer.error('Google Geocoder não inicializado');
        return;
      }

      this.geocoder.geocode(
        { address: address, region: 'br' },
        (results: any[], status: any) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            observer.next({
              lat: location.lat(),
              lng: location.lng(),
            });
          } else {
            observer.error(`Geocoding falhou: ${status}`);
          }
          observer.complete();
        }
      );
    });
  }

  /**
   * Extrai e organiza os componentes do endereço retornados pela API
   */
  private parseAddressComponents(place: any): PlaceDetails {
    const details: PlaceDetails = {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      stateCode: '',
      zipCode: '',
      country: '',
      latitude: 0,
      longitude: 0,
      formattedAddress: place.formatted_address || '',
    };

    // Extrai coordenadas
    if (place.geometry && place.geometry.location) {
      details.latitude = place.geometry.location.lat();
      details.longitude = place.geometry.location.lng();
    }

    // Extrai componentes do endereço
    if (place.address_components) {
      place.address_components.forEach((component: any) => {
        const types = component.types;

        if (types.includes('street_number')) {
          details.number = component.long_name;
        }
        if (types.includes('route')) {
          details.street = component.long_name;
        }
        if (
          types.includes('sublocality') ||
          types.includes('sublocality_level_1') ||
          types.includes('neighborhood')
        ) {
          details.neighborhood = component.long_name;
        }
        if (
          types.includes('administrative_area_level_2') ||
          types.includes('locality')
        ) {
          details.city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          details.state = component.long_name;
          details.stateCode = component.short_name;
        }
        if (types.includes('postal_code')) {
          details.zipCode = component.long_name;
        }
        if (types.includes('country')) {
          details.country = component.long_name;
        }
      });
    }

    return details;
  }

  /**
   * Busca sugestões de ruas em uma cidade específica
   */
  getStreetSuggestions(street: string, city?: string, state?: string): Observable<PlacePrediction[]> {
    let input = street;
    if (city) input += `, ${city}`;
    if (state) input += `, ${state}`;
    input += ', Brasil';

    // Usar apenas 'address' - não misturar com 'route' para evitar INVALID_REQUEST
    return this.getPlacePredictions(input, ['address']);
  }

  /**
   * Busca sugestões de cidades em um estado
   */
  getCitySuggestions(city: string, state?: string): Observable<PlacePrediction[]> {
    let input = city;
    if (state) input += `, ${state}`;
    input += ', Brasil';

    return this.getPlacePredictions(input, ['(cities)']);
  }

  /**
   * Busca sugestões de bairros em uma cidade
   */
  getNeighborhoodSuggestions(
    neighborhood: string,
    city?: string,
    state?: string
  ): Observable<PlacePrediction[]> {
    let input = neighborhood;
    if (city) input += `, ${city}`;
    if (state) input += `, ${state}`;
    input += ', Brasil';

    return this.getPlacePredictions(input, ['neighborhood', 'sublocality']);
  }

  /**
   * Verifica se a API do Google Maps está disponível
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.google;
  }
}
