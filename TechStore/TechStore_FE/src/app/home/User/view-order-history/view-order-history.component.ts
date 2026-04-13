  import { Component, OnInit } from '@angular/core';
  import { Router } from '@angular/router';
  import { forkJoin } from 'rxjs';
  import { Order } from '../../../Models/order';
  import { OrderDetails } from '../../../Models/order-details';
  import { Product } from '../../../Models/product';
  import { ChangeDetectorRef } from '@angular/core';
  import { userService } from '../../../Service/userService';
  import { OrderService } from '../../../Service/order-service';
  import { OrderDetailService } from '../../../Service/order-detail-service';
  import { ProductService } from '../../../Service/productService';

  interface OrderWithDetails {
    order: Order;
    details: {
      orderDetail: OrderDetails;
      product: Product;
    }[];
  }

  @Component({
    selector: 'app-view-order-history',
    templateUrl: './view-order-history.component.html',
    styleUrls: ['./view-order-history.component.css']
  })
  export class ViewOrderHistoryComponent implements OnInit {
    user_id!: number;
    user_name!: string;
    phone!: string;
    PhotosUrl: string = '';
    ordersWithDetails: OrderWithDetails[] = [];

    constructor(
      private userService: userService,
      private orderService: OrderService,
      private orderDetailService: OrderDetailService,
      public productService: ProductService,
      private cdr: ChangeDetectorRef,
      private router: Router
    ) {}

    ngOnInit(): void {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.PhotosUrl = this.productService.PhotosUrl;

      const current = this.userService.getCurrentUser();
      console.log('Current user:', current); 
      if (!current) {
        alert('Vui lòng đăng nhập!');
        this.router.navigate(['/home/login']);
        return;
      }

      this.user_id = current.user_id;
      this.user_name = current.username;
      this.phone = current.phone;

      this.loadOrders(this.user_id);
    }

    private loadOrders(userId: number): void {
    this.orderService.getOrderByCustomerId(userId).subscribe(orders => {
      const orderDetailRequests = orders.map(order =>
        this.orderDetailService.getOrderDetailByOrderId(order.order_id).toPromise()
          .then(details => {
            const productRequests = details.map(detail =>
              this.productService.getProductDetails(detail.product_id).toPromise()
                .then(product => ({
                  orderDetail: detail,
                  product: product
                }))
                .catch(err => {
                  console.warn(`Không tìm thấy sản phẩm cho product_id ${detail.product_id}:`, err);
                  return null;
                })
            );
            return Promise.all(productRequests).then(detailPairs => ({
              order: order,
              details: detailPairs.filter(pair => pair !== null)
            }));
          })
          .catch(err => {
            console.warn(`Không tìm thấy chi tiết đơn hàng cho order_id ${order.order_id}:`, err);
            return { order: order, details: [] };
          })
      );

      Promise.all(orderDetailRequests).then(results => {
        this.ordersWithDetails = [...results]; 
        this.cdr.detectChanges();
      });
    });
  }

    viewOrderDetails(orderId: number, customerId: number): void {
    console.log("orderId:", orderId, "customerId:", customerId);
    this.router.navigate(['/home/order/detailOrder', orderId, customerId]);
  }


  cancelOrder(orderId: number): void {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn này?')) return;

    const orderWithDetails = this.ordersWithDetails.find(o => o.order.order_id === orderId);
    if (!orderWithDetails) {
      alert('Không tìm thấy đơn hàng.');
      return;
    }

    const order = orderWithDetails.order;

     if (order.order_status === 'Chờ xác nhận') {
      alert('Vui lòng liên hệ Zalo số 0337431736 để được hỗ trợ hoàn tiền.');
      return;
    }

    if (order.order_status !== 'Đang xử lý' ) {
      alert(`Không thể hủy đơn vì đơn hàng đang ở trạng thái: "${order.order_status}".`);
      return;
    }

    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        alert('Đã hủy đơn thành công.');
        this.ordersWithDetails = this.ordersWithDetails.filter(o => o.order.order_id !== orderId);
      },
      error: (err) => {
        console.error('Lỗi khi xóa đơn hàng:', err);
        alert('Lỗi khi xóa đơn hàng.');
      }
    });
  }

    logout(): void {
      this.userService.logout().subscribe({
        next: () => {
          alert('Đăng xuất thành công!');
          this.router.navigate(['/home/login']);
        },
        error: (err) => {
          console.error('Lỗi khi đăng xuất:', err);
          alert('Đăng xuất thất bại!');
        }
      });
    }
  }
