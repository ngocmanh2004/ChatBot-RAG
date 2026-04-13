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
import { CartService } from '../../../Service/cart.service';

declare var bootstrap: any;

@Component({
  selector: 'app-filter-by-brand',
  templateUrl: './filter-by-brand.component.html',
  styleUrls: ['./filter-by-brand.component.css'],
})
export class FilterByBrandComponent implements OnInit, OnDestroy {
  DsSP: Product[] = [];
  private routeSub: Subscription | undefined;
  user_id: number | null = null;
  dangThemSua: boolean = false;
  selectedItem: any = null;
  number_of_products: number = 1;
  categoryId: number | null = null;
  brandId: number | null = null;
  DsTH: Brand[] = [];
  priceCategory: string = '';
  showSuccessMessage: boolean = false;
  isBanking: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;
  brandName: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public userService: userService,
    private productService: ProductService,
    private brandService: BrandService,
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
      this.categoryId = Number(params.get('category_id'));
      this.brandId = Number(params.get('brand_id'));
      if (this.categoryId && this.brandId) {
        this.getBrandsByCategory(this.categoryId);
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
    if (!this.categoryId || !this.brandId) return;

    const request = this.priceCategory
      ? this.productService.getProductsByCategoryBrandAndPrice(this.categoryId, this.brandId, this.priceCategory)
      : this.productService.getProductsByCategoryAndBrand(this.categoryId, this.brandId);

    request.subscribe({
      next: (products: Product[]) => {
        this.DsSP = (products || []).map((p: any) => this.normalizeProduct(p));
      },
      error: () => {
        this.DsSP = [];
      },
    });
  }

  getBrandsByCategory(categoryId: number) {
    this.brandService.getBrand_idDM(categoryId).subscribe({
      next: (brands: Brand[]) => {
        this.DsTH = brands || [];
        const selectedBrand = this.DsTH.find((b) => b.brand_id === this.brandId);
        this.brandName = selectedBrand ? selectedBrand.brand_name : null;
      },
      error: () => {
        this.DsTH = [];
        this.brandName = null;
      },
    });
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

  onFilterChange(event: any): void {
    const selectedPrice = event.target.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { priceCategory: selectedPrice || null },
      queryParamsHandling: 'merge',
    });
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
