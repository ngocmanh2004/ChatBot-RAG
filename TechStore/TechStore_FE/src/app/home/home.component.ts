import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ProductService } from '../Service/productService';
import { ActivatedRoute } from '@angular/router';
import { categoryService } from '../Service/categoryService';
import { Product } from '../Models/product';
import { Categories } from '../Models/categories';
import { userService } from '../Service/userService';
import { isPlatformBrowser } from '@angular/common';
import { filter, Subscription } from 'rxjs';

declare var bootstrap: any;

interface HeroSlide {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  oldPrice: string;
  saving: string;
  primaryLink: string;
  secondaryLink: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  searchText: string = '';
  products: Product[] = [];
  DsDM: Categories[] = [];
  user_id: number | undefined;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  showMap: boolean = false;
  storeAddress: string = '138 Cần Vương, Nguyễn Văn Cừ, Quy Nhơn, Bình Định';

  heroSlides: HeroSlide[] = [
    {
      image: 'https://image.dienthoaivui.com.vn/x,webp,q90/https://dashboard.dienthoaivui.com.vn/uploads/dashboard/editor_upload/hinh-anh-iphone-17-pro-max-01.jpg',
      badge: 'Ưu đãi đặc biệt',
      title: 'iPhone 17 Pro Max',
      subtitle: 'Titanium thế hệ mới. Mạnh mẽ hơn.',
      description: 'Thiết kế cao cấp, camera nâng cấp và hiệu năng flagship cho trải nghiệm đỉnh cao.',
      price: '33.990.000đ',
      oldPrice: '37.990.000đ',
      saving: 'Tiết kiệm 4.0M',
      primaryLink: '/home/list',
      secondaryLink: '/home/list',
    },
    {
      image: 'https://i.ytimg.com/vi/Cdsz6SSiGcA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBZdq8Z0NNLorw9vSf8E2N7MD2yzQ',
      badge: 'Hiệu năng mạnh',
      title: 'M3 Max MacBook Pro',
      subtitle: 'Sức mạnh cho sáng tạo chuyên nghiệp',
      description: 'Màn hình chất lượng cao, pin bền bỉ và hiệu năng M3 Max cho các tác vụ nặng.',
      price: '69.990.000đ',
      oldPrice: '74.990.000đ',
      saving: 'Tiết kiệm 5.0M',
      primaryLink: '/home/list',
      secondaryLink: '/home/list',
    },
    {
      image: 'https://cellphones.com.vn/sforum/wp-content/uploads/2021/08/apple-watch-series-7-2.jpg',
      badge: 'Hot deal đồng hồ',
      title: 'Apple Watch Series 7',
      subtitle: 'Theo dõi sức khỏe, kết nối thông minh',
      description: 'Thiết kế hiện đại, màn hình lớn và nhiều tính năng tiện ích cho cuộc sống mỗi ngày.',
      price: '8.990.000đ',
      oldPrice: '10.490.000đ',
      saving: 'Tiết kiệm 1.5M',
      primaryLink: '/home/list',
      secondaryLink: '/home/list',
    },
  ];

  currentSlide = 0;
  intervalId: any;
  isMobileMenuOpen = false;
  isLandingRoute = true;
  private routeSubscription?: Subscription;

  constructor(
    private router: Router,
    private productService: ProductService,
    private route: ActivatedRoute,
    private categoryService: categoryService,
    public userService: userService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  get currentHero(): HeroSlide {
    return this.heroSlides[this.currentSlide] || this.heroSlides[0];
  }

  ngOnInit(): void {
    this.DsDanhMucSp();
    this.syncLandingRoute();

    if (isPlatformBrowser(this.platformId)) {
      this.startAutoSlide();
    }

    this.routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isMobileMenuOpen = false;
        this.syncLandingRoute();
      });

    this.userService.authenticated$.subscribe((status) => {
      this.isLoggedIn = status;
      this.checkIfAdmin();
    });

    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('userId');
      if (storedUser) {
        this.userService.setAuthenticated(true);
        this.checkIfAdmin();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.routeSubscription?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  private syncLandingRoute(): void {
    const currentUrl = this.router.url;
    this.isLandingRoute =
      currentUrl.includes('/home/list') ||
      currentUrl === '/home' ||
      currentUrl === '/home/';
  }

  startAutoSlide(): void {
    if (!this.heroSlides.length) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 4500);
  }

  nextSlide(): void {
    if (!this.heroSlides.length) {
      return;
    }
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
  }

  prevSlide(): void {
    if (!this.heroSlides.length) {
      return;
    }
    this.currentSlide =
      (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  DsDanhMucSp() {
    this.categoryService.getCategory().subscribe({
      next: (data: Categories[]) => {
        this.DsDM = data ?? [];
      },
      error: () => {
        this.DsDM = [];
      },
    });
  }

  logout() {
    this.userService.logout().subscribe(() => {
      this.router.navigate(['/home']);
    });
  }

  timkiem() {
    if (this.searchText.trim()) {
      this.router.navigate(['/home/product/search'], {
        queryParams: { search: this.searchText },
      });
    } else {
      alert('Vui lòng nhập từ khóa tìm kiếm!');
    }
  }

  checkIfAdmin() {
    const currentUser = this.userService.getCurrentUser();
    this.isAdmin = currentUser?.role_id === 1;
  }

  openMapModal() {
    this.showMap = true;
    const modal = document.getElementById('mapModal');
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  closeMapModal() {
    this.showMap = false;
    const modal = document.getElementById('mapModal');
    const bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (bootstrapModal) {
      bootstrapModal.hide();
    }
  }

  getCategoryIcon(categoryName: string): string {
    const n = (categoryName ?? '').toLowerCase();
    if (n.includes('laptop') || n.includes('xách tay')) return 'fa fa-laptop';
    if (n.includes('điện thoại') || n.includes('di động') || n.includes('phone')) return 'fa fa-mobile-alt';
    if (n.includes('tablet') || n.includes('bảng') || n.includes('ipad')) return 'fa fa-tablet-alt';
    if (n.includes('tai nghe') || n.includes('headphone')) return 'fa fa-headphones';
    if (n.includes('màn hình') || n.includes('monitor')) return 'fa fa-desktop';
    if (n.includes('máy tính') || n.includes('desktop') || n.includes('pc')) return 'fa fa-desktop';
    if (n.includes('camera') || n.includes('máy ảnh')) return 'fa fa-camera';
    if (n.includes('phụ kiện') || n.includes('accessory')) return 'fa fa-plug';
    if (n.includes('đồng hồ') || n.includes('watch')) return 'fa fa-clock';
    if (n.includes('loa') || n.includes('speaker')) return 'fa fa-volume-up';
    return 'fa fa-microchip';
  }
}
