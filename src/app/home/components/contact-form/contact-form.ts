// src/app/home/components/contact-form/contact-form.ts
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, tap, of, map } from 'rxjs';
import { AddressLookupService } from '../../service/address-lookup.service';
import { BrazilianDataService } from '../../service/brazilian-data.service';
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
  filteredStates: string[] = [];
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
    private addressService: AddressLookupService,
    private brazilianData: BrazilianDataService,
    private cdr: ChangeDetectorRef
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
    const formData = this.form.getRawValue();
    console.log('Form data completo:', formData);
    console.log('Neighborhood value:', formData.neighborhood);
    this.save.emit(formData);
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

  // Configura busca por rua com autocomplete usando Google Places + ViaCEP
  private setupStreetSearch(): void {
    this.streetSearchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(400), // Debounce de 400ms
        distinctUntilChanged(),
        tap(() => {
          this.isLoadingAddress = true;
          this.showSuggestions = true; // Mostra enquanto carrega
          this.cdr.markForCheck();
        }),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 3) {
            this.isLoadingAddress = false;
            this.showSuggestions = false;
            this.addressSuggestions = [];
            this.cdr.markForCheck();
            return [];
          }

          // Obtém UF e cidade se já estiverem preenchidos
          const state = this.form.get('state')?.value;
          const city = this.form.get('city')?.value;

          // Se tem UF e cidade, busca no ViaCEP + Google Places
          if (state && city) {
            return this.addressService.searchByUfCityStreet(state, city, searchTerm).pipe(
              switchMap((viaCepResults) => {
                // Também busca no Google Places
                return this.addressService.searchStreets(searchTerm, city, state).pipe(
                  map((googleResults) => {
                    // Combina resultados: ViaCEP primeiro (mais precisos)
                    return [...viaCepResults, ...googleResults];
                  })
                );
              })
            );
          }

          // Se não tem UF e cidade, usa apenas Google Places
          return this.addressService.searchStreets(searchTerm, city, state);
        })
      )
      .subscribe({
        next: (addresses) => {
          this.addressSuggestions = addresses;
          this.isLoadingAddress = false;
          this.showSuggestions = addresses.length > 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingAddress = false;
          this.addressSuggestions = [];
          this.showSuggestions = false;
          this.cdr.markForCheck();
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
      this.brazilianData.getCitiesByState(state)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cities) => {
            this.cities = cities;
            if (city && !cities.includes(city)) {
              this.cities = [city, ...cities];
            }
            this.isLoadingCities = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingCities = false;
            this.cdr.markForCheck();
          }
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
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingNeighborhoods = false;
            this.cdr.markForCheck();
          }
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

  // Carrega lista de estados do JSON local
  private loadStates(): void {
    this.brazilianData.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states;
          this.filteredStates = states; // Inicializa com todos os estados
          this.cdr.markForCheck();
        },
        error: (error) => console.error('Erro ao carregar estados:', error)
      });
  }

  // Configura busca por cidades com debounce usando JSON local
  private setupCitySearch(): void {
    this.citySearchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.isLoadingCities = true;
          this.cdr.markForCheck();
        }),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 2) {
            this.isLoadingCities = false;
            this.cdr.markForCheck();
            return of([]);
          }
          const state = this.form.get('state')?.value;
          // Usa JSON local se tiver estado, senão busca no Google Places
          if (state) {
            return this.brazilianData.searchCitiesByState(state, searchTerm);
          }
          return this.addressService.searchCities(searchTerm, state);
        })
      )
      .subscribe({
        next: (cities) => {
          this.cities = cities;
          this.isLoadingCities = false;
          this.showCitySuggestions = cities.length > 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingCities = false;
          this.cities = [];
          this.showCitySuggestions = false;
          this.cdr.markForCheck();
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
        tap(() => {
          this.isLoadingNeighborhoods = true;
          this.showNeighborhoodSuggestions = true; // Mostra enquanto carrega
          this.cdr.markForCheck();
        }),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 2) {
            this.isLoadingNeighborhoods = false;
            this.showNeighborhoodSuggestions = false;
            this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingNeighborhoods = false;
          this.neighborhoods = [];
          this.showNeighborhoodSuggestions = false;
          this.cdr.markForCheck();
        }
      });
  }

  // Chamado quando UF muda
  onStateChange(state: string): void {
    if (state && state.length === 2) {
      // Carrega todas as cidades do estado usando JSON local
      this.isLoadingCities = true;
      this.brazilianData.getCitiesByState(state)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cities) => {
            this.cities = cities;
            this.isLoadingCities = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingCities = false;
            this.cdr.markForCheck();
          }
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
    const upperValue = value.toUpperCase();
    if (upperValue.length === 0) {
      // Se vazio, mostra todos
      this.filteredStates = this.states;
    } else {
      // Filtra estados que começam com o valor digitado
      this.filteredStates = this.states.filter(state =>
        state.toUpperCase().startsWith(upperValue)
      );
    }
    this.showStateSuggestions = true;
    this.cdr.markForCheck();
  }

  // Chamado quando foca no campo UF
  onStateFocus(): void {
    this.filteredStates = this.states;
    this.showStateSuggestions = true;
    this.cdr.markForCheck();
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
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingNeighborhoods = false;
            this.cdr.markForCheck();
          }
        });

      // Limpa bairro
      this.form.patchValue({ neighborhood: '' });
    }
  }

  // Chamado quando digita no campo City
  onCityInput(value: string): void {
    if (value.length >= 2) {
      this.citySearchSubject.next(value);
    } else if (value.length === 0) {
      // Se limpar o campo, mostra todas as cidades novamente
      this.showCitySuggestions = this.cities.length > 0;
      this.cdr.markForCheck();
    }
  }

  // Chamado quando foca no campo City
  onCityFocus(): void {
    // Mostra lista se já tiver cidades carregadas ou carrega do estado usando JSON local
    const state = this.form.get('state')?.value;
    if (state && this.cities.length === 0) {
      this.isLoadingCities = true;
      this.brazilianData.getCitiesByState(state)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cities) => {
            this.cities = cities;
            this.isLoadingCities = false;
            this.showCitySuggestions = cities.length > 0;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingCities = false;
            this.cdr.markForCheck();
          }
        });
    } else if (this.cities.length > 0) {
      this.showCitySuggestions = true;
      this.cdr.markForCheck();
    }
  }

  // Seleciona uma cidade da lista
  selectCity(city: string): void {
    this.form.patchValue({ city });
    this.showCitySuggestions = false;
    this.onCityChange(city);
  }

  // Chamado quando digita no campo Neighborhood
  onNeighborhoodInput(value: string): void {
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
