import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../../../Models/product';
import { Brand } from '../../../Models/brand';
import { userService } from '../../../Service/userService';
import { ProductService } from '../../../Service/productService';
import { BrandService } from '../../../Service/brand-service';
import { categoryService } from '../../../Service/categoryService';
import { CartService } from '../../../Service/cart.service';

declare var bootstrap: any;

@Component({
  selector: 'app-filter-by-category',
  templateUrl: './filter-by-category.component.html',
  styleUrls: ['./filter-by-category.component.css'],
})
export class FilterByCategoryComponent implements OnInit, OnDestroy {
  DsSP: Product[] = [];
  paginatedProducts: Product[] = [];
  DsTH: Brand[] = [];
  categoryId: number | null = null;
  priceCategory: string = '';
  noProductsMessage: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  private routeSub: Subscription | undefined;
  user_id: number | null = null;
  dangThemSua: boolean = false;
  selectedItem: any = null;
  number_of_products: number = 1;
  showSuccessMessage: boolean = false;
  isBanking: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;
  categoryName: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public userService: userService,
    private productService: ProductService,
    private brandService: BrandService,
    private categoryService: categoryService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.user_id = currentUser.user_id;
    }

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const categoryIdParam = params.get('category_id');
      this.categoryId = categoryIdParam ? Number(categoryIdParam) : null;
      if (this.categoryId !== null && !isNaN(this.categoryId)) {
        this.getBrandsByCategory(this.categoryId);
        this.getCategoryName(this.categoryId);
        this.loadProductsByCurrentFilter();
      }
    });

    this.route.queryParams.subscribe((queryParams) => {
      this.priceCategory = queryParams['priceCategory'] || '';
      this.loadProductsByCurrentFilter();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private loadProductsByCurrentFilter(): void {
    if (this.categoryId === null) return;

    const request = this.priceCategory
      ? this.productService.getProductsByPriceCategory(this.categoryId, this.priceCategory)
      : this.productService.getByIdDM(this.categoryId);

    request.subscribe({
      next: (products: Product[]) => {
        this.DsSP = (products || []).map((p: any) => this.normalizeProduct(p));
        this.totalPages = Math.max(1, Math.ceil(this.DsSP.length / this.pageSize));
        this.currentPage = 1;
        this.updatePagination();
        this.noProductsMessage = this.DsSP.length === 0 ? 'Không có sản phẩm nào.' : '';
      },
      error: () => {
        this.DsSP = [];
        this.paginatedProducts = [];
        this.totalPages = 1;
        this.currentPage = 1;
        this.noProductsMessage = 'Không có sản phẩm nào phù hợp.';
      },
    });
  }

  getBrandsByCategory(id: number): void {
    this.brandService.getBrand_idDM(id).subscribe({
      next: (brands: Brand[]) => {
        this.DsTH = brands || [];
      },
      error: () => {
        this.DsTH = [];
      },
    });
  }

  getCategoryName(categoryId: number): void {
    this.categoryService.getCategoryDetails(categoryId).subscribe({
      next: (category: any) => {
        this.categoryName = category?.category_name || null;
      },
      error: () => {
        this.categoryName = null;
      },
    });
  }

  onFilterChange(event: any): void {
    const selectedPrice = event.target.value;
    if (this.categoryId !== null) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { priceCategory: selectedPrice || null },
        queryParamsHandling: 'merge',
      });
    }
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.DsSP.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  private resolveImage(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/default-image.jpg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    return `${this.productService.PhotosUrl}/${imageUrl}`;
  }

  private normalizeProduct(raw: any): Product {
    const product = raw as Product;
    product.PathAnh = this.resolveImage(product.image_url);
    return product;
  }

  addToCart(product: Product) {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'Vui lòng đăng nhập!';
      this.router.navigate(['/home/login']);
      return;
    }
    if (!product || !product.product_id) {
      return;
    }

    this.cartService
      .addToCart({
        user_id: currentUser.user_id,
        product_id: product.product_id,
        quantity: 1,
      })
      .subscribe({
        next: () => alert(`Da them "${product.product_name}" vao gio hang!`),
        error: () => alert('Khong the them vao gio hang. Vui long thu lai!'),
      });
  }

  themDon(product: Product) {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'Vui lòng đăng nhập để đặt hàng!';
      this.router.navigate(['/home/login']);
      return;
    }
    this.user_id = currentUser.user_id;
    this.selectedItem = {
      product: product,
      quantity: this.number_of_products,
      PathAnh: product.PathAnh || 'assets/images/default-image.jpg',
      price: product.price,
      total_amount: product.price * this.number_of_products,
    };
    this.dangThemSua = true;
    this.errorMessage = null;
  }

  muaNgay(paymentForm: any) {
    if (!paymentForm.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ!';
      return;
    }
    const formValue = paymentForm.value;
    this.isBanking = formValue.payment === 'Banking';

    this.showSuccessMessage = true;
    setTimeout(() => {
      if (this.isBanking) {
        this.bankInfo = 'Ngân hàng: MBbank\nSố tài khoản: 0779421219\nChủ TK: Nguyễn Ngọc Mạnh';
        this.transferInstructions = `Quét QR, chuyển ${this.selectedItem.total_amount.toLocaleString('vi-VN')} VNĐ, nội dung "DH123" trong 24h.`;
        this.showSuccessMessage = false;
      } else {
        alert('Dat hang COD thanh cong!');
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
    this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
  }
}
