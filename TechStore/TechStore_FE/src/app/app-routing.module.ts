import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { CapNhatMKComponent } from './home/User/cap-nhat-mk/cap-nhat-mk.component';
import { CapNhatUserComponent } from './home/User/cap-nhat-user/cap-nhat-user.component';
import { ListProductComponent } from './home/Product/list-product/list-product.component';
import { FilterByCategoryComponent } from './home/Product/filter-by-category/filter-by-category.component';
import { FilterByBrandComponent } from './home/Product/filter-by-brand/filter-by-brand.component';
import { DetailProductComponent } from './home/Product/detail-product/detail-product.component';
import { ViewOrderHistoryComponent } from './home/User/view-order-history/view-order-history.component';
import { ShoppingCartComponent } from './home/Product/shopping-cart/shopping-cart.component';
import { ListOrderComponent } from './home/Order/list-order/list-order.component';
import { DetailOrderComponent } from './home/Order/detail-order/detail-order.component';
import { LoginComponent } from './home/User/login/login.component';
import { RegisterComponent } from './home/User/register/register.component';
import { Xacthuc } from './home/User/xacthuc';

import { AdminComponent } from './admin/admin.component';
import { IndexComponent } from './admin/index/index.component';
import { ListDonhangComponent } from './admin/Donhang/list-donhang/list-donhang.component';
import { CreateDonhangComponent } from './admin/Donhang/create-donhang/create-donhang.component';
import { ListCategoriesComponent } from './admin/Categories/list-categories/list-categories.component';
import { CreateCategoriesComponent } from './admin/Categories/create-categories/create-categories.component';
import { ListBrandsComponent } from './admin/Brands/list-brands/list-brands.component';
import { CreateBrandsComponent } from './admin/Brands/create-brands/create-brands.component';
import { ListProductsComponent } from './admin/Product/list-products/list-products.component';
import { DetailProductsComponent } from './admin/Product/detail-products/detail-products.component';
import { CreateProductComponent } from './admin/Product/create-product/create-product.component';
import { ListUsersComponent } from './admin/Users/list-users/list-users.component';
import { CreateUsersComponent } from './admin/Users/create-users/create-users.component';

const routes: Routes = [
  { path: '', redirectTo: '/home/list', pathMatch: 'full' },

  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: ListProductComponent },
      { path: 'login', component: LoginComponent },
      { path: 'user/register', component: RegisterComponent },
      { path: 'product/category/:category_id', component: FilterByCategoryComponent },
      { path: 'product/category/:category_id/brand/:brand_id', component: FilterByBrandComponent },
      { path: 'product/search', component: ListProductComponent },
      { path: 'product/detail/:product_id', component: DetailProductComponent },
      { path: 'shopping-cart', component: ShoppingCartComponent },
      { path: 'order/detailOrder/:id_order/:id_customer', component: DetailOrderComponent },

      // Các route cần xác thực
      { path: 'order/listOrder', component: ListOrderComponent, canActivate: [Xacthuc] },
      { path: 'order/detailOrder/:id', component: DetailOrderComponent, canActivate: [Xacthuc] },
      { path: 'user/updatePW/:id', component: CapNhatMKComponent, canActivate: [Xacthuc] },
      { path: 'user/updateUser/:id', component: CapNhatUserComponent, canActivate: [Xacthuc] },
      { path: 'user/viewOH/:id', component: ViewOrderHistoryComponent, canActivate: [Xacthuc] },
      { path: 'product/carts', component: ShoppingCartComponent, canActivate: [Xacthuc] }
    ]
  },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [Xacthuc],
    children: [
      { path: '', redirectTo: 'index', pathMatch: 'full' },
      { path: 'index', component: IndexComponent },
      { path: 'products', component: ListProductsComponent },
      { path: 'products/list/:id', component: ListProductsComponent },
      { path: 'products/detail/:id', component: DetailProductsComponent },
      { path: 'products/create', component: CreateProductComponent },
      { path: 'donhang/list', component: ListDonhangComponent },
      { path: 'donhang/create', component: CreateDonhangComponent },
      { path: 'categories/list', component: ListCategoriesComponent },
      { path: 'categories/create', component: CreateCategoriesComponent },
      { path: 'brands/list/:id', component: ListBrandsComponent },
      { path: 'brands/create', component: CreateBrandsComponent },
      { path: 'users/list', component: ListUsersComponent },
      { path: 'users/create', component: CreateUsersComponent },
      { path: 'user/updatePW/:id', component: CapNhatMKComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
