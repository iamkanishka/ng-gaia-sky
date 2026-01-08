import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private ADS_URL = 'https://api.adsabs.harvard.edu/v1/search/query';

  constructor(private http: HttpClient) {}

  searchByObjectName(name: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: '1rX8x3Ly32XPMXvZ7nyQIKsTjsBFbLwJrHvFAwbG'
    });

    const params = {
      q: `object:"${name}"`,
      fl: 'bibcode,title,author,year',
      rows: '5'
    };

    return this.http.get(this.ADS_URL, { headers, params });
  }
}
