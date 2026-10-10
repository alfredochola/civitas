import { Injectable } from '@angular/core';
import { WatermarkService } from './watermark.service';

export interface ContextMenuTriggerEvent {
  clientX: number;
  clientY: number;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

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
  isMobile = false;
  justOpened = false;
  private justOpenedTimer: any = null;

  constructor(private watermarkService: WatermarkService) {}

  open(
    event: ContextMenuTriggerEvent | MouseEvent | TouchEvent,
    imageUrl: string,
    title?: string,
    onFullscreen?: () => void
  ): void {
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }

    this.imageUrl = imageUrl;
    this.title = title || 'Civitas Project';
    this.onFullscreen = onFullscreen;
    this.isDownloading = false;

    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth <= 768;
    }

    // Viewport boundary detection for desktop
    const menuWidth = 270;
    const menuHeight = onFullscreen ? 145 : 100;

    let posX = 0;
    let posY = 0;

    if ('clientX' in event && typeof (event as any).clientX === 'number') {
      posX = (event as any).clientX;
      posY = (event as any).clientY;
    } else if ('touches' in event && (event as TouchEvent).touches && (event as TouchEvent).touches.length > 0) {
      posX = (event as TouchEvent).touches[0].clientX;
      posY = (event as TouchEvent).touches[0].clientY;
    } else if ('changedTouches' in event && (event as TouchEvent).changedTouches && (event as TouchEvent).changedTouches.length > 0) {
      posX = (event as TouchEvent).changedTouches[0].clientX;
      posY = (event as TouchEvent).changedTouches[0].clientY;
    }

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

    // Guard against synthetic click on touch release
    this.justOpened = true;
    clearTimeout(this.justOpenedTimer);
    this.justOpenedTimer = setTimeout(() => {
      this.justOpened = false;
    }, 450);
  }

  close(): void {
    this.isOpen = false;
    this.isDownloading = false;
    this.justOpened = false;
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
