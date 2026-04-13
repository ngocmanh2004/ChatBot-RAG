import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { OrderDetails } from '../../../Models/order-details';
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { userService } from '../../../Service/userService';
import { OrderService } from '../../../Service/order-service';
import { Order } from '../../../Models/order';

@Component({
  selector: 'app-detail-order',
  templateUrl: './detail-order.component.html',
  styleUrls: ['./detail-order.component.css']
})
export class DetailOrderComponent {
  customer_name: string = '';
  customer_phone: string = '';
  customer_address: string = '';
  order_status: string = '';
  id_customer: number | null = null;
  orderDetails: OrderDetails;
  order: Order;
  orderDetailsList: OrderDetails[] = [];
  products: Product[] = [];

  constructor(
    private order_detailService: OrderDetailService,
    public productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private _userService: userService
  ) { }

  ngOnInit() {
    const orderId = Number(this.route.snapshot.paramMap.get('id_order'));
    const customerId = Number(this.route.snapshot.paramMap.get('id_customer'));

    if (!isNaN(orderId)) {
      this.id_customer = customerId;
      this.loadOrderDetails(orderId);
      this.loadUser(this.id_customer);
    } else {
      console.error("Lỗi! ID đơn hàng không hợp lệ.");
    }
  }


  loadOrderDetails(orderId: number): void {
    this.order_detailService.getOrderDetailByOrderId(orderId).subscribe({
      next: (details) => {
        this.orderDetailsList = details;
        this.loadOrder(orderId);
        this.products = [];
        details.forEach(detail => {
          this.productService.getProductDetails(detail.product_id).subscribe({
            next: (product) => this.products.push(product),
            error: (err) => console.error('Lỗi khi lấy sản phẩm:', err)
          });
        });
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
      }
    });
  }

  loadOrder(id: number): void {
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.order_status = order.order_status;
      },
      error: (err) => console.error(`Lỗi khi lấy đơn hàng ID ${id}:`, err)
    });
  }


  loadUser(id: number): void {
    if (id == null) return;

    this._userService.getUserById(id).subscribe({
      next: (user) => {
        this.customer_name = user.username;
        this.customer_address = user.address;
        this.customer_phone = user.phone;
      },
      error: (err) => console.error(`Lỗi khi lấy người dùng ID ${id}:`, err)
    });
  }

  huyOrderDetail(): void {
    if (!this.order) {
      alert("Không tìm thấy thông tin đơn hàng để hủy.");
      return;
    }

    if (this.order.order_status === 'Chờ xác nhận') {
      alert('Vui lòng liên hệ Zalo số 0337431736 để được hỗ trợ hoàn tiền');
      return;
    }

    if (this.order.order_status !== 'Đang xử lý') {
      alert(`Không thể hủy đơn vì đơn hàng đang ở trạng thái: "${this.order.order_status}".`);
      return;
    }


    const confirmCancel = confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!confirmCancel) return;

    this.orderService.deleteOrder(this.order.order_id).subscribe({
      next: () => {
        alert('Đơn hàng đã được hủy thành công.');
        if (this.id_customer != null) {
          this.router.navigate(['home/user/viewOH', this.id_customer]);
        }
      },
      error: (err) => {
        console.error('Lỗi khi hủy đơn hàng:', err);
        alert('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
      }
    });
  }
  get totalMoney(): number {
    return this.orderDetailsList.reduce((sum, detail) => sum + detail.total_money, 0);
  }

  goBackToOrderList(): void {
    console.log("Đã bấm nút quay lại, id_customer =", this.id_customer);
    if (this.id_customer != null) {
      this.router.navigate(['home/user/viewOH', this.id_customer]);
    } else {
      alert('Không tìm thấy ID khách hàng để quay lại.');
    }
  }
}
