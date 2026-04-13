import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Order } from '../Models/order';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
private apiUrl = `${environment.apiUrl}/Orders`;

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    })
  };
  private validStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đã xác nhận', 'Đang vận chuyển', 'Đã giao', 'Trả hàng', 'Đã hoàn tiền', 'Đã hủy', 'Vấn đề trong xử lý'];
  constructor(private http: HttpClient) { }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  deleteOrder(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${orderId}`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  postOrder(body: any): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, body, this.httpOptions);
  }

  getOrderByCustomerId(id: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/customer/${id}`, this.httpOptions);
  }

  updateDonhang(id: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, body, this.httpOptions);
  }

  updateOrderStatus(id: number, newStatus: string): Observable<any> {
    console.log('Sending PATCH request for order:', { id, newStatus });
    if (!this.validStatuses.includes(newStatus)) {
      console.error(`Invalid status: ${newStatus}. Valid statuses: ${this.validStatuses.join(', ')}`);
      return throwError(() => new Error(`Trạng thái '${newStatus}' không hợp lệ. Các trạng thái hợp lệ: ${this.validStatuses.join(', ')}`));
    }

    const url = `${this.apiUrl}/${id}`;
    return this.http.patch<any>(url, `"${newStatus}"`, this.httpOptions).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('PATCH error:', error);
        let errorMessage = 'Lỗi khi cập nhật trạng thái đơn hàng!';
        if (error.status === 404) {
          errorMessage = `Không tìm thấy đơn hàng với ID ${id}!`;
        } else if (error.status === 400) {
          errorMessage = `Yêu cầu không hợp lệ: ${error.error || 'Kiểm tra trạng thái đơn hàng!'}`;
        } else if (error.status === 500) {
          errorMessage = 'Lỗi máy chủ, không thể gửi email hoặc cập nhật trạng thái!';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  timkiem(searchText: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search`, {
      params: { keyword: searchText }
    });
  }


}
