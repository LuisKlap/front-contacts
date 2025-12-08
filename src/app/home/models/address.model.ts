// src/app/home/models/address.model.ts
export interface Address {
  cep: string | null;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  localidade: string | null;
  uf: string | null;
  latitude: number | null;
  longitude: number | null;
  source: 'viacep' | 'google' | 'viacep+google' | 'google-places';
  exact: boolean;
  display: string;
  placeId?: string; // ID do Google Places para buscar detalhes completos
}

export interface AddressSearchParams {
  q: string;
  uf?: string;
  city?: string;
  limit?: number;
}
