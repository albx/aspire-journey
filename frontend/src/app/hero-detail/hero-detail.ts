import { Component, OnInit, inject, signal } from '@angular/core';
import { Location, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Hero } from '../models/hero';
import { HeroService } from '../services/hero';

@Component({
  selector: 'app-hero-detail',
  imports: [UpperCasePipe, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './hero-detail.html',
  styleUrl: './hero-detail.css',
})
export class HeroDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly heroService = inject(HeroService);
  private readonly location = inject(Location);

  protected readonly hero = signal<Hero | undefined>(undefined);

  ngOnInit(): void {
    this.getHero();
  }

  getHero(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.heroService.getHero(id).subscribe((hero) => this.hero.set(hero));
  }

  save(name: string): void {
    const hero = this.hero();
    if (!hero) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    this.heroService.updateHero({ ...hero, name: trimmedName }).subscribe(() => {
      this.goBack();
    });
  }

  goBack(): void {
    this.location.back();
  }
}
