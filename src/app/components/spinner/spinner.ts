import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading" class="spinner-overlay d-flex flex-column justify-content-center align-items-center">
      <div class="spinner-border" role="status" style="width: 3rem; height: 3rem; color: var(--brand-yellow); border-width: 0.25em;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-secondary small font-headings text-uppercase fw-bold" style="letter-spacing: 1px; font-size: 0.75rem;">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      min-height: 250px;
      width: 100%;
      padding: 3rem 0;
      transition: opacity 0.3s ease;
    }
  `]
})
export class SpinnerComponent {
  @Input() isLoading = true;
  @Input() message = 'Loading Portfolio...';
}
