import { Component, OnInit } from '@angular/core';
import { userService } from '../../../Service/userService';
import { User } from '../../../Models/users';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  username = '';
  password = '';
  message = '';
  user: User | null = null;

  constructor(
    private userService: userService,
    private router: Router,

  ) { }

  ngOnInit(): void {
    const middle = window.innerHeight / 2;
    window.scrollTo({ top: middle, behavior: 'smooth' });
  }


  Login() {
    const loginRequest = {
      Username: this.username,
      Password: this.password
    };

    this.userService.login(loginRequest).subscribe(
      response => {
        console.log('Login Response:', response);
        if (response.Success) {
          if (response.User && typeof response.User === 'object') {
            this.user = response.User;
            console.log("Login successful");
            console.log('User Data:', this.user);

            const roleId = Number(this.user.role_id);
            this.userService.setCurrentUser(this.user);
            localStorage.setItem('user', JSON.stringify(this.user));



            if (roleId === 1) {
              this.message = 'Đăng nhập thành công với quyền Admin';
              this.router.navigate(['/admin/index']);
            } else if (roleId === 2) {
              this.message = 'Đăng nhập thành công với quyền User';
              this.router.navigate(['/home/list']);
            } else {
              this.message = 'Lỗi: role_id không hợp lệ';
            }

          } else {
            this.message = 'Dữ liệu người dùng không hợp lệ';
          }
        } else {
          this.message = response.message || 'Đăng nhập thất bại.';
        }
      },
      error => {
        console.error('Login error', error);
        this.message = 'Đăng nhập thất bại. Vui lòng thử lại.';
        alert('Tên người dùng hoặc mật khẩu sai, vui lòng nhập lại!');
      }
    );
  }

  logout() {
    this.userService.logout().subscribe(
      response => {
        if (response.success) {
          this.message = response.message || 'Đăng xuất thành công.';
          localStorage.removeItem('user');
          this.user = null;
          this.router.navigate(['/login']);
        } else {
          this.message = response.message || 'Đăng xuất thất bại.';
        }
      },
      error => {
        console.error('Logout error', error);
        this.message = 'Đăng xuất thất bại. Vui lòng thử lại.';
      }
    );
  }
}
