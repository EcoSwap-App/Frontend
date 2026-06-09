import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home } from './pages/home/home';
import { AddProduct } from './pages/add-product/add-product';
import { MyProducts } from './pages/my-products/my-products';

import { Catalog } from './pages/catalog/catalog';

import { ProductDetails } from './pages/product-details/product-details';
import { ChatComponent } from './pages/chat/chat';
import { MyProductDetails } from './pages/my-product-details/my-product-details';
import { Profile } from './pages/profile/profile';
import { Favorites } from './pages/favorites/favorites';
import { PublicProfile } from './pages/public-profile/public-profile';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'profile', component: Profile },
  { path: 'add-product', component: AddProduct },
  { path: 'my-products', component: MyProducts },
  { path: 'catalog', component: Catalog },
  { path: 'favorites', component: Favorites },
  { path: 'product/:id', component: ProductDetails },
  { path: 'my-product/:id', component: MyProductDetails },
  { path: 'chat', component: ChatComponent },
  { path: 'user/:id', component: PublicProfile },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
