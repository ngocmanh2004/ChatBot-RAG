import { Component } from '@angular/core';
import { categoryService } from '../../../Service/categoryService';
import { Categories } from '../../../Models/categories';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-categories',
  templateUrl: './list-categories.component.html',
  styleUrl: './list-categories.component.css'
})
export class ListCategoriesComponent {

  list_category: any[] = [];
  category_name: string = '';
  categories: Categories;
  them: boolean = false;
  selected_categoryService: any = null;

  constructor(private categoryService: categoryService, private router: Router) {
  }

  ngOnInit(): void {
    this.DsDanhMucSp();
  }

  DsDanhMucSp() {
    this.categoryService.getCategory().subscribe(data => {
      this.list_category = data;
    });
  }

  xoaDanhmuc(categories: Categories) {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${categories.category_name}" không?`);
    if (confirmDelete) {
      this.categoryService.deleteCategory(categories.category_id).subscribe(
        (data) => {
          console.log(data);
          this.DsDanhMucSp();
        }
      );
    }
  }


  editDanhMuc(categories: Categories) {
    this.selected_categoryService = categories;
    this.category_name = categories ? categories.category_name : '';

  }

  suaDanhMuc() {
    if (!this.selected_categoryService || !this.selected_categoryService.category_id) {
      console.error('Danh mục chưa được chọn hoặc không hợp lệ.');
      return;
    }

    const val = { category_id: this.selected_categoryService.category_id, category_name: this.category_name };
    console.log(val);
    this.categoryService.updateCategory(this.selected_categoryService.category_id, val).subscribe(
      response => {
        this.DsDanhMucSp();
        console.log('Sửa thành công:', response);
        alert('Sửa danh mục thành công!');
      },
      error => {
        console.error('Có lỗi khi sửa danh mục!', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
      }
    );
  }

  dong() {
    this.them = false;
    this.DsDanhMucSp();
  }

}
