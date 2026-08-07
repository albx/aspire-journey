import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { HeroDetail } from './hero-detail';

describe('HeroDetail', () => {
  let component: HeroDetail;
  let fixture: ComponentFixture<HeroDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '11' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
