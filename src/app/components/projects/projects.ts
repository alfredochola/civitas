import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Project } from '../../services/data.service';
import { SpinnerComponent } from '../spinner/spinner';
import { LightboxComponent } from '../lightbox/lightbox';

interface ImageItem {
  url: string;
  projectName: string;
  area: string;
  status: string;
  projectId: string;
}

@Component({
  selector: 'app-projects',
  imports: [CommonModule, SpinnerComponent, LightboxComponent],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') scrollSentinel?: ElementRef<HTMLDivElement>;

  projects: Project[] = [];
  filteredImages: ImageItem[] = [];
  displayedImages: ImageItem[] = [];
  allImages: ImageItem[] = [];
  
  isLoading = true;
  selectedStatus = 'all';
  selectedProject = 'all';

  // Incremental Batch Loading
  pageSize = 12;
  displayedCount = 16;
  private observer?: IntersectionObserver;
  
  // Image load state tracking
  imageLoadedMap: { [url: string]: boolean } = {};
  
  // Lightbox state
  showLightbox = false;
  lightboxImages: string[] = [];
  lightboxIndex = 0;

  onImageLoad(url: string): void {
    this.imageLoadedMap[url] = true;
  }

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.flattenImages();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMore();
      }
    }, { rootMargin: '300px' });

    if (this.scrollSentinel?.nativeElement) {
      this.observer.observe(this.scrollSentinel.nativeElement);
    }
  }

  private updateSentinelObservation(): void {
    setTimeout(() => {
      if (this.observer && this.scrollSentinel?.nativeElement) {
        this.observer.disconnect();
        if (this.hasMoreImages) {
          this.observer.observe(this.scrollSentinel.nativeElement);
        }
      }
    }, 50);
  }

  get hasMoreImages(): boolean {
    return this.displayedImages.length < this.filteredImages.length;
  }

  loadMore(): void {
    if (!this.hasMoreImages) return;
    this.displayedCount += this.pageSize;
    this.displayedImages = this.filteredImages.slice(0, this.displayedCount);
    this.updateSentinelObservation();
  }

  private flattenImages(): void {
    const list: ImageItem[] = [];
    this.projects.forEach(p => {
      p.images.forEach(img => {
        list.push({
          url: img,
          projectName: p.name,
          area: p.area,
          status: p.status,
          projectId: p.id
        });
      });
    });
    this.allImages = list;
  }

  getUniqueStatuses(): string[] {
    const statuses = new Set<string>();
    this.projects.forEach(p => statuses.add(p.status.toLowerCase()));
    return Array.from(statuses);
  }

  setFilterStatus(status: string): void {
    this.selectedStatus = status.toLowerCase();
    this.applyFilters();
  }

  setFilterProject(projectId: string): void {
    this.selectedProject = projectId;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = this.allImages;

    if (this.selectedStatus !== 'all') {
      result = result.filter(
        img => img.status.toLowerCase() === this.selectedStatus
      );
    }

    if (this.selectedProject !== 'all') {
      result = result.filter(
        img => img.projectId === this.selectedProject
      );
    }

    this.filteredImages = result;
    this.displayedCount = 16;
    this.displayedImages = this.filteredImages.slice(0, this.displayedCount);
    this.updateSentinelObservation();
  }

  openLightbox(index: number): void {
    const clickedImage = this.displayedImages[index];
    if (!clickedImage) return;

    // Isolate only the images belonging to this specific project
    const projectImages = this.allImages.filter(img => img.projectId === clickedImage.projectId);
    
    this.lightboxImages = projectImages.map(img => img.url);
    this.lightboxIndex = projectImages.findIndex(img => img.url === clickedImage.url);
    if (this.lightboxIndex === -1) this.lightboxIndex = 0;
    
    this.showLightbox = true;
  }
}
