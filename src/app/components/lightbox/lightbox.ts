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
  @Input() currentIndex = 0;
  @Output() close = new EventEmitter<void>();

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
