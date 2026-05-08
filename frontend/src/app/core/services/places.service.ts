import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SearchResponse, GeocodeResponse } from '../models/place.models';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private readonly apiUrl: string = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /* Search places by keyword and coordinates */
  public searchPlaces(
    query: string,
    lat: number,
    lng: number,
    radius = 5000,
    limit = 10,
  ): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString())
      .set('limit', limit.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/places/search`, {
      params,
    });
  }

  /* Get detailed info for a single place by ID */
  public getPlaceDetails(placeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/places/${placeId}`);
  }

  /* Geocode a city name to coordinates */
  public geocodeCity(city: string): Observable<GeocodeResponse> {
    const params = new HttpParams().set('city', city);
    return this.http.get<GeocodeResponse>(`${this.apiUrl}/geocode`, { params });
  }
}
