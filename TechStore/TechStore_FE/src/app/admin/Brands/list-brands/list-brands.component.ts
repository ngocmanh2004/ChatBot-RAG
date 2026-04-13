import { Component } from '@angular/core';
import { BrandService } from '../../../Service/brand-service';
import { Brand } from '../../../Models/brand';
import { Router, ActivatedRoute } from '@angular/router';
import { categoryService } from '../../../Service/categoryService';
import { Categories } from '../../../Models/categories';

@Component({
  selector: 'app-list-brands',
  templateUrl: './list-brands.component.html',
  styleUrls: ['./list-brands.component.css']
})
export class ListBrandsComponent {
  list_brand: any[] = [];
  brand: Brand;
  brand_name: string;
  brand_id: number;
  them: boolean = false;
  selected_brand: any = null;
  category_id: number;
  categories: Categories[];
  brand_category: any[] = [];

  constructor(
    private brandService: BrandService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: categoryService
  ) { }

  ngOnInit(): void {
    this.loadBrandsByCategory();
  }

  loadBrandsByCategory(): void {
    const DMId = Number(this.route.snapshot.paramMap.get('id'));
    this.category_id = DMId;

    console.log('DMId từ route là:', this.category_id);

    if (this.category_id && this.category_id > 0) {
      console.log('Gọi API: /Brands/ByCategory/' + this.category_id);
      this.brandService.getBrand_idDM(this.category_id).subscribe(
        (data: Brand[]) => {
          console.log('Kết quả trả về:', data);
          this.brand_category = data;
        },
        (error) => {
          console.error('Lỗi khi tải thương hiệu theo danh mục:', error);
          this.brand_category = [];
        }
      );
    } else {
      console.log('Gọi API: /Brands');
      this.brandService.getBrand().subscribe(
        (data: Brand[]) => {
          console.log('Kết quả trả về:', data);
          this.brand_category = data;
        },
        (error) => {
          console.error('Lỗi khi tải tất cả thương hiệu:', error);
          this.brand_category = [];
        }
      );
    }
  }


  deleteBrand(brand: Brand) {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${brand.brand_name}" không?`);
    if (confirmDelete) {
      this.brandService.deleteBrand(brand.brand_id).subscribe(
        () => {
          this.loadBrandsByCategory();
        }
      );
    }
  }

  editBrand(brand: Brand) {
    this.selected_brand = brand;
    this.brand_name = brand ? brand.brand_name : '';
  }

  suaBrand() {
    if (!this.selected_brand || !this.selected_brand.brand_id) {
      console.error('Danh mục chưa được chọn hoặc không hợp lệ.');
      return;
    }

    this.category_id = this.selected_brand.category_id || this.category_id;
    const val = {
      brand_id: this.selected_brand.brand_id,
      brand_name: this.brand_name,
      category_id: this.category_id
    };

    console.log(val);
    this.brandService.updateBrand(this.selected_brand.brand_id, val).subscribe(
      response => {
        this.loadBrandsByCategory();
        alert('Sửa thương hiệu thành công!');
      },
      error => {
        console.error('Có lỗi khi sửa thương hiệu!', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
      }
    );
  }

  dong() {
    this.them = false;
    this.loadBrandsByCategory();
  }
}
