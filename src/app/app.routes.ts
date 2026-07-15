import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LightsCatalogComponent } from './components/lights-catalog/lights-catalog';
import { LightDetailComponent } from './components/light-detail/light-detail';
import { ProjectsComponent } from './components/projects/projects';
import { ServicesComponent } from './components/services/services';
import { ContactComponent } from './components/contact/contact';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'lights', component: LightsCatalogComponent },
  { path: 'lights/:id', component: LightDetailComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: 'home' }
];
