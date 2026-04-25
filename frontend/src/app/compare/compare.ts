import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

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

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.scss',
})
export class CompareComponent implements OnInit {
  slots: PlayerSlot[] = [];
  statRows = STAT_ROWS;
  readonly MAX_PLAYERS = 5;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap.get('p');
    if (params) {
      this.initFromParams(params);
    } else {
      this.addSlot();
      this.addSlot();
    }
  }

  // ── URL encoding/decoding ──────────────────────────────────────────────────

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

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parts.length > 0 ? { p: parts.join(',') } : {},
      replaceUrl: true,
    });
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
    this.syncUrl();
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