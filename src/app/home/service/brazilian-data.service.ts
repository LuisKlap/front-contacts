// src/app/home/service/brazilian-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, shareReplay, catchError } from 'rxjs';

export interface StateData {
  sigla: string;
  nome: string;
  cidades: string[];
}

export interface BrazilianData {
  estados: StateData[];
}

/**
 * Serviço para carregar e consultar dados estáticos de estados e cidades brasileiras
 * Carrega o arquivo brazilian-cities.json uma única vez e mantém em cache
 */
@Injectable({
  providedIn: 'root',
})
export class BrazilianDataService {
  private data$: Observable<BrazilianData> | null = null;
  private dataLoaded = false;
  private cachedData: BrazilianData | null = null;

  constructor(private http: HttpClient) { }

  /**
   * Carrega dados do arquivo JSON (com cache)
   */
  private loadData(): Observable<BrazilianData> {
    if (!this.data$) {
      this.data$ = this.http.get<BrazilianData>('/brazilian-cities.json').pipe(
        map((data) => {
          this.cachedData = data;
          this.dataLoaded = true;
          return data;
        }),
        shareReplay(1), // Cache em memória
        catchError((error) => {
          console.error('Erro ao carregar dados brasileiros:', error);
          return of({ estados: [] });
        })
      );
    }
    return this.data$;
  }

  /**
   * Retorna todos os estados (siglas)
   */
  getStates(): Observable<string[]> {
    return this.loadData().pipe(
      map((data) => data.estados.map((e) => e.sigla).sort())
    );
  }

  /**
   * Retorna dados completos de um estado
   */
  getStateData(sigla: string): Observable<StateData | null> {
    return this.loadData().pipe(
      map((data) => {
        const state = data.estados.find(
          (e) => e.sigla.toUpperCase() === sigla.toUpperCase()
        );
        return state || null;
      })
    );
  }

  /**
   * Retorna todas as cidades de um estado
   */
  getCitiesByState(sigla: string): Observable<string[]> {
    return this.getStateData(sigla).pipe(
      map((state) => (state ? state.cidades.sort() : []))
    );
  }

  /**
   * Filtra cidades de um estado por termo de busca
   */
  searchCitiesByState(sigla: string, query: string): Observable<string[]> {
    return this.getCitiesByState(sigla).pipe(
      map((cities) => {
        if (!query || query.trim() === '') {
          return cities;
        }
        const lowerQuery = query.toLowerCase();
        return cities.filter((city) =>
          city.toLowerCase().includes(lowerQuery)
        );
      })
    );
  }

  /**
   * Verifica se uma cidade existe em um estado
   */
  cityExistsInState(sigla: string, cityName: string): Observable<boolean> {
    return this.getCitiesByState(sigla).pipe(
      map((cities) => {
        const lowerCityName = cityName.toLowerCase();
        return cities.some((city) => city.toLowerCase() === lowerCityName);
      })
    );
  }

  /**
   * Retorna nome completo do estado pela sigla
   */
  getStateName(sigla: string): Observable<string | null> {
    return this.getStateData(sigla).pipe(
      map((state) => (state ? state.nome : null))
    );
  }

  /**
   * Busca estados pelo nome (útil para autocomplete)
   */
  searchStates(query: string): Observable<StateData[]> {
    return this.loadData().pipe(
      map((data) => {
        if (!query || query.trim() === '') {
          return data.estados;
        }
        const lowerQuery = query.toLowerCase();
        return data.estados.filter(
          (state) =>
            state.sigla.toLowerCase().includes(lowerQuery) ||
            state.nome.toLowerCase().includes(lowerQuery)
        );
      })
    );
  }

  /**
   * Retorna total de estados cadastrados
   */
  getTotalStates(): Observable<number> {
    return this.loadData().pipe(map((data) => data.estados.length));
  }

  /**
   * Retorna total de cidades cadastradas
   */
  getTotalCities(): Observable<number> {
    return this.loadData().pipe(
      map((data) =>
        data.estados.reduce((total, state) => total + state.cidades.length, 0)
      )
    );
  }

  /**
   * Verifica se os dados já foram carregados (para uso síncrono)
   */
  isDataLoaded(): boolean {
    return this.dataLoaded;
  }

  /**
   * Retorna dados em cache (síncrono, apenas se já carregado)
   */
  getCachedData(): BrazilianData | null {
    return this.cachedData;
  }

  /**
   * Retorna estados em cache (síncrono, apenas se já carregado)
   */
  getCachedStates(): string[] {
    if (!this.cachedData) return [];
    return this.cachedData.estados.map((e) => e.sigla).sort();
  }

  /**
   * Retorna cidades de um estado em cache (síncrono, apenas se já carregado)
   */
  getCachedCitiesByState(sigla: string): string[] {
    if (!this.cachedData) return [];
    const state = this.cachedData.estados.find(
      (e) => e.sigla.toUpperCase() === sigla.toUpperCase()
    );
    return state ? state.cidades.sort() : [];
  }
}
