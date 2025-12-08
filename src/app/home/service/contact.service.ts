import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/contacts';

  createContact(body: Contact): Observable<Contact> {
    return this.http.post<Contact>(this.baseUrl, body);
  }

  getContacts(filter: string = '', page = 0, size = 10, sort = 'name,asc'): Observable<any> {
    const params = {
      filter,
      page: page.toString(),
      size: size.toString(),
      sort,
    };

    return this.http.get(this.baseUrl, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  updateContact(id: number, body: Contact): Observable<Contact> {
    return this.http.put<Contact>(`${this.baseUrl}/${id}`, body);
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
