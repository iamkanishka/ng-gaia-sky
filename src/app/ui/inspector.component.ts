import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-inspector',
  standalone: true,
  template: `
    @if (star) {
      <div class="inspector">
        <h3>Star Inspector</h3>

        <div><b>Gaia ID:</b> {{ star.source_id }}</div>
        <div><b>G Mag:</b> {{ star.phot_g_mean_mag }}</div>
        <div><b>Parallax:</b> {{ star.parallax }} mas</div>

        @if (papers?.length) {
          <h4>ADS Papers</h4>
          <ul>
            @for (p of papers; track p) {
              <li>
                {{ p.title }} ({{ p.year }})
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [`
    .inspector {
      position: fixed;
      right: 20px;
      top: 20px;
      background: rgba(0,0,0,0.7);
      color: #ddd;
      padding: 14px;
      border-radius: 6px;
      width: 280px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
    }
    h3, h4 {
      margin: 0 0 6px 0;
    }
  `]
})
export class InspectorComponent {
  @Input() star: any;
  @Input() papers: any[] | null = null;
}
