// src/app/home/components/contact-form/contact-form.ts
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, tap, of } from 'rxjs';
import { AddressLookupService } from '../../service/address-lookup.service';
import { Address } from '../../models/address.model';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './contact-form.html',
  styleUrls: ['./contact-form.css'],
})
export class ContactFormComponent implements OnChanges, OnDestroy {
  @Input() contact: any | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

  // Estado da busca de endereço
  addressSuggestions: Address[] = [];
  isLoadingAddress = false;
  showSuggestions = false;
  private streetSearchSubject = new Subject<string>();

  // Modal de confirmação
  showConfirmModal = false;

  // Autocomplete em cascata
  states: string[] = [];
  cities: string[] = [];
  neighborhoods: string[] = [];
  showStateSuggestions = false;
  showCitySuggestions = false;
  showNeighborhoodSuggestions = false;
  isLoadingCities = false;
  isLoadingNeighborhoods = false;
  private citySearchSubject = new Subject<string>();
  private neighborhoodSearchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private addressService: AddressLookupService
  ) {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      cpf: ['', Validators.required],
      phone: ['', Validators.required],

      // Campos de endereço
      cep: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      complement: [''],
      neighborhood: ['', Validators.required],
      latitude: [null],
      longitude: [null],
    });

    this.setupCepLookup();
    this.setupStreetSearch();
    this.setupCitySearch();
    this.setupNeighborhoodSearch();
    this.loadStates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contact']) {
      if (this.contact) {
        this.form.patchValue(this.contact);
      } else {
        this.form.reset();
      }
      // Salva o valor inicial após resetar/preencher o formulário
      this.initialFormValue = this.form.getRawValue();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit() {
    if (this.form.invalid) return;
    this.save.emit(this.form.value);
  }

  // Verifica se o formulário foi modificado
  isFormDirty(): boolean {
    const currentValue = this.form.getRawValue();
    return JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
  }

  // Método chamado pelo template para fechar/cancelar
  cancel() {
    if (this.isFormDirty()) {
      this.showConfirmModal = true;
      return;
    }
    this.close.emit();
  }

  // Confirma o cancelamento
  confirmCancel() {
    this.showConfirmModal = false;
    this.close.emit();
  }

  // Cancela o fechamento da modal
  cancelClose() {
    this.showConfirmModal = false;
  }

  // Configura busca automática de endereço ao digitar CEP (via ViaCEP/backend)
  private setupCepLookup(): void {
    this.form.get('cep')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.isLoadingAddress = true;
        }),
        switchMap((cep: string) => {
          if (!cep || cep.length < 8) {
            this.isLoadingAddress = false;
            return of(null);
          }
          // Remove traços e outros caracteres
          const cleanCep = cep.replace(/\D/g, '');
          return this.addressService.searchByCep(cleanCep);
        })
      )
      .subscribe({
        next: (address) => {
          this.isLoadingAddress = false;

          // Se encontrou endereço, preenche automaticamente
          if (address) {
            this.fillFormWithAddress(address);
          }
        },
        error: () => {
          this.isLoadingAddress = false;
        }
      });
  }

  // Configura busca por rua com autocomplete usando Google Places
  private setupStreetSearch(): void {
    this.streetSearchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(400), // Debounce de 400ms
        distinctUntilChanged(),
        tap(() => {
          this.isLoadingAddress = true;
          this.addressSuggestions = [];
        }),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 3) {
            this.isLoadingAddress = false;
            this.showSuggestions = false;
            return [];
          }

          // Obtém UF e cidade se já estiverem preenchidos (ajuda a refinar busca)
          const state = this.form.get('state')?.value;
          const city = this.form.get('city')?.value;

          return this.addressService.searchStreets(searchTerm, city, state);
        })
      )
      .subscribe({
        next: (addresses) => {
          this.addressSuggestions = addresses;
          this.isLoadingAddress = false;
          this.showSuggestions = addresses.length > 0;
        },
        error: () => {
          this.isLoadingAddress = false;
          this.showSuggestions = false;
        }
      });
  }

  // Método chamado quando usuário digita no campo Street
  onStreetChange(searchTerm: string): void {
    this.streetSearchSubject.next(searchTerm);
  }

  // Preenche o formulário com o endereço selecionado
  selectAddress(address: Address): void {
    // Se o endereço tem placeId (Google Places), busca detalhes completos
    if (address.placeId) {
      this.isLoadingAddress = true;
      this.addressService.getAddressDetails(address.placeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (detailedAddress) => {
            this.fillFormWithAddress(detailedAddress);
            this.isLoadingAddress = false;
          },
          error: () => {
            // Se falhar, usa os dados parciais
            this.fillFormWithAddress(address);
            this.isLoadingAddress = false;
          }
        });
    } else {
      // Usa dados diretos do ViaCEP ou outro source
      this.fillFormWithAddress(address);
    }

    this.showSuggestions = false;
    this.addressSuggestions = [];
  }

  // Preenche o formulário com dados do endereço
  private fillFormWithAddress(address: Address): void {
    // Formata CEP removendo hífen para o mask
    const cepFormatted = address.cep?.replace(/\D/g, '') || '';

    this.form.patchValue({
      cep: cepFormatted,
      state: address.uf || '',
      city: address.localidade || '',
      street: address.logradouro || '',
      neighborhood: address.bairro || '',
      complement: address.complemento || '',
      latitude: address.latitude,
      longitude: address.longitude,
    });

    // Atualiza listas de cidades e bairros se necessário
    const state = address.uf;
    const city = address.localidade;
    const neighborhood = address.bairro;

    if (state) {
      this.isLoadingCities = true;
      this.addressService.getCities(state)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cities) => {
            this.cities = cities;
            if (city && !cities.includes(city)) {
              this.cities = [city, ...cities];
            }
            this.isLoadingCities = false;
          },
          error: () => this.isLoadingCities = false
        });
    }

    if (state && city) {
      this.isLoadingNeighborhoods = true;
      this.addressService.getNeighborhoods(state, city)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (neighborhoods) => {
            this.neighborhoods = neighborhoods;
            if (neighborhood && !neighborhoods.includes(neighborhood)) {
              this.neighborhoods = [neighborhood, ...neighborhoods];
            }
            this.isLoadingNeighborhoods = false;
          },
          error: () => this.isLoadingNeighborhoods = false
        });
    }

    // Foca no campo de número
    setTimeout(() => {
      const numberInput = document.querySelector('input[formControlName="number"]') as HTMLInputElement;
      if (numberInput) {
        numberInput.focus();
      }
    }, 100);
  }

  // Carrega lista de estados
  private loadStates(): void {
    this.addressService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => this.states = states,
        error: (error) => console.error('Erro ao carregar estados:', error)
      });
  }

  // Configura busca por cidades com debounce usando Google Places
  private setupCitySearch(): void {
    this.citySearchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isLoadingCities = true),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 2) {
            this.isLoadingCities = false;
            return of([]);
          }
          const state = this.form.get('state')?.value;
          return this.addressService.searchCities(searchTerm, state);
        })
      )
      .subscribe({
        next: (cities) => {
          this.cities = cities;
          this.isLoadingCities = false;
          this.showCitySuggestions = cities.length > 0;
        },
        error: () => {
          this.isLoadingCities = false;
          this.showCitySuggestions = false;
        }
      });
  }

  // Configura busca por bairros com debounce usando Google Places
  private setupNeighborhoodSearch(): void {
    this.neighborhoodSearchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isLoadingNeighborhoods = true),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 2) {
            this.isLoadingNeighborhoods = false;
            return of([]);
          }
          const state = this.form.get('state')?.value;
          const city = this.form.get('city')?.value;
          return this.addressService.searchNeighborhoods(searchTerm, city, state);
        })
      )
      .subscribe({
        next: (neighborhoods) => {
          this.neighborhoods = neighborhoods;
          this.isLoadingNeighborhoods = false;
          this.showNeighborhoodSuggestions = neighborhoods.length > 0;
        },
        error: () => {
          this.isLoadingNeighborhoods = false;
          this.showNeighborhoodSuggestions = false;
        }
      });
  }

  // Chamado quando UF muda
  onStateChange(state: string): void {
    if (state && state.length === 2) {
      // Carrega todas as cidades do estado
      this.isLoadingCities = true;
      this.addressService.getCities(state)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cities) => {
            this.cities = cities;
            this.isLoadingCities = false;
          },
          error: () => this.isLoadingCities = false
        });

      // Limpa campos dependentes
      this.form.patchValue({
        city: '',
        neighborhood: ''
      });
      this.neighborhoods = [];
    }
  }

  // Chamado quando digita no campo UF
  onStateInput(value: string): void {
    this.showStateSuggestions = value.length > 0;
  }

  // Seleciona um estado da lista
  selectState(state: string): void {
    this.form.patchValue({ state });
    this.showStateSuggestions = false;
    this.onStateChange(state);
  }

  // Chamado quando cidade muda
  onCityChange(city: string): void {
    const uf = this.form.get('state')?.value;
    if (uf && city) {
      // Carrega todos os bairros da cidade
      this.isLoadingNeighborhoods = true;
      this.addressService.getNeighborhoods(uf, city)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (neighborhoods) => {
            this.neighborhoods = neighborhoods;
            this.isLoadingNeighborhoods = false;
          },
          error: () => this.isLoadingNeighborhoods = false
        });

      // Limpa bairro
      this.form.patchValue({ neighborhood: '' });
    }
  }

  // Chamado quando digita no campo City
  onCityInput(value: string): void {
    // Mostra sugestões imediatamente se já temos cidades carregadas
    if (value && this.cities.length > 0) {
      this.showCitySuggestions = true;
    }
    this.citySearchSubject.next(value);
  }

  // Seleciona uma cidade da lista
  selectCity(city: string): void {
    this.form.patchValue({ city });
    this.showCitySuggestions = false;
    this.onCityChange(city);
  }

  // Chamado quando digita no campo Neighborhood
  onNeighborhoodInput(value: string): void {
    // Mostra sugestões imediatamente se já temos bairros carregados
    if (value && this.neighborhoods.length > 0) {
      this.showNeighborhoodSuggestions = true;
    }
    this.neighborhoodSearchSubject.next(value);
  }

  // Seleciona um bairro da lista
  selectNeighborhood(neighborhood: string): void {
    this.form.patchValue({ neighborhood });
    this.showNeighborhoodSuggestions = false;
  }

  // Fecha as sugestões
  closeSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  closeStateSuggestions(): void {
    setTimeout(() => this.showStateSuggestions = false, 200);
  }

  closeCitySuggestions(): void {
    setTimeout(() => this.showCitySuggestions = false, 200);
  }

  closeNeighborhoodSuggestions(): void {
    setTimeout(() => this.showNeighborhoodSuggestions = false, 200);
  }
}
