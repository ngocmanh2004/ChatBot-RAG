import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../Models/product';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})

export class ProductService {
private apiUrl = environment.apiUrl;
readonly PhotosUrl = environment.apiUrl.replace('/api', '/images');


  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    })
  }

  constructor(private http: HttpClient) { }

  public getByIdDM(idDM: number): Observable<any> {
    const url = `${this.apiUrl}/Products/ByCategory/${idDM}`;
    return this.http.get<any>(url);
  }

  public getByIdTH(idTH: number): Observable<any> {
    const url = `${this.apiUrl}/Products/ByBrand/${idTH}`;
    return this.http.get<any>(url);
  }

  getProductsByCategoryAndBrand(category_id: number, brand_id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Products/categories/${category_id}/brands/${brand_id}`);
  }

  getProductDetails(id: number): Observable<Product> {
    const url = `${this.apiUrl}/Products/${id}`;
    return this.http.get<Product>(url);
  }

  getCategoryById(id: number): Observable<{ category_id: number; category_name: string }> {
    return this.http.get<{ category_id: number; category_name: string }>(`${this.apiUrl}/categories/${id}`);
  }

  getBrandsByCategory(categoryId: number): Observable<any> {
    const url = `${this.apiUrl}/Brands/ByCategory/${categoryId}`;
    return this.http.get<any>(url);
  }

  getProductsByCategoryBrandAndPrice(categoryId: number, brandId: number, priceCategory: string): Observable<any> {
    const url = `${this.apiUrl}/Products/categories/${categoryId}/brands/${brandId}/ByPriceCategory/${priceCategory}`;
    return this.http.get<any>(url);
  }

  getProductsByPriceCategory(categoryId: number, priceCategory: string): Observable<any> {
    const url = `${this.apiUrl}/Products/categories/${categoryId}/ByPriceCategory/${priceCategory}`;
    return this.http.get<any>(url);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl + '/Products');
  }

  timkiem(searchText: string): Observable<any> {
    const url = `${this.apiUrl}/Products/search/${searchText}`;
    return this.http.get<any>(url);
  }


  getProductsByIds(productIds: number[]): Observable<Product[]> {

    const params = new HttpParams().set('ids', productIds.join(','));

    const url = `${this.apiUrl}/Products/by-ids`;
    return this.http.get<Product[]>(url, { params });
  }


  postProduct(body: any) {
    const url = `${this.apiUrl}/Products`;
    return this.http.post(url, body);
  }



  deleteProduct(id: number) {
    const url = `${this.apiUrl}/Products/${id}`;
    return this.http.delete<any>(url, this.httpOptions)

  }

  updateProduct(id: number, body: any): Observable<any> {
    const url = `${this.apiUrl}/Products/${id}`;
    return this.http.put<any>(url, body, this.httpOptions);
  }

  taiAnh(formData: FormData): Observable<string> {
    const url = `${this.apiUrl}/Products/SaveFile`;
    return this.http.post<string>(url, formData);  // Sending FormData to the backend
  }

}
