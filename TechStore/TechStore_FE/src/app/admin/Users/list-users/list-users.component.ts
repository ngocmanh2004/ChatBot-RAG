import { Component } from '@angular/core';
import { User } from '../../../Models/users';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.css'
})
export class ListUsersComponent {


  user: User;
  user_id: number;
  username: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  create_at: Date;


  list_user: User[] = [];
  them: boolean = false;
  selected_user: any = null;


  constructor(private userService: userService, private router: Router) {
  }

  ngOnInit(): void {
    this.DsUser();
  }

  DsUser() {
    this.userService.getUsersRole2().subscribe(data => {
      this.list_user = data;
    });
  }

  xoaUser(user: User) {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.username}" không?`);
    if (confirmDelete) {
      this.userService.deleteUser(user.user_id).subscribe(
        (data) => {
          this.DsUser();
        }
      );
    }
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  editUser(user: User) {
    this.selected_user = user;
    this.username = this.selected_user.username;
    this.email = this.selected_user.email;
    this.phone = this.selected_user.phone;
    this.address = this.selected_user.address;
    this.password = this.selected_user.password;
    this.create_at = this.selected_user.create_at;
  }


  suaUser() {
    if (!this.selected_user || !this.selected_user.user_id) {
      console.error('Danh mục chưa được chọn hoặc không hợp lệ.');
      return;
    }

    const val = {
      user_id: this.selected_user.user_id,
      username: this.username,
      email: this.email,
      phone: this.phone,
      password: this.selected_user.password,
      address: this.address,
      create_at: this.create_at,
      role_id: this.selected_user.role_id
    };
    this.userService.updateUser(this.selected_user.user_id, val).subscribe(
      response => {
        this.DsUser();
        console.log('Sửa thành công:', response);
        alert('Sửa User thành công!');
      },
      error => {
        console.error('Có lỗi khi!', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
      }
    );
  }
}
