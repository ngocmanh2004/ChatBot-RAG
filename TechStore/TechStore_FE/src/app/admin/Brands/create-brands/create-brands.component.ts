import { Component, Input } from '@angular/core';
import { Brand } from '../../../Models/brand';
import { BrandService } from '../../../Service/brand-service';
import { Router } from '@angular/router';
import { categoryService } from '../../../Service/categoryService';
import { Categories } from '../../../Models/categories';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-create-brands',
  templateUrl: './create-brands.component.html',
  styleUrl: './create-brands.component.css'
})
export class CreateBrandsComponent {

  name: string = '';
  category_id: number;
  category: Categories;


  list_category: any[] = [];
  brand: Brand;

  constructor(private brandService: BrandService,
    private categoryService: categoryService,
    private router: Router, private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.DsDanhMuc();
    this.layDetailCategory(this.category_id);

  }

  DsDanhMuc() {

    this.categoryService.getCategory().subscribe(data => {
      this.list_category = data;
      console.log("dl", data);
    });
  }


  // Lấy chi tiết sản phẩm theo ID
  layDetailCategory(id: number): void {
    if (!id) return; // Kiểm tra nếu ID không hợp lệ
    this.categoryService.getCategoryDetails(id).subscribe({
      next: (data) => {
        this.category = data; // Lưu thông tin chi tiết sản phẩm
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
      }
    });
  }

  themBrand() {
    const val = {
      brand_name: this.name,
      category_id: this.category_id,
    };
    this.brandService.addBrand(val).subscribe(
      (result) => {
        console.log('Thêm thành công', result);
        alert('Thêm thành công!');
        this.router.navigate(['/admin/brands/list/', 0]);
      },
    );
  }
}
