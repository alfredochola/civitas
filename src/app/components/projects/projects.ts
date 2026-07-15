import { Component, OnInit } from '@angular/core';
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
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredImages: ImageItem[] = [];
  allImages: ImageItem[] = [];
  
  isLoading = true;
  selectedStatus = 'all';
  selectedProject = 'all';
  
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
  }

  openLightbox(index: number): void {
    const clickedImage = this.filteredImages[index];
    if (!clickedImage) return;

    // Isolate only the images belonging to this specific project
    const projectImages = this.allImages.filter(img => img.projectId === clickedImage.projectId);
    
    this.lightboxImages = projectImages.map(img => img.url);
    this.lightboxIndex = projectImages.findIndex(img => img.url === clickedImage.url);
    if (this.lightboxIndex === -1) this.lightboxIndex = 0;
    
    this.showLightbox = true;
  }
}
