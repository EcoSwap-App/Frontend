import { Component, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, ViewChild, AfterViewInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product, Chat, User } from '../../models';
import { ProductCard } from '../../components/product-card/product-card';
import * as THREE from 'three';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('threeCanvas') threeCanvas!: ElementRef<HTMLCanvasElement>;

  product: Product | null = null;
  otherProducts: Product[] = [];
  selectedImage: string = '';
  currentUser: User | null = null;
  seller: User | null = null;
  isOwner = false;

  // 3D viewer state
  is3DMode = false;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cube!: THREE.Mesh;
  private animationId!: number;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser;
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroyThreeJS();
  }

  loadProductDetails(id: number) {
    this.apiService.getProductById(id).subscribe((data) => {
      this.product = data;
      if (data.images && data.images.length > 0) {
        this.selectedImage = data.images[0].startsWith('data:image')
          ? data.images[0]
          : data.images[0].startsWith('http')
            ? data.images[0]
            : 'assets/' + data.images[0];
      } else {
        this.selectedImage =
          'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=800';
      }

      // Check if user is owner
      const user = this.authService.currentUser;
      if (user && String(data.userId) === String(user.id)) {
        this.isOwner = true;
      }

      // Load Seller Details
      this.apiService.getUserById(Number(data.userId)).subscribe((sellerData) => {
        this.seller = sellerData;
        this.cdr.detectChanges();
      });

      // Load other products
      this.apiService.getProducts().subscribe((allProducts) => {
        this.otherProducts = allProducts
          .filter(
            (p) =>
              Number(p.id) !== Number(id) &&
              (p.available === true || String(p.available) === 'true'),
          )
          .slice(0, 4); // Take up to 4 other products
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    });
  }

  //-------3D viewer ---------

  toggle3DView() {
    this.is3DMode = !this.is3DMode;
    if (this.is3DMode) {
      setTimeout(() => this.initThreeJS(), 100);
    } else {
      this.destroyThreeJS();
    }
  }

  private getImageUrls(): string[] {
    const fallback = 'https://placehold.co/500x500/e2e8f0/64748b?text=Sin+imagen';

    if (!this.product?.images || this.product.images.length === 0) {
      return Array(6).fill(fallback);
    }

    const imgs = this.product.images.map((img) => {
      if (img.startsWith('http')) return img;
      if (img.startsWith('data:')) return img;
      return fallback; // rutas locales → fallback
    });

    //fill 6 faces repeating if needed
    const faces: string[] = [];
    for (let i = 0; i < 6; i++) {
      faces.push(imgs[i % imgs.length]);
    }
    return faces;
  }

  private initThreeJS() {
    const canvas = this.threeCanvas.nativeElement;
    if (!canvas) return;

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 400;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 3);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const imageUrls = this.getImageUrls();

    const materials = imageUrls.map((url) => {
      const texture = loader.load(url, () => {
        if (this.renderer) this.renderer.render(this.scene, this.camera);
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: texture });
    });

    const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    this.cube = new THREE.Mesh(geometry, materials);
    this.scene.add(this.cube);

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    canvas.addEventListener('touchend', this.onMouseUp.bind(this));

    this.animate();
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (!this.isDragging && this.cube) {
      this.cube.rotation.y += 0.005;
      this.cube.rotation.x += 0.002;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.cube) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    this.cube.rotation.y += deltaX * 0.01;
    this.cube.rotation.x += deltaY * 0.01;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  private onTouchStart(e: TouchEvent) {
    this.isDragging = true;
    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging || !this.cube) return;
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
    this.cube.rotation.y += deltaX * 0.01;
    this.cube.rotation.x += deltaY * 0.01;
    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  private destroyThreeJS() {
    if (this.animationId)  {
      cancelAnimationFrame(this.animationId);
    }
    if(this.renderer){
      this.renderer.dispose();
    }
    this.is3DMode = false;
  }

  //--- methods-----

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
      alert('No puedes contactarte a ti mismo.');
      return;
    }

    // Check if a chat already exists
    this.apiService.getChats(this.currentUser.id).subscribe((chats) => {
      const existingChat = chats.find(
        (c) =>
          String(c.productId) === String(this.product!.id) &&
          c.participants.map(String).includes(String(this.product!.userId)),
      );

      if (existingChat) {
        this.router.navigate(['/chat'], { queryParams: { chatId: existingChat.id } });
      } else {
        // Create new chat
        const newChat: Partial<Chat> = {
          productId: this.product!.id,
          participants: [String(this.currentUser!.id), String(this.product!.userId)],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.apiService.createChat(newChat).subscribe((createdChat) => {
          this.router.navigate(['/chat'], { queryParams: { chatId: createdChat.id } });
        });
      }
    });
  }
}
