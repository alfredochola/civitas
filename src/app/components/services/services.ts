import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContextMenuService } from '../../services/context-menu.service';

@Component({
  selector: 'app-services',
  imports: [CommonModule, RouterModule],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent {
  constructor(private contextMenuService: ContextMenuService) {}

  onContextMenu(event: MouseEvent, url: string, title: string): void {
    this.contextMenuService.open(event, url, title);
  }
}

