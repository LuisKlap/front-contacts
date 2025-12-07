import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactFilters } from './contact-filters';

describe('ContactFilters', () => {
  let component: ContactFilters;
  let fixture: ComponentFixture<ContactFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactFilters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
