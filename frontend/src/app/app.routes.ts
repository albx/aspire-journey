import { Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard';
import { HeroDetail } from './hero-detail/hero-detail';
import { Heroes } from './heroes/heroes';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'heroes', component: Heroes },
  { path: 'detail/:id', component: HeroDetail },
];
