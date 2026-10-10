import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuService } from '../../services/context-menu.service';

@Component({
  selector: 'app-context-menu',
  imports: [CommonModule],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.scss'
})
export class ContextMenuComponent {
  constructor(public menuService: ContextMenuService) {}

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent): void {
    if (this.menuService.isOpen && !this.menuService.justOpened) {
      this.menuService.close();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    // On desktop, auto-close on scroll; on mobile keep bottom-sheet stable
    if (this.menuService.isOpen && !this.menuService.isMobile) {
      this.menuService.close();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.menuService.isOpen) {
      this.menuService.close();
    }
  }

  onMenuClick(event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
  }
}
