import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  id: string;
  name: string;
  area: string;
  status: string;
  images: string[];
}

export interface Light {
  id: string;
  productName: string;
  description?: string;
  colour?: string;
  material?: string;
  dimensions?: string;
  power?: string;
  lumens?: string;
  powerSource?: string;
  voltage?: string;
  sensorAngle?: string;
  sensorRange?: string;
  ipRating?: string;
  installation?: string;
  functionalFeatures?: string;
  images: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('assets/data/projects.json');
  }

  getLights(): Observable<Light[]> {
    return this.http.get<Light[]>('assets/data/lights.json');
  }
}
