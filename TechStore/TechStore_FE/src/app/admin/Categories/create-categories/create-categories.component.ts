import { Component, Input } from '@angular/core';
import { Categories } from '../../../Models/categories';
import { categoryService } from '../../../Service/categoryService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-categories',
  templateUrl: './create-categories.component.html',
  styleUrl: './create-categories.component.css'
})
export class CreateCategoriesComponent {

  name: string = '';
  them: boolean = true;

  @Input() categories: Categories;

  constructor(private categoryService: categoryService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.name = this.categories.category_name;
  }

  themDanhmuc() {
    const val = {
      category_name: this.name,
    };

    console.log(val);
    this.categoryService.addCategory(val).subscribe(
      (result) => {
        console.log('Thêm thành công', result);
        alert('Thêm thành công!');
        this.router.navigate(['/admin/categories/list']);
      },
      (error) => {
        console.error('Có lỗi xảy ra khi thêm danh mục:', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
      }
    );

  }

  closeForm() {
    this.them = false;
    this.router.navigate(['/admin/categories/list']);
  }
}
