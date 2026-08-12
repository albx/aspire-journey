import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { HeroService } from '../services/hero';

@Component({
  selector: 'app-hero-search',
  imports: [RouterLink, MatFormFieldModule, MatInputModule, MatListModule],
  templateUrl: './hero-search.html',
  styleUrl: './hero-search.css',
})
export class HeroSearch {
  private readonly heroService = inject(HeroService);

  private readonly searchTerms = new Subject<string>();

  protected readonly heroes = toSignal(
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.heroService.searchHeroes(term)),
    ),
    { initialValue: [] },
  );

  search(term: string): void {
    this.searchTerms.next(term);
  }
}
