import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GaiaService {

  constructor(private http: HttpClient) {}

  fetchSample(limit = 500): Observable<any> {

    const query = `
      SELECT TOP ${limit}
        source_id,
        ra,
        dec,
        parallax,
        pmra,
        pmdec,
        phot_g_mean_mag,
        bp_rp
      FROM gaiadr3.gaia_source
      WHERE phot_g_mean_mag < 15
        AND parallax > 0
       
    `;

    const body =
      "REQUEST=doQuery" +
      "&LANG=ADQL" +
      "&FORMAT=JSON" +
      "&QUERY=" + encodeURIComponent(query + ";");

    return this.http.post('/esa-tap', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'json'
    });
  }
}
