import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PagedResult } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getAll(astrPage: number = 1, astrPageSize: number = 10): Observable<PagedResult<UserDto>> {
    return this.http.get<PagedResult<UserDto>>(
      `${this.base}?page=${astrPage}&pageSize=${astrPageSize}`);
  }
  changeRole(id: number, role: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/role`, { role });
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

}


export interface UserDto {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}