import {
  Component, OnInit, OnDestroy, AfterViewInit,
  Input, ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

declare const d3: any;

@Component({
  selector: 'app-shot-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shot-chart.html',
  styleUrl: './shot-chart.scss',
})
export class ShotChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() nbaGameId!: string;
  @Input() homeTeam!: string;
  @Input() awayTeam!: string;

  @ViewChild('courtSvg') courtSvgRef!: ElementRef<SVGElement>;

  loading = true;
  error = false;
  shots: any[] = [];
  activeTeam: 'home' | 'away' | 'both' = 'both';
  activeMetric: 'fgpct' | 'freq' = 'fgpct';

  homeAbbr = '';
  awayAbbr = '';

  private resizeObserver?: ResizeObserver;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.http.get<any>(`/api/stats/shot-chart/?game_id=${this.nbaGameId}`).subscribe({
      next: (res) => {
        this.homeAbbr = res.home_team;
        this.awayAbbr = res.away_team;
        this.shots = (res.shots || []).filter((s: any) => s.y <= 35);
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.render(), 50);
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.loading && this.shots.length) this.render();
    });
    if (this.courtSvgRef?.nativeElement?.parentElement) {
      this.resizeObserver.observe(this.courtSvgRef.nativeElement.parentElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  setTeam(team: 'home' | 'away' | 'both') {
    this.activeTeam = team;
    this.render();
  }

  setMetric(metric: 'fgpct' | 'freq') {
    this.activeMetric = metric;
    this.render();
  }

  get filteredShots(): any[] {
    if (this.activeTeam === 'both') return this.shots;
    const abbr = this.activeTeam === 'home' ? this.homeAbbr : this.awayAbbr;
    return this.shots.filter((s: any) => s.team === abbr);
  }

  get shotStats() {
    const shots = this.filteredShots;
    const fga = shots.length;
    const fgm = shots.filter((s: any) => s.made).length;

    const is3 = (s: any) => {
      const dx = s.x - 25;
      const dy = s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist >= 23.75 || (Math.abs(dx) >= 22 && s.y <= 14);
    };

    const fg3a = shots.filter((s: any) => is3(s)).length;
    const fg3m = shots.filter((s: any) => is3(s) && s.made).length;
    const fg2a = shots.filter((s: any) => !is3(s)).length;
    const fg2m = shots.filter((s: any) => !is3(s) && s.made).length;

    return {
      fga, fgm, fg3a, fg3m, fg2a, fg2m,
      fgPct:  fga  > 0 ? (fgm  / fga  * 100).toFixed(1) : '—',
      fg3Pct: fg3a > 0 ? (fg3m / fg3a * 100).toFixed(1) : '—',
      fg2Pct: fg2a > 0 ? (fg2m / fg2a * 100).toFixed(1) : '—',
    };
  }

  render() {
    if (!this.courtSvgRef) return;
    const svgEl = this.courtSvgRef.nativeElement;
    const containerW = svgEl.parentElement?.clientWidth || 500;

    const COURT_W = 52;
    const COURT_H = 35;

    const SVG_W = containerW;
    const SVG_H = Math.round(SVG_W * (COURT_H / COURT_W));

    const xScale = d3.scaleLinear().domain([-26, 26]).range([0, SVG_W]);
    const yScale = d3.scaleLinear().domain([0, COURT_H]).range([SVG_H, 0]);

    const toCourtX = (apiX: number) => apiX - 25;
    const toCourtY = (apiY: number) => apiY + 5.25;

    d3.select(svgEl).selectAll('*').remove();
    d3.select(svgEl)
      .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`)
      .attr('width', SVG_W)
      .attr('height', SVG_H);

    const svg = d3.select(svgEl);

    // Define clip path to keep hexes inside sidelines
    svg.append('defs').append('clipPath')
      .attr('id', 'court-clip')
      .append('rect')
      .attr('x', xScale(-25))
      .attr('y', 0)
      .attr('width', xScale(25) - xScale(-25))
      .attr('height', SVG_H);

    this.drawCourt(svg, SVG_W, SVG_H, xScale, yScale);
    this.drawHexbins(svg, SVG_W, SVG_H, xScale, yScale, toCourtX, toCourtY);
  }

  private drawCourt(svg: any, W: number, H: number, xS: any, yS: any) {
    const g = svg.append('g').attr('class', 'court');
    const pxPerFt = W / 52;

    const L = (x1: number, y1: number, x2: number, y2: number) =>
      g.append('line').attr('class', 'court-line')
        .attr('x1', xS(x1)).attr('y1', yS(y1))
        .attr('x2', xS(x2)).attr('y2', yS(y2));

    const arcPath = (cx: number, cy: number, r: number, a1: number, a2: number, steps = 64) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = a1 + (a2 - a1) * (i / steps);
        const rad = t * Math.PI / 180;
        pts.push([xS(cx + r * Math.cos(rad)), yS(cy + r * Math.sin(rad))]);
      }
      return pts.map((p: number[], i: number) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    };

    const Arc = (cx: number, cy: number, r: number, a1: number, a2: number) =>
      g.append('path').attr('class', 'court-line').attr('d', arcPath(cx, cy, r, a1, a2));

    // Court background
    g.append('rect').attr('class', 'court-bg')
      .attr('x', 0).attr('y', 0).attr('width', W).attr('height', H);

    // Boundaries
    L(-25, 0, 25, 0);
    L(-25, 0, -25, 35);
    L(25, 0, 25, 35);

    // Paint
    L(-8, 0, -8, 19); L(8, 0, 8, 19); L(-8, 19, 8, 19);
    L(-6, 0, -6, 19); L(6, 0, 6, 19);
    [7, 11, 14, 17].forEach(y => {
      L(-8, y, -5.5, y); L(8, y, 5.5, y);
    });

    // Free throw circle
    Arc(0, 19, 6, 0, 180);
    g.append('path').attr('class', 'court-line court-line--dashed')
      .attr('d', arcPath(0, 19, 6, 180, 360));

    // Restricted area
    Arc(0, 5.25, 4, 0, 180);

    // Three point line
    const r3 = 23.75;
    const aCorner = Math.acos(22 / r3) * 180 / Math.PI;
    const cornerJoinY = 5.25 + r3 * Math.sin(aCorner * Math.PI / 180);
    L(-22, 0, -22, cornerJoinY);
    L(22, 0, 22, cornerJoinY);
    Arc(0, 5.25, r3, aCorner, 180 - aCorner);

    // Backboard & rim
    L(-3, 4, 3, 4);
    g.append('circle').attr('class', 'court-line court-rim')
      .attr('cx', xS(0)).attr('cy', yS(5.25))
      .attr('r', 0.75 * pxPerFt);
  }

  private drawHexbins(
    svg: any, W: number, H: number,
    xS: any, yS: any,
    toCourtX: (x: number) => number,
    toCourtY: (y: number) => number
  ) {
    const shots = this.filteredShots;
    if (!shots.length) return;

    const pxPerFt = W / 52;
    const hexR = pxPerFt * 2.4;

    const pts = shots.map((s: any) => {
      const cx = toCourtX(s.x);
      const cy = toCourtY(s.y);
      const px = xS(cx);
      const py = yS(cy);
      const arr: any = [px, py];
      arr.made = s.made;
      arr.value = s.value;
      return arr;
    });

    const hexbin = (d3 as any).hexbin()
      .x((d: any) => d[0])
      .y((d: any) => d[1])
      .radius(hexR)
      .extent([[0, 0], [W, H]]);

    const bins = hexbin(pts);
    const maxN = d3.max(bins, (b: any) => b.length) || 1;

    const colorRamp = (t: number) => {
      const stops = [
        [50, 100, 173],
        [122, 176, 216],
        [210, 208, 200],
        [232, 146, 106],
        [192, 57, 43],
      ];
      t = Math.max(0, Math.min(1, t));
      const i = t * (stops.length - 1);
      const a = stops[Math.floor(i)];
      const b = stops[Math.min(Math.ceil(i), stops.length - 1)];
      const f = i - Math.floor(i);
      return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`;
    };

    const ranges: Record<string, [number, number]> = {
      fgpct: [0.25, 0.65],
      freq:  [0, 1],
    };
    const [lo, hi] = ranges[this.activeMetric];

    // Apply clip path to keep hexes within sidelines
    const hexGroup = svg.append('g')
      .attr('class', 'hex-group')
      .attr('clip-path', 'url(#court-clip)');

    bins.forEach((bin: any) => {
      if (bin.length < 2) return;
      const n = bin.length;
      const made = bin.filter((d: any) => d.made).length;
      const fgp = made / n;

      const val = this.activeMetric === 'fgpct' ? fgp : n / maxN;
      const sizeFrac = 0.35 + 0.65 * (n / maxN);
      const r = hexR * sizeFrac;
      const fill = colorRamp((val - lo) / (hi - lo));

      hexGroup.append('path')
        .attr('d', (d3 as any).hexbin().radius(r).hexagon())
        .attr('transform', `translate(${bin.x},${bin.y})`)
        .attr('fill', fill)
        .attr('opacity', 0.85)
        .attr('stroke', 'none');
    });

    // Rim dot on top — outside clip group so it's always visible
    svg.append('circle')
      .attr('cx', xS(0)).attr('cy', yS(5.25))
      .attr('r', 4)
      .attr('fill', 'rgba(0,0,0,0.5)')
      .attr('pointer-events', 'none');
  }
}