import { Injectable } from '@angular/core';
import { WatermarkService } from './watermark.service';

@Injectable({
  providedIn: 'root'
})
export class ContextMenuService {
  isOpen = false;
  x = 0;
  y = 0;
  imageUrl = '';
  title = '';
  isDownloading = false;
  onFullscreen?: () => void;

  constructor(private watermarkService: WatermarkService) {}

  open(event: MouseEvent, imageUrl: string, title?: string, onFullscreen?: () => void): void {
    event.preventDefault();
    event.stopPropagation();

    this.imageUrl = imageUrl;
    this.title = title || 'Project';
    this.onFullscreen = onFullscreen;
    this.isDownloading = false;

    // Viewport boundary detection
    const menuWidth = 270;
    const menuHeight = onFullscreen ? 145 : 100;
    
    let posX = event.clientX;
    let posY = event.clientY;

    if (typeof window !== 'undefined') {
      if (posX + menuWidth > window.innerWidth) {
        posX = window.innerWidth - menuWidth - 12;
      }
      if (posY + menuHeight > window.innerHeight) {
        posY = window.innerHeight - menuHeight - 12;
      }
      if (posX < 12) posX = 12;
      if (posY < 12) posY = 12;
    }

    this.x = posX;
    this.y = posY;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.isDownloading = false;
  }

  async download(): Promise<void> {
    if (this.isDownloading || !this.imageUrl) return;

    this.isDownloading = true;
    try {
      await this.watermarkService.downloadWatermarkedImage(this.imageUrl, this.title, {
        position: 'center',
        opacity: 0.50,
        scaleRatio: 0.26
      });
      this.close();
    } catch (err) {
      console.error('Failed to download watermarked image from context menu:', err);
      this.isDownloading = false;
    }
  }

  triggerFullscreen(): void {
    if (this.onFullscreen) {
      this.onFullscreen();
    }
    this.close();
  }
}
