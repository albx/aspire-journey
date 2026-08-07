import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { Hero } from '../models/hero';
import { MessageService } from './message';

@Service()
export class HeroService {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  private readonly heroesUrl = `${environment.apiBaseUrl}/heroes`;

  getHeroes(): Observable<Hero[]> {
    return this.http.get<Hero[]>(this.heroesUrl).pipe(
      tap(() => this.log('fetched heroes')),
    );
  }

  getHero(id: number): Observable<Hero> {
    const url = `${this.heroesUrl}/${id}`;
    return this.http.get<Hero>(url).pipe(
      tap(() => this.log(`fetched hero id=${id}`)),
    );
  }

  searchHeroes(term: string): Observable<Hero[]> {
    if (!term.trim()) {
      return this.getHeroes();
    }

    const url = `${this.heroesUrl}?name=${encodeURIComponent(term)}`;
    return this.http.get<Hero[]>(url).pipe(
      tap((heroes) => this.log(`found ${heroes.length} heroes matching "${term}"`)),
    );
  }

  addHero(name: string): Observable<Hero> {
    return this.http.post<Hero>(this.heroesUrl, { name }).pipe(
      tap((hero) => this.log(`added hero w/ id=${hero.id}`)),
    );
  }

  updateHero(hero: Hero): Observable<Hero> {
    const url = `${this.heroesUrl}/${hero.id}`;
    return this.http.put<Hero>(url, { name: hero.name }).pipe(
      tap(() => this.log(`updated hero id=${hero.id}`)),
    );
  }

  deleteHero(id: number): Observable<void> {
    const url = `${this.heroesUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.log(`deleted hero id=${id}`)),
    );
  }

  private log(message: string): void {
    this.messageService.add(`HeroService: ${message}`);
  }
}
