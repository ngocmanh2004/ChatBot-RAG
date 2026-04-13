import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from '../home/home.component';
import { FormsModule } from '@angular/forms';
import { CapNhatMKComponent } from './User/cap-nhat-mk/cap-nhat-mk.component';
import { CapNhatUserComponent } from './User/cap-nhat-user/cap-nhat-user.component';
import { ListProductComponent } from './Product/list-product/list-product.component';
import { FilterByCategoryComponent } from './Product/filter-by-category/filter-by-category.component';
import { FilterByBrandComponent } from './Product/filter-by-brand/filter-by-brand.component';
import { DetailProductComponent } from './Product/detail-product/detail-product.component';
import { ViewOrderHistoryComponent } from './User/view-order-history/view-order-history.component';
import { ShoppingCartComponent } from './Product/shopping-cart/shopping-cart.component';
import { LoginComponent } from './User/login/login.component';
import { ListOrderComponent } from './Order/list-order/list-order.component';
import { DetailOrderComponent } from './Order/detail-order/detail-order.component';
import { RegisterComponent } from './User/register/register.component';

@NgModule({
  declarations: [
    HomeComponent,
    CapNhatMKComponent,
    CapNhatUserComponent,
    ListProductComponent,
    FilterByCategoryComponent,
    FilterByBrandComponent,
    DetailProductComponent,
    ViewOrderHistoryComponent,
    ShoppingCartComponent,
    LoginComponent,
    ListOrderComponent,
    DetailOrderComponent,
    RegisterComponent,
  ],
  imports: [CommonModule, HomeRoutingModule, RouterModule, FormsModule],
})
export class HomeModule {}
