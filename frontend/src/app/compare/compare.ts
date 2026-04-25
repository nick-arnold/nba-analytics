import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

interface PlayerSlot {
  searchQuery: string;
  searchResults: any[];
  selectedPlayer: any | null;
  availableSeasons: string[];
  selectedSeason: string | null;
  stats: any | null;
  loading: boolean;
  searchLoading: boolean;
  showDropdown: boolean;
  searchSubject: Subject<string>;
}

interface ComparisonLink {
  label: string;
  slugs: string[];
}

interface ComparisonGroup {
  title: string;
  comparisons: ComparisonLink[];
}

const STAT_ROWS = [
  { key: 'ppg',     label: 'PPG',  higher: true,  decimals: 1 },
  { key: 'rpg',     label: 'RPG',  higher: true,  decimals: 1 },
  { key: 'apg',     label: 'APG',  higher: true,  decimals: 1 },
  { key: 'spg',     label: 'SPG',  higher: true,  decimals: 1 },
  { key: 'bpg',     label: 'BPG',  higher: true,  decimals: 1 },
  { key: 'topg',    label: 'TOV',  higher: false, decimals: 1 },
  { key: 'fg_pct',  label: 'FG%',  higher: true,  decimals: 1, pct: true },
  { key: 'fg3_pct', label: '3P%',  higher: true,  decimals: 1, pct: true },
  { key: 'ft_pct',  label: 'FT%',  higher: true,  decimals: 1, pct: true },
  { key: 'gp',      label: 'GP',   higher: true,  decimals: 0 },
];

const POPULAR_COMPARISONS: ComparisonGroup[] = [
  {
    title: 'MVP Race',
    comparisons: [
      { label: 'SGA vs Jokić',         slugs: ['shai-gilgeous-alexander', 'nikola-jokic'] },
      { label: 'SGA vs Wembanyama',    slugs: ['shai-gilgeous-alexander', 'victor-wembanyama'] },
      { label: 'Jokić vs Wembanyama',  slugs: ['nikola-jokic', 'victor-wembanyama'] },
      { label: 'SGA vs Luka',          slugs: ['shai-gilgeous-alexander', 'luka-doncic'] },
      { label: 'The Big 4',            slugs: ['shai-gilgeous-alexander', 'nikola-jokic', 'victor-wembanyama', 'luka-doncic'] },
    ],
  },
  {
    title: 'Best Guards',
    comparisons: [
      { label: 'SGA vs Curry',          slugs: ['shai-gilgeous-alexander', 'stephen-curry'] },
      { label: 'Luka vs Curry',         slugs: ['luka-doncic', 'stephen-curry'] },
      { label: 'Haliburton vs Maxey',   slugs: ['tyrese-haliburton', 'tyrese-maxey'] },
      { label: 'Edwards vs Booker',     slugs: ['anthony-edwards', 'devin-booker'] },
    ],
  },
  {
    title: 'Best Bigs',
    comparisons: [
      { label: 'Jokić vs Embiid',           slugs: ['nikola-jokic', 'joel-embiid'] },
      { label: 'Wemby vs Jokić vs Embiid',  slugs: ['victor-wembanyama', 'nikola-jokic', 'joel-embiid'] },
      { label: 'Sabonis vs Jokić',          slugs: ['domantas-sabonis', 'nikola-jokic'] },
      { label: 'Bam vs AD',                 slugs: ['bam-adebayo', 'anthony-davis'] },
    ],
  },
  {
    title: 'Forward Debates',
    comparisons: [
      { label: 'Tatum vs Brown',       slugs: ['jayson-tatum', 'jaylen-brown'] },
      { label: 'Giannis vs Tatum',     slugs: ['giannis-antetokounmpo', 'jayson-tatum'] },
      { label: 'LeBron vs Durant',     slugs: ['lebron-james', 'kevin-durant'] },
      { label: 'Giannis vs LeBron',    slugs: ['giannis-antetokounmpo', 'lebron-james'] },
    ],
  },
  {
    title: 'Young Stars',
    comparisons: [
      { label: 'Wemby vs Chet',         slugs: ['victor-wembanyama', 'chet-holmgren'] },
      { label: 'Cunningham vs Edwards', slugs: ['cade-cunningham', 'anthony-edwards'] },
      { label: 'Banchero vs Wagner',    slugs: ['paolo-banchero', 'franz-wagner'] },
      { label: 'Flagg vs Knueppel',     slugs: ['cooper-flagg', 'kon-knueppel'] },
    ],
  },
];

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.scss',
})
export class CompareComponent implements OnInit, OnDestroy {
  slots: PlayerSlot[] = [];
  statRows = STAT_ROWS;
  popularComparisons = POPULAR_COMPARISONS;
  readonly MAX_PLAYERS = 5;

  private routeSub?: Subscription;
  private lastSyncedParam: string | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const p = params.get('p');
  
      if (p === this.lastSyncedParam) return;
  
      this.resetSlots();
      this.lastSyncedParam = p;
  
      if (p) {
        this.initFromParams(p);
      } else {
        this.addSlot();
        this.addSlot();
      }
  
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.slots.forEach(s => s.searchSubject.complete());
  }

  // ── URL encoding/decoding ──────────────────────────────────────────────────

  private resetSlots() {
    this.slots.forEach(s => s.searchSubject.complete());
    this.slots = [];
  }

  private initFromParams(params: string) {
    const entries = params.split(',').filter(Boolean).slice(0, this.MAX_PLAYERS);
    const slotCount = Math.max(entries.length, 2);
    for (let i = 0; i < slotCount; i++) {
      this.addSlot();
    }
    entries.forEach((entry, i) => {
      const [slug, season] = entry.split(':');
      if (slug) {
        this.loadPlayerBySlug(this.slots[i], slug, season ?? null);
      }
    });
  }

  private loadPlayerBySlug(slot: PlayerSlot, slug: string, season: string | null) {
    slot.loading = true;
    this.http.get<any>(`/api/players/players/${slug}/`).subscribe({
      next: (player) => {
        slot.selectedPlayer = player;
        slot.searchQuery = `${player.first_name} ${player.last_name}`;
        this.loadSeasons(slot, player.id, season);
        this.cdr.detectChanges();
      },
      error: () => {
        slot.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private syncUrl() {
    const parts = this.slots
      .filter(s => s.selectedPlayer)
      .map(s => {
        const slug = s.selectedPlayer.player_slug ?? s.selectedPlayer.slug;
        const season = s.selectedSeason ?? '';
        return `${slug}:${season}`;
      });

    const newParam = parts.length > 0 ? parts.join(',') : null;
    this.lastSyncedParam = newParam;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParam ? { p: newParam } : {},
      replaceUrl: true,
      queryParamsHandling: 'merge',
    });
  }

  buildComparisonQueryParams(slugs: string[]): { p: string } {
    return { p: slugs.map(s => `${s}:`).join(',') };
  }

  // ── Slot management ────────────────────────────────────────────────────────

  addSlot() {
    if (this.slots.length >= this.MAX_PLAYERS) return;
    const subject = new Subject<string>();
    const slot: PlayerSlot = {
      searchQuery: '',
      searchResults: [],
      selectedPlayer: null,
      availableSeasons: [],
      selectedSeason: null,
      stats: null,
      loading: false,
      searchLoading: false,
      showDropdown: false,
      searchSubject: subject,
    };

    subject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          slot.searchResults = [];
          slot.showDropdown = false;
          slot.searchLoading = false;
          return of({ results: [] });
        }
        slot.searchLoading = true;
        return this.http.get<any>(`/api/players/players/?search=${encodeURIComponent(query)}&limit=8`);
      })
    ).subscribe({
      next: (res: any) => {
        slot.searchLoading = false;
        const results = res.results ?? res ?? [];
        slot.searchResults = Array.isArray(results) ? results.slice(0, 8) : [];
        slot.showDropdown = slot.searchResults.length > 0;
        this.cdr.detectChanges();
      },
      error: () => {
        slot.searchLoading = false;
        slot.searchResults = [];
        this.cdr.detectChanges();
      }
    });

    this.slots.push(slot);
  }

  removeSlot(index: number) {
    if (this.slots.length <= 2) return;
    this.slots[index].searchSubject.complete();
    this.slots.splice(index, 1);
    this.syncUrl();
    this.cdr.detectChanges();
  }

  // ── Search & selection ─────────────────────────────────────────────────────

  onSearchInput(slot: PlayerSlot) {
    if (!slot.searchQuery) {
      slot.showDropdown = false;
      slot.searchResults = [];
    }
    slot.searchSubject.next(slot.searchQuery);
  }

  selectPlayer(slot: PlayerSlot, player: any) {
    slot.selectedPlayer = player;
    slot.searchQuery = `${player.first_name} ${player.last_name}`;
    slot.showDropdown = false;
    slot.searchResults = [];
    slot.stats = null;
    slot.selectedSeason = null;
    slot.availableSeasons = [];
    this.loadSeasons(slot, player.id, null);
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  loadSeasons(slot: PlayerSlot, playerId: number, preferredSeason: string | null) {
    slot.loading = true;
    this.http.get<any>(`/api/stats/player-season-stats/?player=${playerId}`).subscribe({
      next: (res) => {
        const results = res.results ?? res ?? [];
        const seasons: string[] = [...new Set<string>(
          (Array.isArray(results) ? results : []).map((s: any) => s.season)
        )].sort((a, b) => b.localeCompare(a));
        slot.availableSeasons = seasons;
        slot.selectedSeason = (preferredSeason && seasons.includes(preferredSeason))
          ? preferredSeason
          : (seasons[0] ?? null);
        slot.loading = false;
        this.cdr.detectChanges();
        if (slot.selectedSeason) {
          this.loadStats(slot, playerId, slot.selectedSeason);
        }
      },
      error: () => {
        slot.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSeasonChange(slot: PlayerSlot) {
    if (!slot.selectedPlayer || !slot.selectedSeason) return;
    this.loadStats(slot, slot.selectedPlayer.id, slot.selectedSeason);
  }

  loadStats(slot: PlayerSlot, playerId: number, season: string) {
    slot.loading = true;
    slot.stats = null;
    this.http.get<any>(`/api/stats/player-season-stats/?player=${playerId}&season=${season}`).subscribe({
      next: (res) => {
        const results = res.results ?? res ?? [];
        slot.stats = Array.isArray(results) && results.length > 0 ? results[0] : null;
        slot.loading = false;
        this.cdr.detectChanges();
        this.syncUrl();
      },
      error: () => {
        slot.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Stat helpers ───────────────────────────────────────────────────────────

  getStatValue(slot: PlayerSlot, key: string): number | null {
    if (!slot?.stats) return null;
    const val = slot.stats[key];
    return val !== null && val !== undefined ? +val : null;
  }

  formatStat(val: number | null, row: any): string {
    if (val === null || val === undefined) return '—';
    const num = (row as any).pct ? val * 100 : val;
    return num.toFixed(row.decimals);
  }

  isLeader(rowKey: string, higherIsBetter: boolean, slotIndex: number): boolean {
    if (slotIndex >= this.slots.length) return false;
    const values = this.slots
      .map(s => this.getStatValue(s, rowKey))
      .filter(v => v !== null) as number[];
    if (values.length < 2) return false;
    const myVal = this.getStatValue(this.slots[slotIndex], rowKey);
    if (myVal === null) return false;
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    const bestCount = values.filter(v => v === best).length;
    return myVal === best && bestCount === 1;
  }

  get anyPlayerSelected(): boolean {
    return this.slots.some(s => s.selectedPlayer !== null);
  }

  hideDropdown(slot: PlayerSlot) {
    setTimeout(() => {
      slot.showDropdown = false;
      this.cdr.detectChanges();
    }, 150);
  }
}