import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { userService } from '../Service/userService';
import { Router } from '@angular/router';
import { User } from '../Models/users';
import { ActivatedRoute } from '@angular/router'; 
import { categoryService } from '../Service/categoryService';
import { Categories } from '../Models/categories';


@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent{
  @ViewChild('layoutSidenav') layoutSidenav!: ElementRef;
  user: User | null = null; 
  message = '';
  category_id : number;
  brand_id:number;
  sidebarVisible: boolean = false;

  

  toggleSidebar() {
  const sidenav = document.getElementById('layoutSidenav');
  const sidebar = document.getElementById('layoutSidenav_nav');

  this.sidebarVisible = !this.sidebarVisible;

  if (this.sidebarVisible) {
    sidenav?.classList.add('sidebar-open');
    sidebar?.classList.add('active');
  } else {
    sidenav?.classList.remove('sidebar-open');
    sidebar?.classList.remove('active');
  }
}

  constructor(private userService: userService, private router: Router,
    private route: ActivatedRoute,
    private categoryService:categoryService
  ){};

  ngOnInit(): void {

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
    const Id = Number(this.route.snapshot.paramMap.get('id'));
    this.category_id = Id;
    this.brand_id= Id;
  }
  productSearch: any[] = [];
  searchText: string = '';
  navigateToHome() {
    this.router.navigate(['/home/list']);
  }
  timkiem() {
    if (this.searchText) {
      this.router.navigate(['/admin/products/list/',0], { queryParams: { search: this.searchText } });
    } else {
      console.log("Vui lòng nhập từ khóa tìm kiếm.");
    }
  }
 logout() {
  this.userService.logout().subscribe(
    () => {
      localStorage.removeItem('user');
      this.user = null;
      this.router.navigate(['/home/list']);
    },
    error => {
      console.error('Logout error', error);
      this.message = 'Đăng xuất thất bại. Vui lòng thử lại.';
    }
  );
}

  
  updatePassword() {
    this.router.navigate(['/admin/user/updatePW/', this.user.user_id]);
  }
}
