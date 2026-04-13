import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Product } from '../../../Models/product';
import { Brand } from '../../../Models/brand';
import { Categories } from '../../../Models/categories';
import { userService } from '../../../Service/userService';
import { ProductService } from '../../../Service/productService';
import { BrandService } from '../../../Service/brand-service';
import { categoryService } from '../../../Service/categoryService';
import { CartService } from '../../../Service/cart.service';

declare var bootstrap: any;

export interface GroupedProduct {
  category_id: number;
  category_name: string;
  products: Product[];
  brands: Brand[];
  visibleProducts: Product[];
  currentIndex: number;
  productsPerView: number;
}

@Component({
  selector: 'app-list-product',
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.css'],
})
export class ListProductComponent implements OnInit {
  productGroups: GroupedProduct[] = [];
  allBrands: Brand[] = [];
  selectedBrandId: string = '';
  selectedPriceRange: string = '';
  currentKeyword: string = '';
  user_id: number | null = null;
  dangThemSua = false;
  selectedItem: any = null;
  showSuccessMessage = false;
  isBanking = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  private allProducts: Product[] = [];
  private allCategories: Categories[] = [];

  constructor(
    private router: Router,
    public userService: userService,
    private route: ActivatedRoute,
    private productService: ProductService,
    private brandService: BrandService,
    private categoryService: categoryService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.user_id = currentUser.user_id;
    }

    this.route.queryParams.subscribe((params) => {
      this.currentKeyword = params['search'] || '';
      this.loadProducts();
    });

    this.updateProductsPerView();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateProductsPerView();
  }

  private getProductsPerView(): number {
    const w = this.getViewportWidth();
    if (w <= 768) return 4;
    if (w <= 1024) return 3;
    return 4;
  }

  updateProductsPerView() {
    const perView = this.getProductsPerView();

    this.productGroups.forEach((g) => {
      g.productsPerView = perView;
      g.currentIndex = 0;
      const startIdx = g.currentIndex * perView;
      g.visibleProducts = g.products.slice(startIdx, startIdx + perView);
    });
  }

  loadProducts() {
    const perView = this.getProductsPerView();

    forkJoin({
      products: this.productService.getProducts(),
      brands: this.brandService.getBrand(),
      categories: this.categoryService.getCategory(),
    }).subscribe({
      next: ({ products, brands, categories }) => {
        this.allProducts = (products || []).map((p: any) => this.normalizeProduct(p));
        this.allCategories = categories || [];
        this.allBrands = brands || [];
        this.buildProductGroups(perView);
      },
      error: () => {
        this.productGroups = [];
        this.allBrands = [];
      },
    });
  }

  private buildProductGroups(perView: number): void {
    this.productGroups = this.allCategories
      .map((cat) => {
        let products = this.allProducts.filter((p) => p.category_id === cat.category_id);
        const brands = this.allBrands.filter((b) => b.category_id === cat.category_id);

        if (this.currentKeyword.trim()) {
          const lk = this.currentKeyword.toLowerCase();
          products = products.filter((p) => p.product_name?.toLowerCase().includes(lk));
        }

        if (this.selectedBrandId) {
          products = products.filter((p) => String(p.brand_id) === this.selectedBrandId);
        }

        if (this.selectedPriceRange) {
          products = products.filter((p) => this.matchPriceRange(p.price));
        }

        return {
          category_id: cat.category_id,
          category_name: cat.category_name,
          products,
          brands,
          productsPerView: perView,
          currentIndex: 0,
          visibleProducts: products.slice(0, perView),
        };
      })
      .filter((g) => g.products.length > 0);
  }

  applyFilters() {
    const perView = this.getProductsPerView();
    this.buildProductGroups(perView);
    this.updateProductsPerView();
  }

  resetFilters() {
    this.selectedBrandId = '';
    this.selectedPriceRange = '';
    this.applyFilters();
  }

  private matchPriceRange(price: number): boolean {
    if (this.selectedPriceRange === 'under10') return price < 10000000;
    if (this.selectedPriceRange === '10to20') return price >= 10000000 && price <= 20000000;
    if (this.selectedPriceRange === 'above20') return price > 20000000;
    return true;
  }

  private getViewportWidth(): number {
    return isPlatformBrowser(this.platformId) ? window.innerWidth : 1280;
  }

  private resolveImage(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/default-product.png';
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

  navigateCarousel(group: GroupedProduct, dir: 'next' | 'prev') {
    const total = group.products.length;
    const pv = group.productsPerView;
    const maxIndex = Math.ceil(total / pv) - 1;

    if (dir === 'next') {
      group.currentIndex = group.currentIndex < maxIndex ? group.currentIndex + 1 : 0;
    } else {
      group.currentIndex = group.currentIndex > 0 ? group.currentIndex - 1 : maxIndex;
    }

    const startIdx = group.currentIndex * pv;
    let visible = group.products.slice(startIdx, startIdx + pv);

    if (visible.length < pv && startIdx + pv > total) {
      visible = visible.concat(group.products.slice(0, pv - visible.length));
    }
    group.visibleProducts = visible;
  }

  onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchEnd(event: TouchEvent, group: GroupedProduct): void {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    const threshold = 42;

    if (Math.abs(deltaX) > threshold && deltaY < 70) {
      this.navigateCarousel(group, deltaX < 0 ? 'next' : 'prev');
    }
  }

  addToCart(product: Product) {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      alert('Vui lòng đăng nhập!');
      this.router.navigate(['/home/login']);
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
    const user = this.userService.getCurrentUser();
    if (!user) {
      alert('Vui lòng đăng nhập để đặt hàng!');
      this.router.navigate(['/home/login']);
      return;
    }
    this.user_id = user.user_id;
    this.selectedItem = {
      product,
      quantity: 1,
      PathAnh: product.PathAnh || 'assets/images/default-image.jpg',
      price: product.price,
      total_amount: product.price,
    };
    this.dangThemSua = true;
    this.errorMessage = null;
  }

  muaNgay(form: any) {
    if (!form.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ!';
      return;
    }
    const v = form.value;
    this.isBanking = v.payment === 'Banking';

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
    this.showSuccessMessage = false;
    this.isBanking = false;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.errorMessage = null;
    this.closeModal();
  }

  closeModal() {
    const m = document.getElementById('exampleModal');
    const bm = bootstrap?.Modal?.getInstance(m);
    if (bm) bm.hide();
  }

  confirmTransfer() {
    this.closeModal();
    this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
  }
}
