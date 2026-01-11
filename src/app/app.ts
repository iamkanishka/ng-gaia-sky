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
   protected currentYear = 2025;
   protected currentMagLimit = 14.0;

   protected selecetedStar: any = null;

   protected selectedPapers: any[] | null = null; 


  onYearChange(year: any) {
    this.currentYear = year;
    // SkyComponent listens internally (see below)
  }

   viewMode: any = 'heliocentric';
 
  magLimit = 14.0;
  selectedStar: any = null;

  onStarSelect(star: any) {
    this.selectedStar = star;
    if (star) {
      console.log('Selected star:', star.source_id);
    }
  }
}
