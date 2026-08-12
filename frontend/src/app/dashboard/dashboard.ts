import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { HeroSearch } from '../hero-search/hero-search';
import { HeroService } from '../services/hero';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatCardModule, HeroSearch],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly heroService = inject(HeroService);

  private readonly heroes = toSignal(this.heroService.getHeroes(), { initialValue: [] });

  protected readonly topHeroes = computed(() => this.heroes().slice(0, 4));
}
