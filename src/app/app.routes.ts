import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home } from './pages/home/home';
import { AddProduct } from './pages/add-product/add-product';
import { MyProducts } from './pages/my-products/my-products';

import { Catalog } from './pages/catalog/catalog';

import { ProductDetails } from './pages/product-details/product-details';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'add-product', component: AddProduct },
  { path: 'my-products', component: MyProducts },
  { path: 'catalog', component: Catalog },
  { path: 'product/:id', component: ProductDetails },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
