import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExoplanetService {

  constructor(private http: HttpClient) {}

  loadHostIndex(): Observable<Set<string>> {
    return this.http
      .get<string[]>('assets/exoplanet-hosts.json')
      .pipe(
        map(list => new Set(list))
      );
  }
}
