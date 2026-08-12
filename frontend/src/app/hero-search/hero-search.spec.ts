import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeroSearch } from './hero-search';

describe('HeroSearch', () => {
  let component: HeroSearch;
  let fixture: ComponentFixture<HeroSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSearch],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
