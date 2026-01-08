import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-time-slider',
  standalone: true,
  template: `
    <div class="time-ui">
      <label>Year: {{ year }}</label>
      <input
        type="range"
        min="1800"
        max="2200"
        step="1"
        [value]="year"
        (input)="onInput($event)"
      />
    </div>
  `,
  styles: [`
    .time-ui {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.6);
      padding: 10px 14px;
      border-radius: 6px;
      color: #ddd;
      font-family: system-ui, sans-serif;
      font-size: 13px;
    }
    input {
      width: 220px;
    }
  `]
})
export class TimeSlider {
  year = 2025;

  @Output()
  yearChange = new EventEmitter<number>();

  onInput(e: Event) {
    const value = +(e.target as HTMLInputElement).value;
    this.year = value;
    this.yearChange.emit(this.year);
  }
}
