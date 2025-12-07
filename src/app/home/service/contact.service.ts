import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/contacts';

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createContact(body: any): Observable<any> {
    return this.http.post(this.baseUrl, body, {
      headers: this.getAuthHeaders(),
    });
  }

  getContacts(filter: string = '', page = 0, size = 10, sort = 'name,asc'): Observable<any> {
    const params = {
      filter,
      page: page.toString(),
      size: size.toString(),
      sort,
    };

    return this.http.get(this.baseUrl, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateContact(id: number, body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, body, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
