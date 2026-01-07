import { Component, signal } from '@angular/core';
import { Sky } from './sky/sky';

@Component({
  selector: 'app-root',
  imports: [Sky],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('gaia-sky');
}
