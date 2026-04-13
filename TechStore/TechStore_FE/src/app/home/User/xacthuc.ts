import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { userService } from '../../Service/userService'; 

@Injectable({
  providedIn: 'root'
})
export class Xacthuc implements CanActivate {

  constructor(private userService: userService, private router: Router) {}

  canActivate(): boolean {
    const userId = this.userService.getUserId();
    console.log(userId);
    if (userId !== null && userId !== '') {
        console.log(userId);
      return true;
    } else {
      this.router.navigate(['/home/login']);
      return false;
    }
  }

  
}

