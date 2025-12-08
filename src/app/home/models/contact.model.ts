// src/app/home/models/contact.model.ts
export interface Contact {
  id?: number;
  name: string;
  cpf: string;
  phone: string;
  cep: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  latitude?: number | null;
  longitude?: number | null;
}
