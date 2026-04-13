import { Component, OnInit } from '@angular/core';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  username: string;
  email: string;
  phone: string;
  password: string;
  rePassword: string;
  address: string;
  create_at: Date;
  role_id: number;

  constructor(private userService: userService, private router: Router) { }

  ngOnInit(): void {
    const middle = window.innerHeight / 3;
    window.scrollTo({ top: middle, behavior: 'smooth' });
  }

  isStrongPassword(pw: string): boolean {
    return pw.length >= 6;
  }

  dangKy() {
    if (!this.username || !this.password || !this.rePassword) {
      alert('Vui lòng nhập đầy đủ thông tin đăng ký');
      return;
    }

    if (this.password !== this.rePassword) {
      alert('Mật khẩu không khớp');
      return;
    }

    if (!this.isStrongPassword(this.password)) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const userData = {
      username: this.username,
      email: this.email,
      phone: this.phone,
      password: this.password,
      address: this.address,
      create_at: this.create_at,
      role_id: this.role_id
    };

    this.userService.register(userData).subscribe(
      res => {
        alert('Đăng ký thành công');
        this.router.navigate(['/home/login']);
      },
      error => {
        alert('Đăng ký thất bại');
        console.error(error);
      }
    );
  }
}