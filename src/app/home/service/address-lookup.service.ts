// src/app/home/service/address-lookup.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Address, AddressSearchParams } from '../models/address.model';
import { GooglePlacesService, PlacePrediction } from './google-places.service';
import { BrazilianDataService } from './brazilian-data.service';
import { environment } from '../../../environments/environment';

/**
 * Serviço de busca de endereços usando estratégia híbrida:
 *
 * 1. Estados e Cidades: Arquivo JSON local (brazilian-cities.json)
 *    - Dados completos e instantâneos
 *    - Não consome API do Google
 *    - Lista fixa e confiável
 *
 * 2. Ruas, Bairros e Coordenadas: Google Places API
 *    - Dados em tempo real
 *    - Autocomplete inteligente
 *    - Geocodificação automática
 *
 * 3. CEP: ViaCEP via backend (fallback mantido)
 */
@Injectable({
  providedIn: 'root',
})
export class AddressLookupService {
  private http = inject(HttpClient);
  private googlePlaces = inject(GooglePlacesService);
  private brazilianData = inject(BrazilianDataService);
  private baseUrl = `${environment.apiUrl}/address`;

  /**
   * Lista todos os estados brasileiros (do arquivo local)
   * 27 estados carregados instantaneamente do JSON
   */
  getStates(): Observable<string[]> {
    return this.brazilianData.getStates();
  }

  /**
   * Lista cidades de um estado (do arquivo local)
   * ~5.570 cidades disponíveis offline
   * @param uf Estado
   * @param q Filtro opcional (para buscar cidade específica)
   */
  getCities(uf: string, q?: string): Observable<string[]> {
    if (q && q.length >= 2) {
      return this.brazilianData.searchCitiesByState(uf, q);
    }
    return this.brazilianData.getCitiesByState(uf);
  }

  /**
   * Lista bairros de uma cidade usando Google Places
   * Não há endpoint no backend para bairros - usa Google Places diretamente
   * @param uf Estado
   * @param city Cidade
   * @param q Filtro opcional (para buscar bairro específico)
   */
  getNeighborhoods(uf: string, city: string, q?: string): Observable<string[]> {
    // Se não há termo de busca, retorna vazio (Google Places precisa de input)
    if (!q || q.length < 2) {
      return of([]);
    }

    // Usa Google Places para buscar bairros
    return this.searchNeighborhoods(q, city, uf);
  }

  /**
   * Busca endereço por CEP usando ViaCEP (via backend)
   * Endpoint: GET /api/address/cep/{cep}
   */
  searchByCep(cep: string): Observable<Address | null> {
    if (!cep || cep.length < 8) {
      return of(null);
    }

    // Remove tudo que não é dígito
    const cleanCep = cep.replace(/\D/g, '');

    return this.http
      .get<Address>(`${this.baseUrl}/cep/${cleanCep}`)
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar CEP:', error);
          return of(null);
        })
      );
  }

  /**
   * Busca endereços por UF + Cidade + Rua usando ViaCEP (via backend)
   * Endpoint: GET /api/address/search?uf=XX&city=YY&street=ZZ
   */
  searchByUfCityStreet(uf: string, city: string, street: string): Observable<Address[]> {
    if (!uf || !city || !street || street.length < 3) {
      return of([]);
    }

    const httpParams = new HttpParams()
      .set('uf', uf)
      .set('city', city)
      .set('street', street);

    return this.http
      .get<Address[]>(`${this.baseUrl}/search`, { params: httpParams })
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar endereços:', error);
          return of([]);
        })
      );
  }

  /**
   * Busca sugestões de ruas usando Google Places API
   * @param street Nome da rua
   * @param city Cidade (opcional, refina a busca)
   * @param state Estado (opcional, refina a busca)
   */
  searchStreets(street: string, city?: string, state?: string): Observable<Address[]> {
    if (!street || street.length < 3) {
      return of([]);
    }

    return this.googlePlaces.getStreetSuggestions(street, city, state).pipe(
      map((predictions) => this.mapPredictionsToAddresses(predictions)),
      catchError((error) => {
        console.error('Erro ao buscar ruas:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca sugestões de cidades usando Google Places API
   */
  searchCities(city: string, state?: string): Observable<string[]> {
    if (!city || city.length < 2) {
      return of([]);
    }

    return this.googlePlaces.getCitySuggestions(city, state).pipe(
      map((predictions) => predictions.map(p => p.mainText)),
      catchError((error) => {
        console.error('Erro ao buscar cidades:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca sugestões de bairros usando Google Places API
   */
  searchNeighborhoods(neighborhood: string, city?: string, state?: string): Observable<string[]> {
    if (!neighborhood || neighborhood.length < 2) {
      return of([]);
    }

    return this.googlePlaces.getNeighborhoodSuggestions(neighborhood, city, state).pipe(
      map((predictions) => predictions.map(p => p.mainText)),
      catchError((error) => {
        console.error('Erro ao buscar bairros:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtém detalhes completos de um endereço usando Place ID
   */
  getAddressDetails(placeId: string): Observable<Address> {
    return this.googlePlaces.getPlaceDetails(placeId).pipe(
      map((details): Address => ({
        cep: details.zipCode || null,
        logradouro: details.street || null,
        complemento: null,
        bairro: details.neighborhood || null,
        localidade: details.city || null,
        uf: details.stateCode || null,
        latitude: details.latitude || null,
        longitude: details.longitude || null,
        source: 'google-places' as const,
        exact: true,
        display: details.formattedAddress,
      })),
      catchError((error) => {
        console.error('Erro ao obter detalhes do endereço:', error);
        throw error;
      })
    );
  }

  /**
   * Converte predições do Google Places para formato Address
   */
  private mapPredictionsToAddresses(predictions: PlacePrediction[]): Address[] {
    return predictions.map((p): Address => ({
      cep: null,
      logradouro: p.mainText,
      complemento: null,
      bairro: null,
      localidade: this.extractCityFromSecondary(p.secondaryText),
      uf: this.extractStateFromSecondary(p.secondaryText),
      latitude: null,
      longitude: null,
      source: 'google-places' as const,
      exact: false,
      display: p.description,
      placeId: p.placeId, // Guardamos o placeId para buscar detalhes depois
    }));
  }

  /**
   * Extrai cidade do texto secundário (ex: "Centro, São Paulo - SP")
   */
  private extractCityFromSecondary(secondary: string): string | null {
    if (!secondary) return null;
    const parts = secondary.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      // Remove o estado se existir
      const cityPart = parts[parts.length - 1].split('-')[0].trim();
      return cityPart;
    }
    return null;
  }

  /**
   * Extrai estado do texto secundário (ex: "Centro, São Paulo - SP")
   */
  private extractStateFromSecondary(secondary: string): string | null {
    if (!secondary) return null;
    const match = secondary.match(/- ([A-Z]{2})/);
    return match ? match[1] : null;
  }
}
