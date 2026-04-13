import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../Models/users';
import { Order } from '../Models/order';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
private apiUrl = `${environment.apiUrl}/Reviews`;

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    })
  }
  constructor(private http: HttpClient) { }

  getReviewById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getReviewsByProduct(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/product/${productId}`);
  }

  addReview(review: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, review);
  }

  getReviewsByUser(userId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }

  updateReview(id: number, body: any): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<any>(url, body, this.httpOptions);
  }

  deleteReview(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
