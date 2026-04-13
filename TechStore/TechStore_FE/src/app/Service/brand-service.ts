import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private apiUrl = environment.apiUrl;
  readonly PhotosUrl = environment.apiUrl.replace('/api', '/images');

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  getBrand(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/Brands');
  }

  getBrandDetails(id: number): Observable<any> {
    const url = `${this.apiUrl}/Brands/${id}`;
    return this.http.get<any>(url);
  }

  getBrand_idDM(id: number): Observable<any> {
    const url = `${this.apiUrl}/Brands/ByCategory/${id}`;
    return this.http.get<any>(url);
  }

  deleteBrand(id: number) {
    const url = `${this.apiUrl}/Brands/${id}`;
    return this.http.delete<any>(url, this.httpOptions);
  }

  public updateBrand(id: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/Brands/${id}`;
    return this.http.put<any>(url, data, this.httpOptions);
  }

  public addBrand(data: any) {
    const url = `${this.apiUrl}/Brands`;
    return this.http.post<any>(url, data);
  }
}
