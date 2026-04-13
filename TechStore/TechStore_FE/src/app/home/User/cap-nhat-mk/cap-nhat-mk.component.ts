import { Component, OnInit, Input } from '@angular/core';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../Models/users';

@Component({
  selector: 'app-cap-nhat-mk',
  templateUrl: './cap-nhat-mk.component.html',
  styleUrls: ['./cap-nhat-mk.component.css']
})
export class CapNhatMKComponent implements OnInit {
  userId: number;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  @Input() user: User;

  constructor(
    private userservice: userService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
    });
    this.loadUserData();

    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  loadUserData(): void {
    const currentUser = this.userservice.getCurrentUser();  
    if (currentUser) {
      this.user = currentUser;

    } else {
      console.log('Không có người dùng đăng nhập');
      
    }
  }

  isPasswordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  updatePassword(): void {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      alert('Vui lòng nhập các trường.');
      return;
    }
  
    if (!this.isPasswordsMatch()) {
      alert('Mật khẩu mới không hợp lệ.');
      return;
    }
  
    if (this.oldPassword === this.newPassword) {
      alert('Mật khẩu không đúng! Vui lòng nhập lại.');
      return;
    }
  
    const updatePasswordRequest = {
      CurrentPassword: this.oldPassword,
      NewPassword: this.newPassword
    };
  
    this.userservice.updatePassword(this.userId, updatePasswordRequest).subscribe(
      (response) => {
        alert('Cập nhật mật khẩu thành công.');

        this.loadUserData();
       if (this.user && this.user.role_id !== undefined) {
        const roleId = Number(this.user.role_id);
        if (roleId === 1) {
          console.log(roleId);
          this.router.navigate(['/admin/index']);
        } else if (roleId === 2) {
          this.router.navigate(['/home/list']);
        }
      } else {
        console.error('User or role_id is undefined');
        alert('Lỗi: Không tìm thấy thông tin người dùng hoặc vai trò không hợp lệ.');
      }
      },
      (error) => {
        alert('Error: ' + error.error);
      }
    );
  }
  
}
