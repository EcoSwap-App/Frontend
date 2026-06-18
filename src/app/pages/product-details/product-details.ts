import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product, Chat, User } from '../../models';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  product: Product | null = null;
  otherProducts: Product[] = [];
  selectedImage: string = '';
  currentUser: User | null = null;
  seller: User | null = null;
  isOwner = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser;
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  loadProductDetails(id: string) {
    this.apiService.getProductById(id).subscribe(data => {
      this.product = data;
      if (data.images && data.images.length > 0) {
        this.selectedImage = data.images[0].startsWith('data:image') || data.images[0].startsWith('http') ? data.images[0] : 'assets/' + data.images[0];
      } else {
        this.selectedImage = 'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=800';
      }

      // Check if user is owner
      const user = this.authService.currentUser;
      if (user && String(data.userId) === String(user.id)) {
        this.isOwner = true;
      }
      
      // Load Seller Details
      this.apiService.getUserById(String(data.userId)).subscribe(sellerData => {
        this.seller = sellerData;
        this.cdr.detectChanges();
      });
      
      // Load other products
      this.apiService.getProducts().subscribe(allProducts => {
        this.otherProducts = allProducts
          .filter(p => String(p.id) !== String(id) && (p.available === true || String(p.available) === 'true'))
          .slice(0, 4); // Take up to 4 other products
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    });
  }

  formatImage(img: string): string {
    if (!img) return '';
    return img.startsWith('data:image') || img.startsWith('http') ? img : 'assets/' + img;
  }

  getStars(reputation: number): number[] {
    return Array(Math.round(reputation) || 0).fill(0);
  }

  getEmptyStars(reputation: number): number[] {
    return Array(5 - (Math.round(reputation) || 0)).fill(0);
  }

  requestProduct() {
    alert(`Has solicitado el producto: ${this.product?.title}. El vendedor será notificado.`);
  }

  contactSeller() {
    if (!this.currentUser || !this.product) return;
    if (String(this.currentUser.id) === String(this.product.userId)) {
      alert("No puedes contactarte a ti mismo.");
      return;
    }

    // Check if a chat already exists
    this.apiService.getChats(this.currentUser.id).subscribe(chats => {
      const existingChat = chats.find(c => String(c.productId) === String(this.product!.id) && c.participants.map(String).includes(String(this.product!.userId)));
      
      if (existingChat) {
        this.router.navigate(['/chat'], { queryParams: { chatId: existingChat.id } });
      } else {
        // Create new chat
        const newChat: Partial<Chat> = {
          productId: this.product!.id,
          participants: [String(this.currentUser!.id), String(this.product!.userId)],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.apiService.createChat(newChat).subscribe(createdChat => {
          this.router.navigate(['/chat'], { queryParams: { chatId: createdChat.id } });
        });
      }
    });
  }
}
