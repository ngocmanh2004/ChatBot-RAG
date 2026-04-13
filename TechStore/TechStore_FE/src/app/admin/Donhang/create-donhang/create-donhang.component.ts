import { Component, Input } from '@angular/core';
import { OrderService } from '../../../Service/order-service';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';
import { Order } from '../../../Models/order';
import { ProductService } from '../../../Service/productService';
import { Product } from '../../../Models/product';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { User } from '../../../Models/users';


@Component({
  selector: 'app-create-donhang',
  templateUrl: './create-donhang.component.html',
  styleUrl: './create-donhang.component.css'
})
export class CreateDonhangComponent {
  @Input() DsProduct: Product[] = [];
  @Input() Product: Product;
  @Input() donhang: Order;

  product_id: number;
  id_customer: number;
  customer_phone: string;
  customer_address: string;
  PathAnh: string;
  dangThemSua: boolean = false;
  product: Product;

  selectedProducts: { product: Product; quantity: number }[] = [];

  order_id: number;
  customer_id: number;
  order_status: string = "Đang xử lý";
  create_at: Date;
  total_amount: number;
  order: Order;
  price: number;
  number_of_products: number = 1;
  total_money: number;
  user: User;
  user_id: number;
  customer_name: string;

  constructor(private orderService: OrderService, private router: Router,
    private userService: userService,
    private productService: ProductService,
    private orderDetailService: OrderDetailService,
    private _userService: userService) { }


  ngOnInit(): void {
    this.layDSProduct();
    this.layDetailsSP(this.product_id);
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.user_id = currentUser.user_id;
      this.customer_name = currentUser.username;
    } else {
      console.log('Không có người dùng đăng nhập');
    }
  }

  layDSProduct() {
    this.productService.getProducts().subscribe(data => {
      this.DsProduct = data.map((product) => ({ ...product, selected: false, quantity: 0 }));
    });
  }

  layDetailsSP(id: number): void {
    if (!id) return;
    this.productService.getProductDetails(id).subscribe({
      next: (data) => {
        this.product = data;
        this.price = data.price;
        this.total_amount = this.price;
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
      }
    });
  }

  addProductToOrder() {
    this.total_money = this.price * this.number_of_products;

    const orderData = {
      customer_id: this.user_id,
      order_status: this.order_status,
      create_at: new Date(),
      total_amount: this.total_money,
    };

    console.log(orderData);
    this.orderService.postOrder(orderData).subscribe({
      next: (order: Order) => {
        const createdOrderId = order.order_id;
        console.log('Order created with ID:', createdOrderId);
        const orderDetailData = {
          order_id: createdOrderId,
          product_id: this.product_id,
          price: this.price,
          number_of_products: this.number_of_products,
          total_money: this.total_money,
        };

        console.log('order_id', this.order_id, createdOrderId);
        this.orderDetailService.postOrderDetail(orderDetailData).subscribe({
          next: () => {
            alert('Thêm đơn hàng và chi tiết đơn hàng thành công.');
            console.log('Dữ liệu gửi đến API:', orderDetailData);
          },
          error: (err) => {
            alert('Lỗi khi tạo chi tiết đơn hàng. ');
          },
        });
      },
      error: (err) => {
        alert('Lỗi khi tạo đơn hàng.');
      },
    });
  }

  dong() {
    this.dangThemSua = false;
  }

  themDon() {
    this.order = {
      order_id: 0,
      user_id: this.user_id,
      order_status: 'Đang xử lý',
      create_at: new Date(),
      total_amount: 0,
      address: '',
      phone: '',
      payment_method: ''
    };


    this.dangThemSua = true;
  }

}
