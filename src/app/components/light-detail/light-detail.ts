import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService, Light } from '../../services/data.service';
import { WatermarkService } from '../../services/watermark.service';
import { environment } from '../../../environments/environment';
import { SpinnerComponent } from '../spinner/spinner';
import { LightboxComponent } from '../lightbox/lightbox';

@Component({
  selector: 'app-light-detail',
  imports: [CommonModule, RouterModule, SpinnerComponent, LightboxComponent],
  templateUrl: './light-detail.html',
  styleUrl: './light-detail.scss'
})
export class LightDetailComponent implements OnInit {
  light: Light | undefined;
  isLoading = true;
  activeImage = '';
  downloadingActive = false;
  
  // Lightbox state
  showLightbox = false;
  lightboxIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private watermarkService: WatermarkService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductDetails(id);
      } else {
        this.isLoading = false;
      }
    });
  }

  private loadProductDetails(id: string): void {
    this.dataService.getLights().subscribe({
      next: (list) => {
        this.light = list.find(item => item.id === id);
        if (this.light && this.light.images.length > 0) {
          this.activeImage = this.light.images[0];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        this.isLoading = false;
      }
    });
  }

  setActiveImage(img: string): void {
    this.activeImage = img;
  }

  getWhatsAppUrl(): string {
    if (!this.light) return '';
    const phone = environment.whatsappContact.replace('+', '');
    const message = encodeURIComponent(`Hello, I would like to order the ${this.light.productName} (ID: ${this.light.id})`);
    return `https://wa.me/${phone}?text=${message}`;
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.showLightbox = true;
  }

  async downloadActiveImage(event: Event): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    if (this.downloadingActive || !this.activeImage) return;

    this.downloadingActive = true;
    try {
      const title = this.light?.productName || 'Lighting-Fixture';
      await this.watermarkService.downloadWatermarkedImage(this.activeImage, title);
    } catch (err) {
      console.error('Error downloading watermarked lighting photo:', err);
    } finally {
      this.downloadingActive = false;
    }
  }
}
