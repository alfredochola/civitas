import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ContextMenuComponent } from './components/context-menu/context-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ContextMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('civitas');
}
