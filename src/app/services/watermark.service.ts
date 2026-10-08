import { Injectable } from '@angular/core';

export interface WatermarkOptions {
  position?: 'top-left' | 'center';
  opacity?: number;
  scaleRatio?: number;
  quality?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WatermarkService {
  private logoUrl = 'assets/logo-w.png';
  private cachedLogo?: HTMLImageElement;
  private logoLoadPromise?: Promise<HTMLImageElement>;

  /**
   * Pre-fetches or retrieves the cached Civitas logo
   */
  private getLogo(): Promise<HTMLImageElement> {
    if (this.cachedLogo) {
      return Promise.resolve(this.cachedLogo);
    }
    if (!this.logoLoadPromise) {
      this.logoLoadPromise = this.loadImage(this.logoUrl).then((img) => {
        this.cachedLogo = img;
        return img;
      });
    }
    return this.logoLoadPromise;
  }

  /**
   * Loads an image from a URL into an HTMLImageElement with crossOrigin support
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error(`Failed to load image from: ${url}`));
      img.src = url;
    });
  }

  /**
   * Watermarks a full-resolution image and triggers a clean browser download
   */
  async downloadWatermarkedImage(
    imageUrl: string,
    title?: string,
    options: WatermarkOptions = {}
  ): Promise<void> {
    const {
      position = 'top-left',
      opacity = 0.88,
      scaleRatio = 0.18,
      quality = 0.90
    } = options;

    // 1. Concurrently load the source photo and the Civitas logo
    const [baseImg, logoImg] = await Promise.all([
      this.loadImage(imageUrl),
      this.getLogo()
    ]);

    // 2. Create offscreen canvas sized exactly to original photo resolution
    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is not available');
    }

    // 3. Draw pristine source photo
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    // 4. Calculate dynamic proportional watermark size
    const minDim = Math.min(canvas.width, canvas.height);
    const logoRatio = logoImg.naturalHeight / logoImg.naturalWidth;
    const logoWidth = Math.round(minDim * scaleRatio);
    const logoHeight = Math.round(logoWidth * logoRatio);

    // 5. Position watermark
    let x: number;
    let y: number;

    if (position === 'center') {
      x = Math.round((canvas.width - logoWidth) / 2);
      y = Math.round((canvas.height - logoHeight) / 2);
    } else {
      // Top-left with proportional padding
      const padding = Math.round(minDim * 0.04);
      x = padding;
      y = padding;
    }

    // 6. Draw Civitas logo with opacity and subtle drop-shadow for contrast
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.max(3, Math.round(logoWidth * 0.035));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(2, Math.round(logoWidth * 0.015));

    ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
    ctx.restore();

    // 7. Format clean, sanitized download filename with explicit .jpg extension
    const cleanTitle = (title || 'Project')
      .trim()
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `Civitas-${cleanTitle || 'Photo'}.jpg`;

    // 8. Trigger instant native download with guaranteed .jpg filename
    try {
      // Using canvas.toDataURL guarantees Chrome/Edge/Firefox will strictly honor
      // the download attribute and file extension instead of falling back to a blob UUID
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = dataUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Delay removal so the browser's download manager reads attributes before cleanup
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, 2000);
    } catch {
      // Fallback to File/Blob for ultra-large canvases
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });

      if (!blob) {
        throw new Error('Failed to generate image blob');
      }

      const file = new File([blob], filename, { type: 'image/jpeg' });
      const blobUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 40000);
    }
  }
}
