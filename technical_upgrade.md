# Technical Upgrade Blueprint: Next-Gen Image Performance & Programmed Automatic Watermarking Engine

> **Document Type:** AI-to-AI Implementation Guide & Engineering Architecture  
> **Target Use:** Read by an AI Coding Assistant or Senior Developer to replicate the exact image optimization and dynamic watermark engine on other client websites (e.g., JA Living Spaces, Richieart.co, or any architecture/construction portfolio).  
> **Framework Compatibility:** Path-agnostic. Compatible with Vanilla HTML/JS, Angular, React, Vue, Next.js, and static site generators (Jekyll, Hugo, etc.).

---

## Executive Overview & Architectural Philosophy

Architectural and construction portfolios typically carry **100+ high-resolution photographs and 3D renders**. Without modern engineering, these websites suffer from two critical flaws:
1. **Extreme Page Weight:** Loading 20MB–25MB of raw JPEGs/PNGs simultaneously stalls mobile browsing for **2.5 to 3.5 minutes**, causing high client bounce rates and burning mobile data bundles.
2. **Branding Dilemma:** Clients either manually burn permanent watermarks into their photos in Photoshop (wasting hours and ruining the visual elegance of their renders), or leave photos unbranded (risking content theft when visitors save images).

### The Solution Built Here:
1. **Next-Gen Image Engine:** Automated batch compression to WebP, progressive lazy-loading, and skeleton placeholders. Reduces page payloads by **85%–92%** and slashes initial load times from **minutes to ~1.5 seconds**.
2. **Programmed Automatic Watermark Engine:** Photos display **100% clean, crisp, and unwatermarked** on the website with **zero floating buttons**. When a visitor saves or downloads a photo (via desktop right-click or mobile long-press), an offscreen HTML5 Canvas dynamically stamps the client's official logo into the image on the fly before saving.

---

# PART 1: Next-Gen Image Performance Engine

## 1.1 The Problem & Real-World Diagnostic Data
On an unoptimized site (e.g., `projects.html` or `/project/6`):
* **Page Payload:** 10MB to 22MB transferred for a single visit.
* **HTTP Requests:** 100 simultaneous unthrottled image requests.
* **Mobile 3G Load Time:** 140s to 210s (2.4 to 3.5 minutes) with partial, chopped horizontal strip rendering.

## 1.2 Automated Batch Conversion Script (Node.js & Sharp)
Do **NOT** convert images manually. Use this path-agnostic script. It recursively scans any folder, compresses every `.jpg`, `.jpeg`, and `.png` into modern `.webp` (quality 82), and generates lightweight thumbnails.

Save as `scripts/optimize-images.mjs`:

```javascript
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Pass folder via CLI argument: node scripts/optimize-images.mjs ./public/assets/projects
const targetDir = process.argv[2] || './src/assets/images';

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png']);

async function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTS.has(ext)) {
        const baseName = path.basename(entry.name, ext);
        const webpPath = path.join(directory, `${baseName}.webp`);
        const thumbPath = path.join(directory, `${baseName}.thumb.webp`);

        // 1. High-Res Compressed WebP (Full View / Lightbox)
        if (!fs.existsSync(webpPath)) {
          console.log(`[OPTIMIZING] ${entry.name} -> ${baseName}.webp`);
          await sharp(fullPath)
            .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toFile(webpPath);
        }

        // 2. Ultra-Lightweight Grid Thumbnail (Masonry / Cards)
        if (!fs.existsSync(thumbPath)) {
          console.log(`[THUMBNAIL] ${entry.name} -> ${baseName}.thumb.webp`);
          await sharp(fullPath)
            .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 78, effort: 4 })
            .toFile(thumbPath);
        }
      }
    }
  }
}

console.log(`Starting image optimization in: ${targetDir}`);
processDirectory(targetDir)
  .then(() => console.log('All images successfully optimized to next-gen WebP!'))
  .catch(err => console.error('Image optimization failed:', err));
```

### Python Fallback Alternative (using Pillow):
If the target machine runs Python instead of Node:
```python
import os, sys
from PIL import Image

target_dir = sys.argv[1] if len(sys.argv) > 1 else "./images"

for root, _, files in os.walk(target_dir):
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png']:
            src = os.path.join(root, f)
            dest = os.path.join(root, os.path.splitext(f)[0] + '.webp')
            if not os.path.exists(dest):
                with Image.open(src) as img:
                    img.thumbnail((1920, 1920))
                    img.save(dest, 'WEBP', quality=82)
                print(f"Converted: {dest}")
```

## 1.3 Frontend Lazy-Loading & Skeleton Placeholder Strategy
When rendering the images in the DOM:
1. Always add `loading="lazy"` and `decoding="async"` to `<img>` tags.
2. Use CSS skeleton placeholders while images download to eliminate Content Layout Shift (CLS).

### Reusable CSS (Skeleton Shimmer):
```scss
.skeleton-placeholder {
  position: absolute;
  inset: 0;
  background: #e2e8f0;
  overflow: hidden;

  .skeleton-shimmer {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

img.portfolio-image {
  opacity: 0;
  transition: opacity 0.3s ease;
  &.loaded {
    opacity: 1;
  }
}
```

---

# PART 2: Programmed Automatic Watermark Engine

## 2.1 The Concept & Client Requirements
* **Zero UI Clutter:** The client rejected visible "Download Watermarked" buttons. Photos must look pristine.
* **Dynamic Compositing:** The image served on the website is unwatermarked. When saved/downloaded, an HTML5 Canvas overlays the client's official brand logo in the center (opacity 0.50), converts it to a high-quality `.jpg`, and triggers an instant download with the filename `[Client]-[ProjectName].jpg`.
* **Universal Access:** Must work on **Desktop (Right-Click)** and **Mobile (Long-Press / Touch-and-Hold)**.

---

## 2.2 The HTML5 Canvas Watermarking Service (Core Algorithm)
This is framework-agnostic logic. You can use it in Angular (`WatermarkService`), React (`useWatermark`), or vanilla JavaScript.

```typescript
export interface WatermarkOptions {
  logoUrl?: string;       // Path to client's white emblem/logo
  position?: 'center' | 'bottom-right';
  opacity?: number;       // Recommended: 0.45 - 0.55
  scaleRatio?: number;    // Size of logo relative to smallest image dimension (0.24 - 0.28)
  quality?: number;       // JPEG quality (0.90)
}

export class WatermarkEngine {
  private defaultLogo = 'assets/logo-white.png'; // Adapt to client logo path

  async generateWatermarkedBlob(
    imageUrl: string,
    options: WatermarkOptions = {}
  ): Promise<Blob> {
    const {
      logoUrl = this.defaultLogo,
      opacity = 0.50,
      scaleRatio = 0.26,
      quality = 0.90
    } = options;

    // Load original image and logo concurrently
    const [mainImg, logoImg] = await Promise.all([
      this.loadImage(imageUrl),
      this.loadImage(logoUrl)
    ]);

    // Create full-resolution offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = mainImg.naturalWidth;
    canvas.height = mainImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    // 1. Draw base high-resolution photo
    ctx.drawImage(mainImg, 0, 0);

    // 2. Calculate proportional dimensions for watermark
    const minDim = Math.min(canvas.width, canvas.height);
    const targetLogoWidth = minDim * scaleRatio;
    const logoAspect = logoImg.naturalHeight / logoImg.naturalWidth;
    const targetLogoHeight = targetLogoWidth * logoAspect;

    // 3. Center coordinates
    const posX = (canvas.width - targetLogoWidth) / 2;
    const posY = (canvas.height - targetLogoHeight) / 2;

    // 4. Composite logo with subtle alpha transparency
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoImg, posX, posY, targetLogoWidth, targetLogoHeight);
    ctx.restore();

    // 5. Convert to JPEG Blob (guarantees .jpg format across all browsers)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
        'image/jpeg',
        quality
      );
    });
  }

  async downloadWatermarkedImage(
    imageUrl: string,
    filenameTitle: string = 'Project',
    options?: WatermarkOptions
  ): Promise<void> {
    const blob = await this.generateWatermarkedBlob(imageUrl, options);
    const blobUrl = URL.createObjectURL(blob);

    const safeTitle = filenameTitle.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Civitas-${safeTitle}.jpg`; // Adapt prefix to client name
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 200);
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Crucial for CORS on remote CDNs
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }
}
```

---

## 2.3 The Mobile Challenge & Crucial Solution

### The Trap: Why Mobile Initially Failed
On desktop, `contextmenu` (right-click) is easily intercepted.  
On mobile phones (iOS Safari, Android Chrome), visitors download photos by **touching and holding (long-press)**.
* When someone long-presses an `<img>` tag on a phone, the **phone's mobile OS (iOS/Android)** intercepts the touch and displays its native system sheet (*"Save to Photos"*, *"Download Image"*).
* This native OS sheet **completely bypasses website JavaScript** and downloads the unwatermarked original URL directly from cache.

### The 3-Part Solution:
1. **CSS Callout Suppression:**  
   Disable the mobile OS native image sheet:
   ```scss
   .portfolio-img-wrapper,
   .portfolio-img-wrapper img,
   img.lightbox-image {
     -webkit-touch-callout: none !important; /* Disables iOS Safari native image menu */
     -webkit-user-select: none !important;
     user-select: none !important;
     -webkit-user-drag: none !important;
     -webkit-tap-highlight-color: transparent !important;
   }
   ```
2. **Touch-and-Hold Listener (420ms Timer):**
   * Listen to `touchstart`: record `(clientX, clientY)` and start a `420ms` timer.
   * Listen to `touchmove`: if finger moves `> 10px`, the user is scrolling; cancel the timer immediately.
   * If the timer completes: trigger haptic feedback (`navigator.vibrate(40)`) and open the custom menu.
   * Listen to `touchend`/`touchcancel`: if a long-press fired, call `preventDefault()` to cancel the synthetic `click` event so it does not accidentally open the lightbox.
3. **Synthetic Click Debounce (`justOpened` Flag):**
   * When the menu opens via touch release, mobile browsers dispatch a synthetic `click` event on `window`.
   * Keep a `justOpened = true` flag for `400ms` in the service so `window:click` does not instantly close the newly opened menu.

---

## 2.4 Reusable Mobile Long-Press & Context Menu Directive
In Angular (or adaptable to React hooks):

```typescript
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { ContextMenuService } from '../services/context-menu.service';

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

  constructor(private contextMenuService: ContextMenuService) {}

  // 1. Desktop Right-Click
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

  // 2. Mobile Touch-and-Hold (Long Press)
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
      this.contextMenuService.open(
        {
          clientX: this.startX,
          clientY: this.startY,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation()
        },
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
    // User is scrolling -> cancel long press
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
      setTimeout(() => { this.isLongPress = false; }, 350);
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.isLongPress) {
      // Prevent opening lightbox on finger release after long-press
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
```

---

## 2.5 The Glassmorphic Mobile Bottom Sheet & Desktop Menu UI

### Template (`context-menu.html`):
```html
<!-- Fullscreen backdrop for mobile dismissal -->
<div *ngIf="menuService.isOpen" 
     class="custom-context-backdrop"
     (click)="menuService.close()"
     (touchstart)="menuService.close()"></div>

<div *ngIf="menuService.isOpen" 
     class="custom-context-menu shadow-lg"
     [class.is-mobile]="menuService.isMobile"
     [style.left.px]="menuService.isMobile ? null : menuService.x"
     [style.top.px]="menuService.isMobile ? null : menuService.y"
     (click)="$event.stopPropagation()"
     role="menu">
  
  <!-- Header -->
  <div class="menu-header px-3 py-2 border-bottom border-secondary-subtle d-flex align-items-center justify-content-between">
    <div class="d-flex align-items-center gap-2 overflow-hidden">
      <img src="assets/logo-white.png" alt="Logo" class="menu-brand-icon">
      <span class="small fw-bold text-uppercase text-truncate menu-title">
        {{ menuService.title }}
      </span>
    </div>
    <button class="btn-close-menu d-md-none text-white-50 border-0 bg-transparent p-0" (click)="menuService.close()">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>

  <!-- Actions -->
  <div class="menu-items py-1">
    <button class="menu-item w-100 d-flex align-items-center text-start px-3 py-2 border-0 bg-transparent"
            (click)="menuService.download()"
            [disabled]="menuService.isDownloading">
      <div class="menu-icon-wrapper me-2 text-warning d-flex align-items-center justify-content-center">
        <span *ngIf="menuService.isDownloading" class="spinner-border spinner-border-sm" role="status"></span>
        <i *ngIf="!menuService.isDownloading" class="bi bi-download"></i>
      </div>
      <span class="menu-action-label">Save Image As...</span>
    </button>

    <button *ngIf="menuService.onFullscreen"
            class="menu-item w-100 d-flex align-items-center text-start px-3 py-2 border-0 bg-transparent"
            (click)="menuService.triggerFullscreen()">
      <div class="menu-icon-wrapper me-2 text-warning d-flex align-items-center justify-content-center">
        <i class="bi bi-arrows-fullscreen"></i>
      </div>
      <span class="menu-action-label">View Fullscreen</span>
    </button>
  </div>

  <!-- Mobile Cancel Button -->
  <button class="menu-item menu-item-cancel w-100 d-md-none text-center py-2 border-top border-secondary-subtle bg-transparent"
          (click)="menuService.close()">
    <span class="text-white-50 small text-uppercase fw-semibold">Cancel</span>
  </button>

  <!-- Footer -->
  <div class="menu-footer px-3 py-1 bg-black bg-opacity-25 border-top border-secondary-subtle d-flex align-items-center justify-content-between">
    <span class="menu-footer-text">Protected by Civitas</span>
    <i class="bi bi-shield-check text-warning" style="font-size: 0.75rem;"></i>
  </div>
</div>
```

### Styling (`context-menu.scss`):
```scss
.custom-context-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3499;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: fadeIn 0.18s ease-out forwards;
}

.custom-context-menu {
  position: fixed;
  z-index: 3500;
  min-width: 260px;
  max-width: 320px;
  background: rgba(21, 21, 21, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  color: #ffffff;
  overflow: hidden;
  user-select: none;
  animation: contextMenuPop 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 186, 8, 0.2);
}

/* Mobile: Slide-Up Bottom Sheet */
@media (max-width: 768px) {
  .custom-context-menu {
    left: 14px !important;
    right: 14px !important;
    bottom: 24px !important;
    top: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    width: auto !important;
    border-radius: 18px;
    animation: slideUpMobile 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    .menu-item {
      padding: 14px 18px !important;
    }
  }

  @keyframes slideUpMobile {
    from { transform: translateY(35px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
```

---

# PART 3: Step-by-Step Implementation Recipe for Any New Project

When opening another client project (e.g., JA Living Spaces or Richieart.co):

1. **Step 1: Run the Image Optimization Script**  
   Point `optimize-images.mjs` at the client's project image directory:
   ```bash
   node scripts/optimize-images.mjs ./public/assets/projects
   ```
2. **Step 2: Update Image Paths in Frontend Code**  
   Change `.jpg` / `.png` extensions to `.webp`. For thumbnails/cards, point to `.thumb.webp`.
3. **Step 3: Drop In the Watermark Engine & Context Menu**  
   * Copy `WatermarkEngine` (or `WatermarkService`).
   * Configure the client's official white logo asset path.
   * Add `ImageContextMenuDirective` (or attach right-click and touch handlers to portfolio cards and full-screen lightbox).
4. **Step 4: Add Mobile Protection CSS**  
   Add `-webkit-touch-callout: none !important; user-select: none !important;` to global styles.
5. **Step 5: Verify Both Platforms**  
   * **On Desktop:** Right-click an image -> see custom menu -> click "Save Image As..." -> verify downloaded JPEG contains centered watermark.
   * **On Smartphone:** Hold finger down on any photo -> feel vibration -> bottom sheet slides up -> tap "Save Image As..." -> verify downloaded photo is watermarked.
   * **Verify Browsing:** Confirm zero buttons on cards or lightbox during normal browsing.

---
*Created for automated transfer and replication across client web projects.*
