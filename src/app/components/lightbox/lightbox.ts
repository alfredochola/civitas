import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lightbox',
  imports: [CommonModule],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss'
})
export class LightboxComponent {
  @Input() images: string[] = [];
  
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
