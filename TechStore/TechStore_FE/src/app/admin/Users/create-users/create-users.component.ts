import { Component, Input } from '@angular/core';
import { User } from '../../../Models/users';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-users',
  templateUrl: './create-users.component.html',
  styleUrl: './create-users.component.css'
})
export class CreateUsersComponent {

  username: string;
  email: string;
  phone:string;
  address: string;
  create_at: Date;
  role_id: number;
  them : boolean =true;

  @Input() user : User;

  constructor (private userService: userService,
    private router: Router,
  ){
   }

   ngOnInit(): void {
    this.username = this.user.username;
    this.email = this.user.email;
    this.phone= this.user.phone;
    this.address= this.user.address;
    this.create_at = this.create_at;
    this.role_id= this.user.role_id;

  }

  themUser() {
      const val = {
        username: this.username,
        email: this.email,
        phone: this.phone,
        address: this.address,
        create_at: this.create_at,
        role_id: this.role_id = 2,
      };

      console.log(val);
      this.userService.addUser(val).subscribe(
        (result) => {
          console.log('Thêm thành công', result);
          alert('Thêm thành công!');
          this.router.navigate(['/admin/users/list']);
        },
        (error) => {
          console.error('Có lỗi xảy ra khi thêm user:', error);
          // Hiển thị thêm thông tin lỗi chi tiết
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
