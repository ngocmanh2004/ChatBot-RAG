import { Component } from '@angular/core';
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { BrandService } from '../../../Service/brand-service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { categoryService } from '../../../Service/categoryService';
import { Categories } from '../../../Models/categories';
import { Brand } from '../../../Models/brand';

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrl: './list-products.component.css'
})
export class ListProductsComponent {

  list_products: Product[] = [];
  product_brand: Product[] = [];
  searchList: Product[] = [];
  product: Product;
  product_id: number;
  product_name: string;
  brand_id: number;
  category_id: number;
  price: number;
  quantity: number;
  description: string = '';
  image_url: string;
  PathAnh: string;

  searchText: string;

  selected_product: Product | null = null;

  list_brand: Brand[] = [];
  list_category: Categories[] = [];


  paginatedProducts: Product[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  constructor(private brandService: BrandService, private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoryService: categoryService,
  ) {

  }

  ngOnInit(): void {
    this.DsBrand();
    this.DsDanhMuc();
    this.route.queryParams.subscribe(params => {
      const search = params['search'];
      if (search) {
        this.searchText = search;
        this.timkiem();
      } else {
        this.loadProductsByBrand();
      }
    });

    this.loadProductsByBrand();

  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.list_products.slice(start, end);
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

  loadProductsByBrand(): void {
    const Id = Number(this.route.snapshot.paramMap.get('id'));
    this.brand_id = Id;
    console.log(Id);
    if (this.brand_id && this.brand_id > 0) {
      this.productService.getByIdTH(this.brand_id).subscribe(
        (data: Product[]) => {
          this.list_products = data;
          this.product_brand = this.list_products.map(product => {
            product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url;
            return product;
          });

          this.totalPages = Math.ceil(this.list_products.length / this.pageSize);
          this.updatePagination();
        },
        (error) => {
          console.error('Lỗi khi tải sản phẩm theo thương hiệu:', error);
          this.product_brand = [];
        }
      );
    } else {
      this.productService.getProducts().subscribe(
        (data: Product[]) => {
          this.list_products = data;
          this.product_brand = this.list_products.map(product => {
            console.log('image_url:', product.image_url);
            product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url;
            return product;
          });

          this.totalPages = Math.ceil(this.list_products.length / this.pageSize);
          this.updatePagination();
        },
        (error) => {
          console.error('Lỗi khi tải tất cả sản phẩm:', error);
          this.product_brand = [];
        }
      );
    }
  }


  timkiem() {
    if (this.searchText) {
      console.log('Tìm kiếm với từ khóa:', this.searchText);
      this.productService.timkiem(this.searchText).subscribe({
        next: (productSearch) => {
          console.log('Kết quả tìm kiếm:', productSearch);
          if (productSearch.length > 0) {
            this.list_products = productSearch.map(product => {
              product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url;
              return product;
            });
            this.totalPages = Math.ceil(this.list_products.length / this.pageSize);
            this.currentPage = 1;
            this.updatePagination();
          } else {
            console.log('Không có sản phẩm nào tìm thấy.');
            this.list_products = [];
            this.paginatedProducts = [];
            this.totalPages = 0;
          }
        },
        error: (err) => {
          console.error('Lỗi khi tìm kiếm:', err);
        }
      });
    } else {
      console.log('Vui lòng nhập từ khóa tìm kiếm.');
    }
  }



  xoaProduct(product: Product) {
    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.product_name}" không?`);
    if (confirmDelete) {
      this.productService.deleteProduct(product.product_id).subscribe(
        (data) => {
          this.loadProductsByBrand();
          alert('Xóa sản phẩm thành công!');
        },
        (error) => {
          console.error('Lỗi khi xóa sản phẩm:', error);
          alert('Đã xảy ra lỗi khi xóa sản phẩm!');
        }
      );
    }
  }


  get photosUrl(): string {
    return this.productService.PhotosUrl;
  }

  uploadPhoto(event: any) {
    var file = event.target.files[0];
    if (!file) {
      alert('Vui lòng chọn một tệp!');
      return;
    }

    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    this.productService.taiAnh(formData).subscribe((data: any) => {
      if (data) {
        this.image_url = data.toString();
        console.log('Response data:', data);
        this.product.PathAnh = this.productService.PhotosUrl + "/" + this.image_url;
      } else {
        alert('Lỗi tải ảnh');
      }
    }, error => {
      console.error('Lỗi upload ảnh:', error);
      alert('Không thể tải ảnh lên');
    });
  }


  DsDanhMuc() {
    this.categoryService.getCategory().subscribe(data => {
      this.list_category = data;
      console.log("Categories:", data);
    });
  }

  DsBrand() {
    this.brandService.getBrand().subscribe(data => {
      this.list_brand = data;
      console.log("Brands:", data);
    });
  }

  editProduct(product: Product) {
    if (!product) {
      console.error('Sản phẩm không hợp lệ:', product);
      return;
    }
    this.selected_product = { ...product };
    this.product_name = this.selected_product.product_name;
    this.brand_id = this.selected_product.brand_id;
    this.category_id = this.selected_product.category_id;
    this.price = this.selected_product.price;
    this.quantity = this.selected_product.quantity;
    this.description = this.selected_product.description;
    this.image_url = this.selected_product.image_url;
    if (this.selected_product && this.selected_product.image_url) {
      this.selected_product.PathAnh = this.productService.PhotosUrl + "/" + this.selected_product.image_url;
    } else {
      this.selected_product.PathAnh = '';
    }
  }



  suaProduct() {
    if (!this.selected_product || !this.selected_product.product_id) {
      console.error('product chưa được chọn hoặc không hợp lệ.');
      return;
    }

    const val = {
      product_id: this.selected_product.product_id,
      product_name: this.product_name,
      brand_id: this.brand_id,
      category_id: this.category_id,
      price: this.price,
      quantity: this.quantity,
      image_url: this.image_url,
    };
    console.log(val);

    this.productService.updateProduct(this.selected_product.product_id, val).subscribe(
      response => {
        this.loadProductsByBrand();
        console.log('Sửa thành công:', response);
        alert('Sửa sản phẩm thành công!');
      },
      error => {
        console.error('Có lỗi khi sửa sản phẩm!', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
      }
    );
  }

  getBrandNameById(id: number): string {
    const brand = this.list_brand.find(b => b.brand_id === id);
    return brand ? brand.brand_name : 'Không rõ';
  }

  getCategoryNameById(id: number): string {
    const category = this.list_category.find(c => c.category_id === id);
    return category ? category.category_name : 'Không rõ';
  }
}
