import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map';
import { Contact } from '../../models/contact.model';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default center and zoom', () => {
    expect(component.center).toEqual({ lat: -14.235004, lng: -51.925280 });
    expect(component.zoom).toBe(4);
  });

  it('should center on single selected contact', () => {
    const contact: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      neighborhood: 'Sé',
      latitude: -23.5505199,
      longitude: -46.6333094
    };

    component.selectedContacts = [contact];
    component.centerOnSelectedContacts();

    expect(component.center).toEqual({ lat: -23.5505199, lng: -46.6333094 });
    expect(component.zoom).toBe(15);
  });

  it('should return marker position for contact with coordinates', () => {
    const contact: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      neighborhood: 'Sé',
      latitude: -23.5505199,
      longitude: -46.6333094
    };

    const position = component.getMarkerPosition(contact);

    expect(position).toEqual({ lat: -23.5505199, lng: -46.6333094 });
  });

  it('should return null for contact without coordinates', () => {
    const contact: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      neighborhood: 'Sé'
    };

    const position = component.getMarkerPosition(contact);

    expect(position).toBeNull();
  });

  it('should correctly identify selected contact', () => {
    const contact: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      neighborhood: 'Sé',
      latitude: -23.5505199,
      longitude: -46.6333094
    };

    component.selectedContacts = [contact];

    expect(component.isSelected(contact)).toBe(true);
  });

  it('should format full address correctly', () => {
    const contact: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      complement: 'Apto 101',
      neighborhood: 'Sé',
      latitude: -23.5505199,
      longitude: -46.6333094
    };

    const address = component.getFullAddress(contact);

    expect(address).toBe('Praça da Sé, 1, Apto 101, Sé, São Paulo, SP, CEP: 01001000');
  });

  it('should return marker options with different colors for selected and unselected', () => {
    const contact: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      neighborhood: 'Sé',
      latitude: -23.5505199,
      longitude: -46.6333094
    };

    // Não selecionado
    let options = component.getMarkerOptions(contact);
    expect(options.icon).toBeDefined();

    // Selecionado
    component.selectedContacts = [contact];
    options = component.getMarkerOptions(contact);
    expect(options.icon).toBeDefined();
    expect(options.animation).toBe(google.maps.Animation.BOUNCE);
  });

  it('should handle multiple selected contacts', () => {
    const contact1: Contact = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678900',
      phone: '11999999999',
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Praça da Sé',
      number: '1',
      neighborhood: 'Sé',
      latitude: -23.5505199,
      longitude: -46.6333094
    };

    const contact2: Contact = {
      id: 2,
      name: 'Maria Santos',
      cpf: '98765432100',
      phone: '21988888888',
      cep: '20040020',
      state: 'RJ',
      city: 'Rio de Janeiro',
      street: 'Av. Rio Branco',
      number: '100',
      neighborhood: 'Centro',
      latitude: -22.9068467,
      longitude: -43.1728965
    };

    component.selectedContacts = [contact1, contact2];
    component.centerOnSelectedContacts();

    // Verifica que ambos são identificados como selecionados
    expect(component.isSelected(contact1)).toBe(true);
    expect(component.isSelected(contact2)).toBe(true);

    // Verifica que o zoom foi ajustado para mostrar múltiplos pontos
    expect(component.zoom).toBeLessThan(15);
  });

  it('should reset to default view when no contacts selected', () => {
    component.selectedContacts = [];
    component.ngOnChanges({
      selectedContacts: {
        currentValue: [],
        previousValue: undefined,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.center).toEqual({ lat: -14.235004, lng: -51.925280 });
    expect(component.zoom).toBe(4);
  });
});
