import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService, Light } from '../../services/data.service';
import { SpinnerComponent } from '../spinner/spinner';

@Component({
  selector: 'app-lights-catalog',
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent],
  templateUrl: './lights-catalog.html',
  styleUrl: './lights-catalog.scss'
})
export class LightsCatalogComponent implements OnInit {
  lights: Light[] = [];
  filteredLights: Light[] = [];
  isLoading = true;

  // Search & Filter state
  searchQuery = '';
  selectedCategory = 'all';

  categories = [
    { name: 'All', value: 'all' },
    { name: 'Solar', value: 'solar' },
    { name: 'Rattan & Cane', value: 'rattan' },
    { name: 'Lanterns', value: 'lantern' },
    { name: 'Beacons', value: 'beacon' },
    { name: 'Sconces', value: 'sconce' },
    { name: 'Candelabrums', value: 'candelabrum' }
  ];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getLights().subscribe({
      next: (data) => {
        this.lights = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching lights:', err);
        this.isLoading = false;
      }
    });
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = this.lights;

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      result = result.filter(item => {
        const name = item.productName.toLowerCase();
        const desc = (item.description || '').toLowerCase();
        
        switch (this.selectedCategory) {
          case 'solar':
            return name.includes('solar') || desc.includes('solar') || item.id === 'lt-001';
          case 'rattan':
            return name.includes('rattan') || name.includes('cane') || name.includes('basket');
          case 'lantern':
            return name.includes('lantern');
          case 'beacon':
            return name.includes('beacon');
          case 'sconce':
            return name.includes('sconce');
          case 'candelabrum':
            return name.includes('candelabrum');
          default:
            return true;
        }
      });
    }

    // Apply search query filter
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item => 
        item.productName.toLowerCase().includes(q) || 
        (item.description || '').toLowerCase().includes(q) ||
        (item.colour || '').toLowerCase().includes(q) ||
        (item.material || '').toLowerCase().includes(q)
      );
    }

    this.filteredLights = result;
  }
}
