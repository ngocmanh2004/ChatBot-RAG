  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { Observable } from 'rxjs';
  import { User } from '../Models/users';
  import { environment } from '../../environments/environments';

  @Injectable({
  providedIn: 'root'
})
export class OrderDetailService {
private apiUrl = `${environment.apiUrl}/Order_Details`;

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    })
  }

  constructor(private http: HttpClient) {}

  getOrderTails(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getOrderDetailById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  getOrderDetailByOrderId(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/order_id/${orderId}`, this.httpOptions);
  }

  postOrderDetail(body: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, body, this.httpOptions);
  }

  deleteOrderDetailsByOrderId(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/order_id/${orderId}`);
  }

  deleteOrderDetailById(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
