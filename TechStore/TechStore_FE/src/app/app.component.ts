import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService, CartItem } from './Service/cart.service';
import { userService } from './Service/userService';
import { ProductService } from './Service/productService';
import { map, forkJoin } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface CartDisplayItem {
  cart_id: number;
  product_id: number;
  quantity: number;
  PathAnh: string;
  product_name: string;
  price: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  cartItems: CartDisplayItem[] = [];
  showCartPanel = false;
  userId: number | null = null;
  isCartDetailPage: boolean = false;

  constructor(
    private cartService: CartService,
    private userService: userService,
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userService.getCurrentUserObservable().subscribe(user => {
      if (user) {
        this.userId = user.user_id;
        this.loadCart();
      } else {
        this.userId = null;
        this.cartItems = [];
      }
    });

    const user = this.userService.getCurrentUser();
    if (user) {
      this.userId = user.user_id;
      this.loadCart();
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        this.isCartDetailPage =
          url.includes('/home/product/carts') ||
          url.startsWith('/admin');
      });


    this.cartService.cartChanged.subscribe(() => {
      this.loadCart();
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('click', this.handleClickOutside.bind(this));
    }
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.handleClickOutside.bind(this));
    }
  }

  handleClickOutside(event: MouseEvent) {
    const cartPanel = document.querySelector('.cart-panel');
    const cartIcon = document.querySelector('.floating-cart');

    if (
      this.showCartPanel &&
      cartPanel &&
      cartIcon &&
      !cartPanel.contains(event.target as Node) &&
      !cartIcon.contains(event.target as Node)
    ) {
      this.showCartPanel = false;
    }
  }

  toggleCartPanel() {
    this.showCartPanel = !this.showCartPanel;
    if (this.showCartPanel && this.userId) {
      this.loadCart();
    }
  }

  loadCart() {
    if (!this.userId) return;

    this.cartService.getCartsByUserId(this.userId).subscribe({
      next: (carts) => {
        if (!carts || carts.length === 0) {
          this.cartItems = [];
          return;
        }

        const productRequests = carts.map(cartItem =>
          this.productService.getProductDetails(cartItem.product_id).pipe(
            map(product => ({
              cart_id: cartItem.cart_id,
              quantity: cartItem.quantity,
              product_id: product.product_id,
              price: product.price,
              product_name: product.product_name,
              PathAnh: this.productService.PhotosUrl + "/" + product.image_url
            } as CartDisplayItem))
          )
        );

        forkJoin(productRequests).subscribe({
          next: (results) => {
            this.cartItems = results;
          },
          error: (error) => {
            console.error('❌ Lỗi khi lấy sản phẩm:', error);
            this.cartItems = [];
          }
        });
      },
      error: (error) => {
        console.error('❌ Lỗi khi lấy giỏ hàng:', error);
        this.cartItems = [];
      }
    });
  }

  increaseQuantity(item: CartDisplayItem) {
    const updatedItem: CartItem = {
      cart_id: item.cart_id,
      user_id: this.userId!,
      product_id: item.product_id,
      quantity: item.quantity + 1
    };
    this.cartService.updateCart(item.cart_id, updatedItem).subscribe(() => this.loadCart());
  }

  decreaseQuantity(item: CartDisplayItem) {
    if (item.quantity > 1) {
      const updatedItem: CartItem = {
        cart_id: item.cart_id,
        user_id: this.userId!,
        product_id: item.product_id,
        quantity: item.quantity - 1
      };
      this.cartService.updateCart(item.cart_id, updatedItem).subscribe(() => this.loadCart());
    }
  }

  removeItem(item: CartDisplayItem) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.cartService.deleteCart(item.cart_id).subscribe(() => {
        this.loadCart();
      });
    }
  }

  goToCartDetail() {
    this.showCartPanel = false;
    this.router.navigate(['/home/product/carts']);
  }
}
