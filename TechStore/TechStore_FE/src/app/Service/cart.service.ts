import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface CartItem {
  cart_id?: number;
  user_id: number;
  product_id: number;
  quantity: number;
  added_at?: string;

  product_name?: string;
  price?: number;
  image_url?: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/Carts`;
  
  cartChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  getCartsByUserId(userId: number): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.apiUrl}/user/${userId}`);
  }

  getAllCarts(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(this.apiUrl);
  }

  getCartById(cartId: number): Observable<CartItem> {
    return this.http.get<CartItem>(`${this.apiUrl}/${cartId}`);
  }

  addToCart(item: CartItem): Observable<any> {
    return this.http.post(this.apiUrl, item).pipe(tap(() => {
      this.cartChanged.next();
    }));
  }

  updateCart(cartId: number, item: CartItem): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cartId}`, item).pipe(tap(() => {
      this.cartChanged.next();
    }));
  }

  deleteCart(cartId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${cartId}`).pipe(tap(() => {
      this.cartChanged.next();
    }));
  }
}
