import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WatermarkService } from '../../services/watermark.service';
import { ContextMenuService } from '../../services/context-menu.service';

@Component({
  selector: 'app-lightbox',
  imports: [CommonModule],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss'
})
export class LightboxComponent {
  @Input() images: string[] = [];
  @Input() title: string = '';
  
  private _currentIndex = 0;
  @Input() 
  set currentIndex(val: number) {
    this._currentIndex = val;
    this.imageLoading = true;
  }
  get currentIndex(): number {
    return this._currentIndex;
  }

  @Output() close = new EventEmitter<void>();

  imageLoading = true;
  isDownloading = false;

  constructor(
    private watermarkService: WatermarkService,
    private contextMenuService: ContextMenuService
  ) {}

  onContextMenu(event: MouseEvent): void {
    if (!this.images || !this.images[this.currentIndex]) return;
    const currentUrl = this.images[this.currentIndex];
    const filenameTitle = this.title ? `${this.title}-${this.currentIndex + 1}` : 'Photo';
    this.contextMenuService.open(event, currentUrl, filenameTitle);
  }

  async downloadCurrent(event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    if (this.isDownloading || !this.images || !this.images[this.currentIndex]) return;

    this.isDownloading = true;
    try {
      const currentUrl = this.images[this.currentIndex];
      const filenameTitle = this.title ? `${this.title}-${this.currentIndex + 1}` : 'Photo';
      await this.watermarkService.downloadWatermarkedImage(currentUrl, filenameTitle);
    } catch (err) {
      console.error('Error generating watermarked download:', err);
    } finally {
      this.isDownloading = false;
    }
  }

  onImageLoad(): void {
    this.imageLoading = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowRight' || event.key === 'Right') {
      this.next();
    } else if (event.key === 'ArrowLeft' || event.key === 'Left') {
      this.prev();
    }
  }

  next() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }

  prev() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }
}
