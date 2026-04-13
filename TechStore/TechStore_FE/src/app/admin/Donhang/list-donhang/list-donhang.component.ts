import { Component, OnInit, Input } from '@angular/core';
import { OrderService } from '../../../Service/order-service';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';
import { Order } from '../../../Models/order';
import { User } from '../../../Models/users';
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { forkJoin } from 'rxjs';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-list-donhang',
  templateUrl: './list-donhang.component.html',
  styleUrls: ['./list-donhang.component.css']
})
export class ListDonhangComponent implements OnInit {
  @Input() DsProduct: Product[] = [];
  product_id: number;
  dangThemSua: boolean = false;
  product: Product;
  order: Order;
  price: number;
  number_of_products: number = 1;
  total_money: number;
  user: User;
  status: string = "Đang xử lý";
  orderStatuses: { [key: string]: string[] } = {
    'Chờ xác nhận': ['Đã xác nhận', 'Đang vận chuyển', 'Đã hủy', 'Vấn đề trong xử lý'],
    'Đang xử lý': ['Đã xác nhận', 'Đang vận chuyển', 'Đã hủy', 'Vấn đề trong xử lý'],
    'Đã xác nhận': ['Đang vận chuyển', 'Đã hủy', 'Vấn đề trong xử lý'],
    'Đang vận chuyển': ['Đã giao', 'Vấn đề trong xử lý'],
    'Đã giao': ['Trả hàng'],
    'Trả hàng': ['Đã hoàn tiền'],
    'Đã hoàn tiền': [],
    'Đã hủy': [],
    'Vấn đề trong xử lý': []
  };

  constructor(
    private orderService: OrderService,
    private router: Router,
    private UserService: userService,
    public productService: ProductService,
    private orderDetailService: OrderDetailService
  ) { }

  DSDonHang: any[] = [];
  DSUser: any[] = [];
  order_id: number;
  order_status: string;
  create_at: Date;
  total_amount: number;
  customer_id: number;
  user_id: number;
  username: string;
  donhang: Order;
  selected: any = null;
  customer_name: string;
  orderSearch: any[] = [];
  searchText: string = '';
  DSChiTietDonHang: any[] = [];
  address: string;
  phone: string;
  payment_method: string;
  currentOrder: any = null;
  selectedStatus: string;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.tailaiDSDonhang();
    this.layDSProduct();
    this.layDetailsSP(this.product_id);
    this.layDSUser();
  }

  resetForm(): void {
    this.user_id = null!;
    this.product_id = null!;
    this.address = '';
    this.phone = '';
    this.payment_method = '';
    this.price = 0;
    this.total_amount = 0;
  }

  tailaiDSDonhang() {
    this.orderService.getOrders().subscribe(data => {
      this.DSDonHang = data.map(order => ({
        ...order,
        selectedStatus: order.order_status
      }));
      this.DSDonHang.forEach(donhang => {
        donhang.create_at = this.formatDate(donhang.create_at);
      });
    });
  }

  xemChiTietDon(orderId: number) {
    const donhang = this.DSDonHang.find(o => o.order_id === orderId);
    if (donhang) {
      this.currentOrder = donhang;
    }

    this.DSChiTietDonHang = [];

    this.orderDetailService.getOrderDetailByOrderId(orderId).subscribe(details => {
      details.forEach((detail: any) => {
        this.productService.getProductDetails(detail.product_id).subscribe(product => {
          detail.product = product;
          this.DSChiTietDonHang.push(detail);
        });
      });
    });
  }

  xoaDsDonhang(donhang: Order) {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng với mã ${donhang.order_id}?`);
    if (confirmDelete) {
      this.orderService.deleteOrder(donhang.order_id).subscribe({
        next: () => {
          this.tailaiDSDonhang();
          if (this.orderSearch && this.orderSearch.length > 0) {
            this.orderSearch = this.orderSearch.filter(order => order.order_id !== donhang.order_id);
          }
        }
      });
    }
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  editDonhang(donhang) {
    this.selected = donhang;
    this.customer_id = donhang.customer_id || donhang.user_id;
    this.customer_name = donhang.full_name;
    this.order_status = donhang.order_status;
    this.create_at = donhang.create_at;
    this.total_amount = donhang.total_amount;
    this.address = donhang.address;
    this.phone = donhang.phone;
    this.payment_method = donhang.payment_method;
    this.dangThemSua = true;
  }

  suaDonHang() {
    if (!this.selected?.order_id) return;

    const body = {
      order_id: this.selected.order_id,
      user_id: this.customer_id,
      full_name: this.customer_name,
      order_status: this.order_status,
      create_at: this.formatDate(this.create_at),
      total_amount: this.total_amount,
      address: this.address,
      phone: this.phone,
      payment_method: this.payment_method
    };

    this.orderService.updateDonhang(this.selected.order_id, body).subscribe({
      next: () => {
        alert('Sửa đơn hàng thành công!');
        this.tailaiDSDonhang();
        this.dangThemSua = false;
      },
      error: err => {
        console.error('Lỗi khi sửa đơn hàng:', err);
        alert(`Lỗi: ${err.message}`);
      }
    });
  }

  viewOrderDetails(Id: number): void {
    this.router.navigate(['home/order/detailOrder/', Id]);
  }

  timkiem() {
    const keyword = this.searchText.trim();

    if (keyword.length === 0) {
      this.orderSearch = [];
      return;
    }

    this.orderService.timkiem(keyword).subscribe({
      next: (orders) => {
        if (orders.length === 0) {
          alert('Không tìm thấy đơn hàng nào phù hợp.');
          this.orderSearch = [];
          return;
        }
        this.orderSearch = orders.map(order => ({
          ...order,
          selectedStatus: order.order_status
        }));
        this.orderSearch.forEach(order => {
          if (!order.full_name && order.customer_id) {
            this.UserService.getUserById(order.customer_id).subscribe(user => {
              order.full_name = user.username;
            });
          }
          order.create_at = this.formatDate(order.create_at);
        });
      },
      error: (err) => {
        if (err.status === 404) {
          this.orderSearch = [];
          alert('Không tìm thấy đơn hàng phù hợp.');
        } else {
          console.error('Lỗi tìm kiếm đơn hàng:', err);
          alert('Lỗi khi tìm kiếm, vui lòng thử lại sau.');
        }
      }
    });
  }

  layDSProduct() {
    this.productService.getProducts().subscribe(data => {
      this.DsProduct = data.map((product) => ({ ...product, selected: false, quantity: 0 }));
    });
  }

  layDSUser() {
    this.UserService.getUsers().subscribe(data => {
      this.DSUser = data;
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

  addProductToOrder(form: NgForm): void {
    if (form.invalid) { return; }

    const selectedProduct = this.DsProduct.find(p => p.product_id == this.product_id);
    if (!selectedProduct) {
      alert('Chưa chọn sản phẩm hợp lệ');
      return;
    }

    const newOrder: Order = {
      user_id: this.user_id,
      address: this.address,
      phone: this.phone,
      payment_method: this.payment_method,
      total_amount: selectedProduct.price,
      order_status: 'Đang xử lý',
    };

    this.isLoading = true;
    this.orderService.postOrder(newOrder).subscribe({
      next: res => {
        const orderId = res.order_id;

        const orderDetail = {
          order_id: orderId,
          product_id: this.product_id,
          price: selectedProduct.price,
          number_of_products: 1,
          total_money: selectedProduct.price,
          imagePath: selectedProduct.image_url,
          product_name: selectedProduct.product_name,
          quantity: 1
        };

        this.orderDetailService.postOrderDetail(orderDetail).subscribe({
          next: () => {
            alert('Thêm đơn hàng thành công!');
            this.tailaiDSDonhang();
            (document.getElementById('exampleModal') as any)?.click();
            this.isLoading = false;
          },
          error: err => {
            console.error(err);
            alert('Lỗi khi thêm chi tiết đơn hàng!');
            this.isLoading = false;
          }
        });
      },
      error: err => {
        console.error(err);
        alert(err.error?.message || 'Lỗi khi thêm đơn hàng!');
        this.isLoading = false;
      }
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

  updateOrderStatus(orderId: number, newStatus: string): void {
    console.log(`Updating order: ID = ${orderId}, New Status = ${newStatus}`);

    const order = this.DSDonHang.find(o => o.order_id === orderId);
    if (!order) {
      alert('Không tìm thấy đơn hàng!');
      console.error(`Order ID ${orderId} not found in DSDonHang`);
      return;
    }
    const validNextStatuses = this.orderStatuses[order.order_status] || [];
    console.log('Valid next statuses:', validNextStatuses);
    if (!validNextStatuses.includes(newStatus)) {
      alert(`Trạng thái '${newStatus}' không hợp lệ cho đơn hàng hiện tại ở trạng thái '${order.order_status}'!`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng ${orderId} thành '${newStatus}'?`)) {
      return;
    }

    this.isLoading = true;
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.isLoading = false;
        alert(`Cập nhật trạng thái đơn hàng thành công sang '${newStatus}'.`);
        this.tailaiDSDonhang();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Update status error:', err);
        alert(`Lỗi cập nhật trạng thái: ${err.message || 'Vui lòng thử lại!'}`);
      }
    });
  }
}