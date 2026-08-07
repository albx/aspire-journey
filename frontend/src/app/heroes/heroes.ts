import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

import { Hero } from '../models/hero';
import { HeroService } from '../services/hero';

@Component({
  selector: 'app-heroes',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
  ],
  templateUrl: './heroes.html',
  styleUrl: './heroes.css',
})
export class Heroes implements OnInit {
  private readonly heroService = inject(HeroService);

  protected readonly heroes = signal<Hero[]>([]);

  ngOnInit(): void {
    this.getHeroes();
  }

  getHeroes(): void {
    this.heroService.getHeroes().subscribe((heroes) => this.heroes.set(heroes));
  }

  add(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    this.heroService.addHero(trimmedName).subscribe((hero) => {
      this.heroes.update((heroes) => [...heroes, hero]);
    });
  }

  delete(hero: Hero): void {
    this.heroes.update((heroes) => heroes.filter((h) => h.id !== hero.id));
    this.heroService.deleteHero(hero.id).subscribe();
  }
}
