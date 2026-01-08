import { Component, signal } from '@angular/core';
import { Sky } from './sky/sky';
import { TimeSlider } from './ui/time-slider';
import { MagnitudeSlider } from './ui/magnitude-slider.component';
import { InspectorComponent } from './ui/inspector.component';

@Component({
  selector: 'app-root',
  imports: [Sky, TimeSlider, MagnitudeSlider, InspectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('gaia-sky');
   currentYear = 2025;
   currentMagLimit = 6.0;

  onYearChange(year: any) {
    this.currentYear = year;
    // SkyComponent listens internally (see below)
  }
}
