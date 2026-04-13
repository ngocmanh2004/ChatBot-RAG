import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { userService } from '../../../Service/userService';
import { CartService } from '../../../Service/cart.service';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { ProductService } from '../../../Service/productService';

declare var bootstrap: any;

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'],
})
export class ShoppingCartComponent implements OnInit {
  cartItems: any[] = [];
  totalAmount: number = 0;
  user_id: number | null = null;
  selectedItems: any[] = [];
  dangThemSua: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  showSuccessMessage: boolean = false;
  errorMessage: string | null = null;
  isBanking: boolean = false;
  latestOrderId: number | null = null;

  constructor(
    private userService: userService,
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService,
    private productService: ProductService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const userIdString = this.userService.getUserId();
    this.user_id = userIdString ? +userIdString : null;
    if (!this.user_id) {
      this.errorMessage = 'Vui lòng đăng nhập!';
      this.router.navigate(['/home/login']);
      return;
    }
    this.loadCart();
  }

  private resolveImage(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/default-image.jpg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    return `${this.productService.PhotosUrl}/${imageUrl}`;
  }

  loadCart() {
    if (!this.user_id) return;

    this.cartService.getCartsByUserId(this.user_id).subscribe({
      next: (carts) => {
        this.cartItems = (carts || []).map((cartItem: any) => ({
          cart_id: cartItem.cart_id,
          product: {
            product_id: cartItem.product_id,
            product_name: cartItem.product_name,
            price: cartItem.price,
            image_url: cartItem.image_url,
          },
          quantity: cartItem.quantity,
          PathAnh: this.resolveImage(cartItem.image_url),
          product_id: cartItem.product_id,
          price: cartItem.price || 0,
          total_amount: (cartItem.price || 0) * cartItem.quantity,
          selected: false,
        }));

        if (this.cartItems.length === 0) {
          this.errorMessage = 'Giỏ hàng của bạn đang trống!';
        } else {
          this.errorMessage = null;
        }
        this.calculateTotal();
      },
      error: () => {
        this.cartItems = [];
        this.errorMessage = 'Không thể tải giỏ hàng!';
      },
    });
  }

  decreaseQuantity(index: number): void {
    const item = this.cartItems[index];
    if (item.quantity <= 1) return;

    item.quantity--;
    item.total_amount = item.price * item.quantity;
    this.calculateTotal();

    this.cartService
      .updateCart(item.cart_id, {
        cart_id: item.cart_id,
        user_id: this.user_id!,
        product_id: item.product_id,
        quantity: item.quantity,
      })
      .subscribe({
        error: () => {
          item.quantity++;
          item.total_amount = item.price * item.quantity;
          this.calculateTotal();
          alert('Không thể cập nhật số lượng!');
        },
      });
  }

  increaseQuantity(index: number): void {
    const item = this.cartItems[index];
    item.quantity++;
    item.total_amount = item.price * item.quantity;
    this.calculateTotal();

    this.cartService
      .updateCart(item.cart_id, {
        cart_id: item.cart_id,
        user_id: this.user_id!,
        product_id: item.product_id,
        quantity: item.quantity,
      })
      .subscribe({
        error: () => {
          item.quantity--;
          item.total_amount = item.price * item.quantity;
          this.calculateTotal();
          alert('Không thể cập nhật số lượng!');
        },
      });
  }

  calculateTotal(): void {
    this.selectedItems = this.cartItems.filter((item) => item.selected);
    this.totalAmount = this.selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  confirmDelete(index: number): void {
    const item = this.cartItems[index];
    if (!item || !confirm('Bạn có chắc chắn muốn xóa?')) return;

    this.cartService.deleteCart(item.cart_id).subscribe({
      next: () => {
        this.cartItems.splice(index, 1);
        this.calculateTotal();
        alert('Xóa sản phẩm thành công!');
      },
      error: () => {
        alert('Không thể xóa sản phẩm!');
      },
    });
  }

  toggleSelectAll(event: any): void {
    this.cartItems.forEach((item) => (item.selected = event.target.checked));
    this.calculateTotal();
  }

  themDon(): void {
    this.calculateTotal();
    if (this.selectedItems.length === 0) {
      this.errorMessage = 'Vui lòng chọn sản phẩm!';
      return;
    }
    this.dangThemSua = true;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.showSuccessMessage = false;
    this.errorMessage = null;
    this.isBanking = false;
  }

  muaNgay(paymentForm: any): void {
    if (!this.user_id) return;
    if (!paymentForm.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin!';
      return;
    }
    if (this.selectedItems.length === 0) {
      this.errorMessage = 'Vui lòng chọn sản phẩm!';
      return;
    }

    const formValue = paymentForm.value;
    this.isBanking = formValue.payment === 'Banking';
    const orderStatus = this.isBanking ? 'Chờ xác nhận' : 'Đang xử lý';

    const orderPayload = {
      user_id: this.user_id,
      full_name: formValue.fullname,
      order_status: orderStatus,
      total_amount: this.totalAmount,
      address: formValue.address,
      phone: formValue.phone,
      payment_method: formValue.payment,
    };

    this.showSuccessMessage = true;

    this.orderService.postOrder(orderPayload).subscribe({
      next: (orderResponse: any) => {
        const orderId = orderResponse?.order_id;
        this.latestOrderId = orderId ?? null;

        const detailRequests = this.selectedItems.map((item) =>
          this.orderDetailService.postOrderDetail({
            order_id: orderId,
            product_id: item.product_id,
            price: item.price,
            number_of_products: item.quantity,
            total_money: item.price * item.quantity,
            product_name: item.product?.product_name,
            image_path: item.product?.image_url,
          })
        );

        const detailsFlow = detailRequests.length ? forkJoin(detailRequests) : of([]);
        detailsFlow.subscribe({
          next: () => {
            const deleteRequests = this.selectedItems.map((item) => this.cartService.deleteCart(item.cart_id));
            const deleteFlow = deleteRequests.length ? forkJoin(deleteRequests) : of([]);

            deleteFlow.subscribe({
              next: () => {
                this.showSuccessMessage = false;

                if (this.isBanking) {
                  this.bankInfo =
                    'Ngân hàng: MBbank\nSố tài khoản: 0779421219\nChủ tài khoản: Nguyễn Ngọc Mạnh';
                  this.transferInstructions = `Vui lòng quét mã QR, nhập ${this.totalAmount.toLocaleString(
                    'vi-VN'
                  )} VNĐ, nội dung "DH${orderId}" trong 24h.`;
                } else {
                  alert('Đặt hàng COD thành công!');
                  this.closeModal();
                  this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
                }

                this.loadCart();
              },
              error: () => {
                this.showSuccessMessage = false;
                this.errorMessage = 'Đặt hàng thành công nhưng không thể xóa giỏ hàng tự động.';
                this.loadCart();
              },
            });
          },
          error: () => {
            this.showSuccessMessage = false;
            this.errorMessage = 'Không thể lưu chi tiết đơn hàng!';
          },
        });
      },
      error: () => {
        this.showSuccessMessage = false;
        this.errorMessage = 'Không thể tạo đơn hàng!';
      },
    });
  }

  dong(): void {
    this.dangThemSua = false;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.showSuccessMessage = false;
    this.errorMessage = null;
    this.isBanking = false;
    this.latestOrderId = null;
    this.closeModal();
  }

  onCheckboxChange(): void {
    this.calculateTotal();
  }

  closeModal(): void {
    const modal = document.getElementById('exampleModal');
    const bootstrapModal = bootstrap?.Modal?.getInstance(modal);
    if (bootstrapModal) {
      bootstrapModal.hide();
      setTimeout(() => this.loadCart(), 300);
    }
  }

  confirmTransfer(): void {
    this.closeModal();
    this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
  }
}
