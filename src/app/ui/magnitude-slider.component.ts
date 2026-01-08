import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-magnitude-slider',
  standalone: true,
  template: `
    <div class="mag-ui">
      <label>Limiting Mag: {{ limit.toFixed(1) }}</label>
      <input
        type="range"
        min="4"
        max="20.7"
        step="0.1"
        [value]="limit"
        (input)="onInput($event)"
      />
    </div>
  `,
  styles: [`
    .mag-ui {
      position: fixed;
      bottom: 70px;
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
export class MagnitudeSlider  {
  limit = 6.0;

  @Output()
  limitChange = new EventEmitter<number>();

  onInput(e: Event) {
    const value = +(e.target as HTMLInputElement).value;
    this.limit = value;
    this.limitChange.emit(this.limit);
  }
}
