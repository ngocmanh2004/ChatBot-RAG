import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '../home.component';
import { FilterByCategoryComponent } from '../Product/filter-by-category/filter-by-category.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home/category/:category_id', component: FilterByCategoryComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
