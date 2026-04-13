import { Component } from '@angular/core';
import { User } from '../../../Models/users';
import { ActivatedRoute } from '@angular/router';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cap-nhat-user',
  templateUrl: './cap-nhat-user.component.html',
  styleUrl: './cap-nhat-user.component.css'
})
export class CapNhatUserComponent {
  user: User = new User();
  selected: any = null;
  user_id: number;
  username: string;
  email: string;
  phone: string;
  address: string;


  constructor(
    private route: ActivatedRoute,
    private userServices: userService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    this.userServices.getUserById(id).subscribe(
      (data: User) => {
        this.user = data;
      },
      (error) => {
        console.error('Error fetching user:', error);
        alert('Unable to fetch user data. Please try again later.');
      }
    );
  }

  updateUser(): void {
    this.userServices.updateUser(this.user.user_id, this.user).subscribe(
      () => {
        alert('Cập nhật thông tin tài khoản thành công!');
        this.router.navigate(['/user-list']);
      },
      (error) => {
        console.error('Error updating user:', error);
        alert('Đã xảy ra lỗi !!!');
      }
    );
  }
}
