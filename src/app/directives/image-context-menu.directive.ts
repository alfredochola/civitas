import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { ContextMenuService, ContextMenuTriggerEvent } from '../services/context-menu.service';

export interface ImageContextMenuConfig {
  url: string;
  title?: string;
  onFullscreen?: () => void;
}

@Directive({
  selector: '[appImageContextMenu]',
  standalone: true
})
export class ImageContextMenuDirective {
  @Input('appImageContextMenu') config!: ImageContextMenuConfig;

  private touchTimer: any = null;
  private startX = 0;
  private startY = 0;
  private isLongPress = false;

  constructor(private contextMenuService: ContextMenuService, private el: ElementRef) {}

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.config?.url) {
      this.contextMenuService.open(
        event,
        this.config.url,
        this.config.title,
        this.config.onFullscreen
      );
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1 || !this.config?.url) return;
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.isLongPress = false;

    clearTimeout(this.touchTimer);
    this.touchTimer = setTimeout(() => {
      this.isLongPress = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(40); } catch (_) {}
      }
      const triggerEvent: ContextMenuTriggerEvent = {
        clientX: this.startX,
        clientY: this.startY,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      };
      this.contextMenuService.open(
        triggerEvent,
        this.config.url,
        this.config.title,
        this.config.onFullscreen
      );
    }, 420);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.touchTimer) return;
    const touch = event.touches[0];
    const diffX = Math.abs(touch.clientX - this.startX);
    const diffY = Math.abs(touch.clientY - this.startY);
    // If finger moves more than 10px, it's scrolling -> cancel
    if (diffX > 10 || diffY > 10) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    clearTimeout(this.touchTimer);
    this.touchTimer = null;
    if (this.isLongPress) {
      event.preventDefault();
      event.stopPropagation();
      setTimeout(() => {
        this.isLongPress = false;
      }, 350);
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.isLongPress) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
