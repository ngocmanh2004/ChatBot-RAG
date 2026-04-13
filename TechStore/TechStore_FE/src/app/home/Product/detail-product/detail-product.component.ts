import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../Service/productService';
import { ReviewService } from '../../../Service/review-service';
import { userService } from '../../../Service/userService';
import { CartService } from '../../../Service/cart.service';
import { Product } from '../../../Models/product';
import { Reviews } from '../../../Models/reviews';
import { NgForm } from '@angular/forms';
import { Location, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

declare var bootstrap: any;

@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.component.html',
  styleUrls: ['./detail-product.component.css'],
})
export class DetailProductComponent implements OnInit {
  product!: Product;
  reviews: Reviews[] = [];
  newReview: string = '';
  rating: number = 0;
  contenReview: string = '';
  ratingReview: number = 0;
  selectedReview: Reviews | null = null;
  product_id!: number;
  currentUserId: number | null = null;
  isAdmin: boolean = false;
  dangThemSua: boolean = false;
  selectedItem: any = null;
  number_of_products: number = 1;
  showSuccessMessage: boolean = false;
  isBanking: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;
  /** The currently displayed image in the gallery main view */
  selectedImage: string = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    public userService: userService,
    private cartService: CartService,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('product_id'));
      this.product_id = id;
      this.loadProduct(id);
      this.loadReviews(id);
    });

    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.user_id;
      this.isAdmin = currentUser.role_id === 1;
    }

    this.userService.getCurrentUserObservable().subscribe((user) => {
      if (user) {
        this.currentUserId = user.user_id;
        this.isAdmin = user.role_id === 1;
      } else {
        this.currentUserId = null;
        this.isAdmin = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }

  formatSpec(value: string | number | null | undefined, suffix: string = ''): string {
    if (value === null || value === undefined || value === '') return 'Đang cập nhật';
    return `${value}${suffix}`;
  }

  getDisplayScreenSpec(): string {
    if (!this.product) return 'Đang cập nhật';
    const size = this.product.screen_size_inch ? `${this.product.screen_size_inch} inch` : null;
    const resolution = this.product.screen_resolution || null;
    const refresh = this.product.refresh_rate_hz ? `${this.product.refresh_rate_hz}Hz` : null;
    const parts = [size, resolution, refresh].filter(Boolean);
    return parts.length ? parts.join(' - ') : 'Đang cập nhật';
  }

  getStockStatus(): string {
    if (!this.product) return '';
    return this.product.quantity > 0 ? 'Còn hàng' : 'Hết hàng';
  }

  private resolveImage(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/default-image.jpg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    return `${this.productService.PhotosUrl}/${imageUrl}`;
  }

  loadProduct(id: number) {
    this.productService.getProductDetails(id).subscribe({
      next: (data: Product) => {
        this.product = data;
        this.product.PathAnh = this.resolveImage(data.image_url);
        this.selectedImage = this.product.PathAnh; // initialize gallery main
      },
      error: () => {
        alert('Không tìm thấy sản phẩm.');
        this.router.navigate(['/home/list']);
      },
    });
  }

  loadReviews(productId: number) {
    this.reviewService.getReviewsByProduct(productId).subscribe({
      next: (data: Reviews[]) => {
        this.reviews = data || [];
      },
      error: () => {
        this.reviews = [];
      },
    });
  }

  submitReview() {
    if (!this.newReview.trim() || this.rating === 0) {
      alert('Vui lòng nhập nội dung và chọn số sao.');
      return;
    }

    if (!this.currentUserId) {
      alert('Vui lòng đăng nhập để đánh giá.');
      this.router.navigate(['/home/login']);
      return;
    }

    this.reviewService
      .addReview({
        product_id: this.product_id,
        user_id: this.currentUserId,
        content: this.newReview,
        rating: this.rating,
      })
      .subscribe({
        next: () => {
          this.newReview = '';
          this.rating = 0;
          this.loadReviews(this.product_id);
        },
        error: () => {
          alert('Gửi đánh giá thất bại. Vui lòng thử lại!');
        },
      });
  }

  editReview(review: Reviews) {
    this.selectedReview = review;
    this.contenReview = review.content;
    this.ratingReview = review.rating;
  }

  suaReview() {
    if (!this.selectedReview) {
      alert('Không có đánh giá để sửa.');
      return;
    }

    this.reviewService
      .updateReview(this.selectedReview.id, {
        id: this.selectedReview.id,
        product_id: this.selectedReview.product_id,
        user_id: this.selectedReview.user_id,
        content: this.contenReview,
        rating: this.ratingReview,
      })
      .subscribe({
        next: () => {
          this.loadReviews(this.product_id);
          this.selectedReview = null;
          this.contenReview = '';
          this.ratingReview = 0;
        },
        error: () => {
          alert('Cập nhật đánh giá thất bại.');
        },
      });
  }

  deleteReview(reviewId: number) {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => this.loadReviews(this.product_id),
      error: () => alert('Xóa đánh giá thất bại!'),
    });
  }

  addToCart() {
    if (!this.currentUserId) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng.');
      this.router.navigate(['/home/login']);
      return;
    }

    if (!this.product?.product_id) {
      alert('Không tìm thấy sản phẩm.');
      return;
    }

    this.cartService
      .addToCart({
        user_id: this.currentUserId,
        product_id: this.product.product_id,
        quantity: 1,
      })
      .subscribe({
        next: () => alert('Da them vao gio hang!'),
        error: () => alert('Khong the them vao gio hang. Vui long thu lai!'),
      });
  }

  themDon() {
    if (!this.currentUserId) {
      alert('Vui lòng đăng nhập để tiếp tục đặt hàng.');
      this.router.navigate(['/home/login']);
      return;
    }

    if (!this.product) {
      alert('Sản phẩm không tồn tại.');
      return;
    }

    this.selectedItem = {
      product: this.product,
      quantity: this.number_of_products,
      PathAnh: this.product.PathAnh,
      price: this.product.price,
      total_amount: this.product.price * this.number_of_products,
    };
    this.dangThemSua = true;
  }

  muaNgay(paymentForm: NgForm) {
    if (!paymentForm.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ!';
      return;
    }

    const formValue = paymentForm.value;
    this.isBanking = formValue.payment === 'Banking';

    this.showSuccessMessage = true;
    setTimeout(() => {
      if (this.isBanking) {
        this.bankInfo =
          'Ngân hàng: VCB\nSố tài khoản: 1028750976\nChủ tài khoản: Nguyễn Ngọc Mạnh';
        this.transferInstructions = `Vui lòng quét mã QR, nhập ${this.selectedItem.total_amount.toLocaleString(
          'vi-VN'
        )} VNĐ, nội dung "DH123" trong 24h.`;
        this.showSuccessMessage = false;
      } else {
        alert('Đặt hàng COD thành công!');
        this.closeModal();
      }
    }, 2000);
  }

  dong() {
    this.dangThemSua = false;
    this.selectedItem = null;
    this.number_of_products = 1;
    this.showSuccessMessage = false;
    this.isBanking = false;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.errorMessage = null;
    this.closeModal();
  }

  closeModal() {
    const modal = document.getElementById('exampleModal');
    const bootstrapModal = bootstrap?.Modal?.getInstance(modal);
    if (bootstrapModal) bootstrapModal.hide();
  }

  confirmTransfer() {
    this.closeModal();
    this.router.navigate([`/home/user/viewOH/${this.currentUserId}`]);
  }
}
