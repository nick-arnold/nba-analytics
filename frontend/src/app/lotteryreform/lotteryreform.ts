import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── HISTORICAL DATA ────────────────────────────────────────────────────────

const DRAFTS: Record<number, { pick: number; team: string; player: string }[]> = {
  2004: [
    {pick:1,team:'ORL',player:'Dwight Howard'},{pick:2,team:'CHI',player:'Emeka Okafor'},
    {pick:3,team:'LAC',player:'Shaun Livingston'},{pick:4,team:'WAS',player:'Devin Harris'},
    {pick:5,team:'MIL',player:'Andrew Bogut'},{pick:6,team:'ATL',player:'Josh Childress'},
    {pick:7,team:'PHX',player:'Luol Deng'},{pick:8,team:'TOR',player:'Rafael Araujo'},
    {pick:9,team:'CLE',player:'Luke Jackson'},{pick:10,team:'CLE',player:'Donta Smith'},
    {pick:11,team:'LAL',player:'Sasha Vujacic'},{pick:12,team:'SAC',player:'Kevin Martin'},
    {pick:13,team:'POR',player:'Viktor Khryapa'},{pick:14,team:'UTA',player:'Kirk Snyder'},
  ],
  2005: [
    {pick:1,team:'MIL',player:'Andrew Bogut'},{pick:2,team:'ATL',player:'Marvin Williams'},
    {pick:3,team:'UTA',player:'Deron Williams'},{pick:4,team:'NO',player:'Chris Paul'},
    {pick:5,team:'CHI',player:'Andrew Bynum'},{pick:6,team:'POR',player:'Martell Webster'},
    {pick:7,team:'SEA',player:'Johan Petro'},{pick:8,team:'NYK',player:'Channing Frye'},
    {pick:9,team:'TOR',player:'Charlie Villanueva'},{pick:10,team:'BOS',player:'Gerald Green'},
    {pick:11,team:'IND',player:'Danny Granger'},{pick:12,team:'NYK',player:'David Lee'},
    {pick:13,team:'PHX',player:'Nate Robinson'},{pick:14,team:'LAC',player:'Yaroslav Korolev'},
  ],
  2006: [
    {pick:1,team:'TOR',player:'Andrea Bargnani'},{pick:2,team:'CHI',player:'LaMarcus Aldridge'},
    {pick:3,team:'CHA',player:'Adam Morrison'},{pick:4,team:'POR',player:'Tyrus Thomas'},
    {pick:5,team:'ATL',player:'Shelden Williams'},{pick:6,team:'MIN',player:'Brandon Roy'},
    {pick:7,team:'BOS',player:'Randy Foye'},{pick:8,team:'HOU',player:'Rudy Gay'},
    {pick:9,team:'GSW',player:"Patrick O'Bryant"},{pick:10,team:'SEA',player:'Kyle Lowry'},
    {pick:11,team:'ORL',player:'J.J. Redick'},{pick:12,team:'NYK',player:'Rodney Carney'},
    {pick:13,team:'PHX',player:'Jordan Farmar'},{pick:14,team:'PHI',player:'Thabo Sefolosha'},
  ],
  2007: [
    {pick:1,team:'POR',player:'Greg Oden'},{pick:2,team:'SEA',player:'Kevin Durant'},
    {pick:3,team:'ATL',player:'Al Horford'},{pick:4,team:'MEM',player:'Mike Conley'},
    {pick:5,team:'BOS',player:'Jeff Green'},{pick:6,team:'MIL',player:'Yi Jianlian'},
    {pick:7,team:'MIN',player:'Corey Brewer'},{pick:8,team:'NYK',player:'Wilson Chandler'},
    {pick:9,team:'CHI',player:'Joakim Noah'},{pick:10,team:'SAC',player:'Spencer Hawes'},
    {pick:11,team:'IND',player:'Rodney Stuckey'},{pick:12,team:'PHX',player:'Marco Belinelli'},
    {pick:13,team:'NO',player:'Julian Wright'},{pick:14,team:'LAC',player:'Al Thornton'},
  ],
  2008: [
    {pick:1,team:'CHI',player:'Derrick Rose'},{pick:2,team:'MIA',player:'Michael Beasley'},
    {pick:3,team:'MIN',player:'O.J. Mayo'},{pick:4,team:'SEA',player:'Russell Westbrook'},
    {pick:5,team:'MEM',player:'Kevin Love'},{pick:6,team:'NYK',player:'Danilo Gallinari'},
    {pick:7,team:'LAC',player:'Eric Gordon'},{pick:8,team:'MIL',player:'Joe Alexander'},
    {pick:9,team:'NJN',player:'Brook Lopez'},{pick:10,team:'NJN',player:'Robin Lopez'},
    {pick:11,team:'IND',player:'D.J. Augustin'},{pick:12,team:'SAC',player:'Jason Thompson'},
    {pick:13,team:'PHX',player:'Marreese Speights'},{pick:14,team:'WAS',player:'JaVale McGee'},
  ],
  2009: [
    {pick:1,team:'LAC',player:'Blake Griffin'},{pick:2,team:'MEM',player:'Hasheem Thabeet'},
    {pick:3,team:'OKC',player:'James Harden'},{pick:4,team:'SAC',player:'Tyreke Evans'},
    {pick:5,team:'MIN',player:'Ricky Rubio'},{pick:6,team:'MIN',player:'Jonny Flynn'},
    {pick:7,team:'GSW',player:'Stephen Curry'},{pick:8,team:'NYK',player:'Jordan Hill'},
    {pick:9,team:'TOR',player:'DeMar DeRozan'},{pick:10,team:'MIL',player:'Brandon Jennings'},
    {pick:11,team:'NJN',player:'Terrence Williams'},{pick:12,team:'CHA',player:'Gerald Henderson'},
    {pick:13,team:'IND',player:'Tyler Hansbrough'},{pick:14,team:'PHX',player:'Earl Clark'},
  ],
  2010: [
    {pick:1,team:'WSH',player:'John Wall'},{pick:2,team:'PHI',player:'Evan Turner'},
    {pick:3,team:'NJN',player:'Derrick Favors'},{pick:4,team:'MIN',player:'Wesley Johnson'},
    {pick:5,team:'SAC',player:'DeMarcus Cousins'},{pick:6,team:'GSW',player:'Ekpe Udoh'},
    {pick:7,team:'DET',player:'Greg Monroe'},{pick:8,team:'LAC',player:'Al-Farouq Aminu'},
    {pick:9,team:'UTA',player:'Gordon Hayward'},{pick:10,team:'IND',player:'Paul George'},
    {pick:11,team:'NO',player:'Eric Gordon'},{pick:12,team:'MEM',player:'Xavier Henry'},
    {pick:13,team:'TOR',player:'Ed Davis'},{pick:14,team:'HOU',player:'Patrick Patterson'},
  ],
  2011: [
    {pick:1,team:'CLE',player:'Kyrie Irving'},{pick:2,team:'MIN',player:'Derrick Williams'},
    {pick:3,team:'UTA',player:'Enes Kanter'},{pick:4,team:'CLE',player:'Tristan Thompson'},
    {pick:5,team:'TOR',player:'Jonas Valanciunas'},{pick:6,team:'WSH',player:'Jan Vesely'},
    {pick:7,team:'SAC',player:'Bismack Biyombo'},{pick:8,team:'DET',player:'Brandon Knight'},
    {pick:9,team:'CHA',player:'Kemba Walker'},{pick:10,team:'MIL',player:'Jimmer Fredette'},
    {pick:11,team:'GSW',player:'Klay Thompson'},{pick:12,team:'UTA',player:'Alec Burks'},
    {pick:13,team:'PHX',player:'Markieff Morris'},{pick:14,team:'HOU',player:'Marcus Morris'},
  ],
  2012: [
    {pick:1,team:'NO',player:'Anthony Davis'},{pick:2,team:'CHA',player:'Michael Kidd-Gilchrist'},
    {pick:3,team:'WSH',player:'Bradley Beal'},{pick:4,team:'CLE',player:'Dion Waiters'},
    {pick:5,team:'SAC',player:'Thomas Robinson'},{pick:6,team:'POR',player:'Damian Lillard'},
    {pick:7,team:'GSW',player:'Harrison Barnes'},{pick:8,team:'TOR',player:'Terrence Ross'},
    {pick:9,team:'DET',player:'Andre Drummond'},{pick:10,team:'NO',player:'Austin Rivers'},
    {pick:11,team:'POR',player:'Meyers Leonard'},{pick:12,team:'HOU',player:'Jeremy Lamb'},
    {pick:13,team:'PHX',player:'Kendall Marshall'},{pick:14,team:'MIL',player:'John Henson'},
  ],
  2013: [
    {pick:1,team:'CLE',player:'Anthony Bennett'},{pick:2,team:'ORL',player:'Victor Oladipo'},
    {pick:3,team:'WSH',player:'Otto Porter'},{pick:4,team:'CHA',player:'Cody Zeller'},
    {pick:5,team:'PHX',player:'Alex Len'},{pick:6,team:'NO',player:'Nerlens Noel'},
    {pick:7,team:'SAC',player:'Ben McLemore'},{pick:8,team:'DET',player:'Kentavious Caldwell-Pope'},
    {pick:9,team:'MIN',player:'Trey Burke'},{pick:10,team:'POR',player:'CJ McCollum'},
    {pick:11,team:'PHI',player:'Michael Carter-Williams'},{pick:12,team:'OKC',player:'Steven Adams'},
    {pick:13,team:'DAL',player:'Kelly Olynyk'},{pick:14,team:'UTA',player:'Shabazz Muhammad'},
  ],
  2014: [
    {pick:1,team:'CLE',player:'Andrew Wiggins'},{pick:2,team:'MIL',player:'Jabari Parker'},
    {pick:3,team:'PHI',player:'Joel Embiid'},{pick:4,team:'ORL',player:'Aaron Gordon'},
    {pick:5,team:'UTA',player:'Dante Exum'},{pick:6,team:'BOS',player:'Marcus Smart'},
    {pick:7,team:'LAL',player:'Julius Randle'},{pick:8,team:'SAC',player:'Nik Stauskas'},
    {pick:9,team:'CHA',player:'Noah Vonleh'},{pick:10,team:'ORL',player:'Elfrid Payton'},
    {pick:11,team:'DEN',player:'Gary Harris'},{pick:12,team:'NYK',player:'Cleanthony Early'},
    {pick:13,team:'MIN',player:'Zach LaVine'},{pick:14,team:'PHX',player:'T.J. Warren'},
  ],
  2015: [
    {pick:1,team:'MIN',player:'Karl-Anthony Towns'},{pick:2,team:'LAL',player:"D'Angelo Russell"},
    {pick:3,team:'PHI',player:'Jahlil Okafor'},{pick:4,team:'NYK',player:'Kristaps Porzingis'},
    {pick:5,team:'ORL',player:'Mario Hezonja'},{pick:6,team:'SAC',player:'Willie Cauley-Stein'},
    {pick:7,team:'DEN',player:'Emmanuel Mudiay'},{pick:8,team:'DET',player:'Stanley Johnson'},
    {pick:9,team:'CHA',player:'Frank Kaminsky'},{pick:10,team:'MIA',player:'Justise Winslow'},
    {pick:11,team:'IND',player:'Myles Turner'},{pick:12,team:'UTA',player:'Trey Lyles'},
    {pick:13,team:'PHX',player:'Devin Booker'},{pick:14,team:'OKC',player:'Cameron Payne'},
  ],
  2016: [
    {pick:1,team:'PHI',player:'Ben Simmons'},{pick:2,team:'LAL',player:'Brandon Ingram'},
    {pick:3,team:'BOS',player:'Jaylen Brown'},{pick:4,team:'PHX',player:'Dragan Bender'},
    {pick:5,team:'MIN',player:'Kris Dunn'},{pick:6,team:'NO',player:'Buddy Hield'},
    {pick:7,team:'DEN',player:'Jamal Murray'},{pick:8,team:'SAC',player:'Marquese Chriss'},
    {pick:9,team:'TOR',player:'Jakob Poeltl'},{pick:10,team:'MIL',player:'Thon Maker'},
    {pick:11,team:'ORL',player:'Domantas Sabonis'},{pick:12,team:'UTA',player:'Trey Lyles'},
    {pick:13,team:'PHX',player:'Tyler Ulis'},{pick:14,team:'CHI',player:'Denzel Valentine'},
  ],
  2017: [
    {pick:1,team:'PHI',player:'Markelle Fultz'},{pick:2,team:'LAL',player:'Lonzo Ball'},
    {pick:3,team:'BOS',player:'Jayson Tatum'},{pick:4,team:'PHX',player:'Josh Jackson'},
    {pick:5,team:'SAC',player:"De'Aaron Fox"},{pick:6,team:'ORL',player:'Jonathan Isaac'},
    {pick:7,team:'MIN',player:'Lauri Markkanen'},{pick:8,team:'NYK',player:'Frank Ntilikina'},
    {pick:9,team:'DAL',player:'Dennis Smith'},{pick:10,team:'POR',player:'Zach Collins'},
    {pick:11,team:'CHI',player:'Lauri Markkanen'},{pick:12,team:'CHI',player:'Justin Patton'},
    {pick:13,team:'DEN',player:'Tyler Lydon'},{pick:14,team:'MIA',player:'Bam Adebayo'},
  ],
  2018: [
    {pick:1,team:'PHX',player:'Deandre Ayton'},{pick:2,team:'SAC',player:'Marvin Bagley'},
    {pick:3,team:'ATL',player:'Luka Doncic'},{pick:4,team:'MEM',player:'Jaren Jackson Jr.'},
    {pick:5,team:'DAL',player:'Trae Young'},{pick:6,team:'ORL',player:'Mohamed Bamba'},
    {pick:7,team:'CHI',player:'Wendell Carter'},{pick:8,team:'CLE',player:'Collin Sexton'},
    {pick:9,team:'NYK',player:'Kevin Knox'},{pick:10,team:'PHX',player:'Mikal Bridges'},
    {pick:11,team:'CHA',player:'Shai Gilgeous-Alexander'},{pick:12,team:'LAC',player:'Miles Bridges'},
    {pick:13,team:'LAC',player:'Jerome Robinson'},{pick:14,team:'DEN',player:'Michael Porter Jr.'},
  ],
  2019: [
    {pick:1,team:'NO',player:'Zion Williamson'},{pick:2,team:'MEM',player:'Ja Morant'},
    {pick:3,team:'NYK',player:'R.J. Barrett'},{pick:4,team:'ATL',player:"De'Andre Hunter"},
    {pick:5,team:'CLE',player:'Darius Garland'},{pick:6,team:'MIN',player:'Jarrett Culver'},
    {pick:7,team:'CHI',player:'Coby White'},{pick:8,team:'NO',player:'Jaxson Hayes'},
    {pick:9,team:'WSH',player:'Rui Hachimura'},{pick:10,team:'ATL',player:'Cam Reddish'},
    {pick:11,team:'MIN',player:'Naz Reid'},{pick:12,team:'CHA',player:'P.J. Washington'},
    {pick:13,team:'MIA',player:'Tyler Herro'},{pick:14,team:'BOS',player:'Romeo Langford'},
  ],
  2020: [
    {pick:1,team:'MIN',player:'Anthony Edwards'},{pick:2,team:'GSW',player:'James Wiseman'},
    {pick:3,team:'CHA',player:'LaMelo Ball'},{pick:4,team:'CHI',player:'Patrick Williams'},
    {pick:5,team:'CLE',player:'Isaac Okoro'},{pick:6,team:'ATL',player:'Onyeka Okongwu'},
    {pick:7,team:'DET',player:'Killian Hayes'},{pick:8,team:'NYK',player:'Obi Toppin'},
    {pick:9,team:'WSH',player:'Deni Avdija'},{pick:10,team:'PHX',player:'Jalen Smith'},
    {pick:11,team:'SAC',player:'Tyrese Haliburton'},{pick:12,team:'SAS',player:'Devin Vassell'},
    {pick:13,team:'NOP',player:'Kira Lewis Jr.'},{pick:14,team:'BOS',player:'Aaron Nesmith'},
  ],
  2021: [
    {pick:1,team:'DET',player:'Cade Cunningham'},{pick:2,team:'HOU',player:'Jalen Green'},
    {pick:3,team:'CLE',player:'Evan Mobley'},{pick:4,team:'TOR',player:'Scottie Barnes'},
    {pick:5,team:'ORL',player:'Jalen Suggs'},{pick:6,team:'OKC',player:'Josh Giddey'},
    {pick:7,team:'GSW',player:'Jonathan Kuminga'},{pick:8,team:'ORL',player:'Franz Wagner'},
    {pick:9,team:'SAC',player:'Davion Mitchell'},{pick:10,team:'MEM',player:'Ziaire Williams'},
    {pick:11,team:'SAS',player:'Joe Wieskamp'},{pick:12,team:'OKC',player:'Tre Mann'},
    {pick:13,team:'IND',player:'Chris Duarte'},{pick:14,team:'GSW',player:'Moses Moody'},
  ],
  2022: [
    {pick:1,team:'ORL',player:'Paolo Banchero'},{pick:2,team:'OKC',player:'Chet Holmgren'},
    {pick:3,team:'HOU',player:'Jabari Smith'},{pick:4,team:'SAC',player:'Keegan Murray'},
    {pick:5,team:'DET',player:'Jaden Ivey'},{pick:6,team:'IND',player:'Bennedict Mathurin'},
    {pick:7,team:'POR',player:'Shaedon Sharpe'},{pick:8,team:'NOP',player:'Dyson Daniels'},
    {pick:9,team:'SAS',player:'Jeremy Sochan'},{pick:10,team:'WSH',player:'Johnny Davis'},
    {pick:11,team:'NYK',player:'Ousmane Dieng'},{pick:12,team:'OKC',player:'Jalen Williams'},
    {pick:13,team:'CHO',player:'Mark Williams'},{pick:14,team:'CLE',player:'Ochai Agbaji'},
  ],
  2023: [
    {pick:1,team:'SAS',player:'Victor Wembanyama'},{pick:2,team:'CHA',player:'Brandon Miller'},
    {pick:3,team:'POR',player:'Scoot Henderson'},{pick:4,team:'HOU',player:'Amen Thompson'},
    {pick:5,team:'DET',player:'Ausar Thompson'},{pick:6,team:'ORL',player:'Anthony Black'},
    {pick:7,team:'IND',player:'Jarace Walker'},{pick:8,team:'WSH',player:'Bilal Coulibaly'},
    {pick:9,team:'UTA',player:'Taylor Hendricks'},{pick:10,team:'OKC',player:'Cason Wallace'},
    {pick:11,team:'CHI',player:'Julian Phillips'},{pick:12,team:'OKC',player:'Ousmane Dieng'},
    {pick:13,team:'TOR',player:'Gradey Dick'},{pick:14,team:'NOP',player:'Jordan Hawkins'},
  ],
  2024: [
    {pick:1,team:'ATL',player:'Zaccharie Risacher'},{pick:2,team:'WSH',player:'Alexandre Sarr'},
    {pick:3,team:'HOU',player:'Reed Sheppard'},{pick:4,team:'SAS',player:'Stephon Castle'},
    {pick:5,team:'DET',player:'Ron Holland'},{pick:6,team:'CHA',player:'Tidjane Salaun'},
    {pick:7,team:'POR',player:'Donovan Clingan'},{pick:8,team:'MIN',player:'Rob Dillingham'},
    {pick:9,team:'MEM',player:'Zach Edey'},{pick:10,team:'UTA',player:'Cody Williams'},
    {pick:11,team:'CHI',player:'Matas Buzelis'},{pick:12,team:'OKC',player:'Isaiah Collier'},
    {pick:13,team:'SAC',player:'Nikola Topic'},{pick:14,team:'NOP',player:'Bub Carrington'},
  ],
  2025: [
    {pick:1,team:'DAL',player:'Cooper Flagg'},{pick:2,team:'SAS',player:'Dylan Harper'},
    {pick:3,team:'PHI',player:'V.J. Edgecombe'},{pick:4,team:'CHA',player:'Kon Knueppel'},
    {pick:5,team:'UTA',player:'Ace Bailey'},{pick:6,team:'WSH',player:'Tre Johnson'},
    {pick:7,team:'NOP',player:'Jeremiah Fears'},{pick:8,team:'BKN',player:'Egor Demin'},
    {pick:9,team:'TOR',player:'Collin Murray-Boyles'},{pick:10,team:'PHX',player:'Khaman Maluach'},
    {pick:11,team:'POR',player:'Cedric Coward'},{pick:12,team:'CHI',player:'Noa Essengue'},
    {pick:13,team:'SAC',player:'Derik Queen'},{pick:14,team:'SAS',player:'Carter Bryant'},
  ],
};

const TEAM_SEASONS: Record<string, { wins: number; playoff: boolean }> = {
  'PHI-2014': {wins:19,playoff:false}, 'PHI-2015': {wins:18,playoff:false},
  'PHI-2016': {wins:10,playoff:false}, 'PHI-2017': {wins:28,playoff:false},
  'PHI-2018': {wins:52,playoff:true},
  'CLE-2011': {wins:19,playoff:false}, 'CLE-2012': {wins:21,playoff:false},
  'CLE-2013': {wins:24,playoff:false}, 'CLE-2014': {wins:33,playoff:false},
  'OKC-2009': {wins:23,playoff:false}, 'OKC-2010': {wins:50,playoff:true},
  'MIN-2014': {wins:40,playoff:false}, 'MIN-2015': {wins:16,playoff:false},
  'MIN-2016': {wins:29,playoff:false}, 'MIN-2017': {wins:31,playoff:false},
  'NO-2012':  {wins:21,playoff:false}, 'CHA-2012': {wins:7,playoff:false},
  'SAC-2012': {wins:22,playoff:false},
};

const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  ATL: { primary: '#C8102E', secondary: '#FDB827' },
  BOS: { primary: '#007A33', secondary: '#BA9653' },
  BKN: { primary: '#000000', secondary: '#FFFFFF' },
  NJN: { primary: '#003DA5', secondary: '#C8102E' },
  CHA: { primary: '#1D1160', secondary: '#00788C' },
  CHO: { primary: '#1D1160', secondary: '#00788C' },
  CHI: { primary: '#CE1141', secondary: '#000000' },
  CLE: { primary: '#860038', secondary: '#FDBB30' },
  DAL: { primary: '#00538C', secondary: '#002B5E' },
  DEN: { primary: '#0E2240', secondary: '#FEC524' },
  DET: { primary: '#C8102E', secondary: '#1D42BA' },
  GSW: { primary: '#1D428A', secondary: '#FFC72C' },
  HOU: { primary: '#CE1141', secondary: '#000000' },
  IND: { primary: '#002D62', secondary: '#FDBB30' },
  LAC: { primary: '#C8102E', secondary: '#1D428A' },
  LAL: { primary: '#552583', secondary: '#FDB927' },
  MEM: { primary: '#5D76A9', secondary: '#12173F' },
  MIA: { primary: '#98002E', secondary: '#F9A01B' },
  MIL: { primary: '#00471B', secondary: '#EEE1C6' },
  MIN: { primary: '#0C2340', secondary: '#236192' },
  NO:  { primary: '#0C2340', secondary: '#C8102E' },
  NOP: { primary: '#0C2340', secondary: '#C8102E' },
  NYK: { primary: '#006BB6', secondary: '#F58426' },
  OKC: { primary: '#007AC1', secondary: '#EF3B24' },
  SEA: { primary: '#00653A', secondary: '#FFC200' },
  ORL: { primary: '#0077C0', secondary: '#C4CED4' },
  PHI: { primary: '#006BB6', secondary: '#ED174C' },
  PHX: { primary: '#1D1160', secondary: '#E56020' },
  POR: { primary: '#E03A3E', secondary: '#000000' },
  SAC: { primary: '#5A2D81', secondary: '#63727A' },
  SAS: { primary: '#C4CED4', secondary: '#000000' },
  TOR: { primary: '#CE1141', secondary: '#000000' },
  UTA: { primary: '#002B5C', secondary: '#00471B' },
  WAS: { primary: '#002B5C', secondary: '#E31837' },
  WSH: { primary: '#002B5C', secondary: '#E31837' },
};



interface SimPick {
  pick: number;
  team: string;
  player: string;
  actualPick: number;
  status: 'top4' | 'normal' | 'second-lottery';
  blocked: boolean;
  blockReason: 'consec' | 'cap' | null;
}

interface LotteryEntry {
  team: string;
  actualPick: number;
  player: string;
  wins: number;
  blocked: boolean;
  blockReason: 'consec' | 'cap' | null;
}

interface YearResult {
  actual: { pick: number; team: string; player: string }[];
  simulated: SimPick[];
  blocked: string[];
  lotteryTeams: LotteryEntry[];
}

interface TeamHistory {
  top2Years: number[];
  top4Years: number[];
  thresholdYears: Record<number, number[]>;
}

interface BlockedCard {
  team: string;
  blockReason: 'consec' | 'cap';
  actualPick: number;
  simPick: number | null;
  reason: string;
  historyStr: string;
}

// Merged row for unified comparison table
interface MergedRow {
  pick: number;
  player: string;
  actualTeam: string;
  simTeam: string;
  teamsMatch: boolean;
  isTop4: boolean;
  simBlocked: boolean;
  simBlockReason: 'consec' | 'cap' | null;
  simStatus: 'top4' | 'normal' | 'second-lottery';
  delta: number; // positive = moved up (sim pick < actual pick)
}

@Component({
  selector: 'app-lotteryreform',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lotteryreform.html',
  styleUrl: './lotteryreform.scss',
})
export class LotteryReformComponent {

  // ─── CONFIG ───────────────────────────────────────────────────────────────

  lottery: 'flat' | 'weighted' = 'flat';
  consecutive = true;
  capThreshold = 4;
  second: 'flat' | 'weighted' = 'flat';
  startYear = 2012;
  rollSeed = Math.floor(Math.random() * 1000000);

  readonly startYearOptions = [2004,2005,2006,2007,2008,2009,2010,2011,2012,
                               2013,2014,2015,2016,2017,2018,2019,2020,2021,
                               2022,2023,2024,2025];

  // All teams that appear in the draft data (current + historical abbreviations)
  readonly allTeams = [
    'ATL','BOS','BKN','NJN','CHA','CHO','CHI','CLE','DAL','DEN',
    'DET','GSW','HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN',
    'NO','NOP','NYK','OKC','SEA','ORL','PHI','PHX','POR','SAC',
    'SAS','TOR','UTA','WAS','WSH',
  ];

  // ─── STATE ────────────────────────────────────────────────────────────────

  simResults: { results: Record<number, YearResult>; years: number[]; teamHistory: Record<string, TeamHistory> } | null = null;
  selectedYear: number | null = null;
  selectedTeam: string | null = null;

  statBlocked = 0;
  statSecond = 0;
  statRedist = 0;
  statYears = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  // ─── DERIVED GETTERS ──────────────────────────────────────────────────────

  get years(): number[] {
    return this.simResults?.years ?? [];
  }

  get yearsWithBlocked(): Set<number> {
    if (!this.simResults) return new Set();
    return new Set(this.years.filter(y => this.simResults!.results[y].blocked.length > 0));
  }

  get displayTeams(): string[] {
    if (!this.simResults) return [];
    const allTeamsInData = new Set(
      this.years.flatMap(y => this.simResults!.results[y].actual.map(p => p.team))
    );
    return this.allTeams.filter(t => allTeamsInData.has(t));
  }

  get selectedResult(): YearResult | null {
    if (!this.simResults || !this.selectedYear) return null;
    return this.simResults.results[this.selectedYear] ?? null;
  }

  get mergedRows(): MergedRow[] {
    const r = this.selectedResult;
    if (!r) return [];
    return r.actual.map(actualPick => {
      const simPick = r.simulated.find(s => s.pick === actualPick.pick)!;
      return {
        pick: actualPick.pick,
        player: actualPick.player, // player is slot-anchored (BPA)
        actualTeam: actualPick.team,
        simTeam: simPick?.team ?? '—',
        teamsMatch: actualPick.team === simPick?.team,
        isTop4: actualPick.pick <= 4,
        simBlocked: simPick?.blocked ?? false,
        simBlockReason: simPick?.blockReason ?? null,
        simStatus: simPick?.status ?? 'normal',
        // positive delta = sim team moved up to this slot (got a better pick)
        // we show this from the sim team's perspective
        delta: simPick ? simPick.actualPick - simPick.pick : 0,
      };
    });
  }

  get blockedCards(): BlockedCard[] {
    const r = this.selectedResult;
    if (!r || !this.simResults) return [];
    return r.blocked.map(team => {
      const bt = r.lotteryTeams.find(lt => lt.team === team)!;
      const simEntry = r.simulated.find(s => s.team === team);
      const reason = bt.blockReason === 'consec' ? 'Consecutive top-2' : `Top-${this.capThreshold} cap (4yr)`;
      const recentYears = this.years.filter(y => y < this.selectedYear! && y >= this.selectedYear! - 4);
      const historyStr = recentYears.map(y => {
        const entry = this.simResults!.results[y]?.simulated.find(s => s.team === team);
        return entry ? `'${String(y).slice(2)}:#${entry.pick}` : null;
      }).filter(Boolean).join('  ');
      return {
        team,
        blockReason: bt.blockReason!,
        actualPick: bt.actualPick,
        simPick: simEntry?.pick ?? null,
        reason,
        historyStr,
      };
    });
  }

  get timelineYears(): { year: number; simPick: SimPick | null; actualPick: number | null; isBlocked: boolean; delta: number | null }[] {
    if (!this.simResults || !this.selectedTeam) return [];
    return this.years.map(y => {
      const r = this.simResults!.results[y];
      const simPick = r.simulated.find(p => p.team === this.selectedTeam!) ?? null;
      const actualEntry = r.actual.find(p => p.team === this.selectedTeam!);
      const actualPick = actualEntry?.pick ?? null;
      const isBlocked = r.blocked.includes(this.selectedTeam!);
      const delta = simPick && actualPick ? simPick.pick - actualPick : null;
      return { year: y, simPick, actualPick, isBlocked, delta };
    });
  }

  teamHasBlocked(team: string): boolean {
    return this.years.some(y => this.simResults?.results[y]?.blocked.includes(team));
  }

  // ─── SIMULATION ENGINE ────────────────────────────────────────────────────

  runSim(): void {
    const years = (Object.keys(DRAFTS) as unknown as number[])
      .map(Number)
      .filter(y => y >= this.startYear)
      .sort((a, b) => a - b);

    const teamHistory: Record<string, TeamHistory> = {};

    const getHistory = (team: string): TeamHistory => {
      if (!teamHistory[team]) {
        teamHistory[team] = { top2Years: [], top4Years: [], thresholdYears: { 3: [], 4: [], 5: [] } };
      }
      return teamHistory[team];
    };

    const estimateWins = (pickNum: number, year: number): number => {
      const key = `${DRAFTS[year][pickNum - 1]?.team}-${year}`;
      if (TEAM_SEASONS[key]) return TEAM_SEASONS[key].wins;
      return Math.round(17 + (pickNum - 1) * (22 / 13));
    };

    const seededShuffle = <T>(arr: T[], seed: number): T[] => {
      const a = [...arr];
      let s = seed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const results: Record<number, YearResult> = {};

    for (const year of years) {
      const actualDraft = DRAFTS[year];
      const lotteryTeams: LotteryEntry[] = actualDraft.slice(0, 14).map((p, i) => ({
        team: p.team,
        actualPick: p.pick,
        player: p.player,
        wins: estimateWins(i + 1, year),
        blocked: false,
        blockReason: null,
      }));

      const protectedRange = this.capThreshold > 0 ? this.capThreshold : 4;
      const blocked: LotteryEntry[] = [];

      for (const lt of lotteryTeams) {
        const h = getHistory(lt.team);
        let isBlocked = false;
        let blockReason: 'consec' | 'cap' | null = null;

        if (this.consecutive && h.top2Years.includes(year - 1)) {
          isBlocked = true;
          blockReason = 'consec';
        }
        if (this.capThreshold > 0 && !isBlocked) {
          const windowPicks = (h.thresholdYears[this.capThreshold] || []).filter(y => y >= year - 4 && y < year);
          if (windowPicks.length >= 2) {
            isBlocked = true;
            blockReason = 'cap';
          }
        }
        if (isBlocked && lt.actualPick > protectedRange) {
          const teamPickCount = lotteryTeams.filter(t => t.team === lt.team).length;
          if (teamPickCount > 1) {
            isBlocked = false;
            blockReason = null;
          }
        }

        lt.blocked = isBlocked;
        lt.blockReason = blockReason;
        if (isBlocked) blocked.push(lt);
      }

      const eligible = lotteryTeams.filter(lt => !lt.blocked);
      const isBaseYear = year === years[0];

      // First lottery — use actual order in base year, shuffle in all subsequent years
      const shuffledEligible = isBaseYear ? eligible : seededShuffle(eligible, this.rollSeed + year);
      const top4 = shuffledEligible.slice(0, 4);
      const remainingEligible = shuffledEligible.slice(4);

      const simDraft: SimPick[] = [];

      for (let i = 0; i < top4.length; i++) {
        const entry = top4[i];
        simDraft.push({ pick: i + 1, team: entry.team, player: entry.player, actualPick: entry.actualPick, status: 'top4', blocked: false, blockReason: null });
      }

      const secondPool: (LotteryEntry & { blocked: boolean })[] = [
        ...remainingEligible.map(e => ({ ...e, blocked: false })),
        ...blocked,
      ];

      let secondOrdered: typeof secondPool;
      if (isBaseYear || blocked.length === 0) {
        secondOrdered = isBaseYear ? secondPool : seededShuffle(secondPool, this.rollSeed + year + 1);
      } else if (this.second === 'weighted') {
        secondOrdered = [
          ...seededShuffle(secondPool.filter(e => !e.blocked), this.rollSeed + year * 7),
          ...seededShuffle(secondPool.filter(e => e.blocked), this.rollSeed + year * 13),
        ];
      } else {
        secondOrdered = seededShuffle(secondPool, this.rollSeed + year * 31);
      }

      secondOrdered.forEach((entry, i) => {
        simDraft.push({
          pick: 5 + i, team: entry.team, player: entry.player,
          actualPick: entry.actualPick,
          status: entry.blocked ? 'second-lottery' : 'normal',
          blocked: entry.blocked, blockReason: entry.blockReason ?? null,
        });
      });

      simDraft.sort((a, b) => a.pick - b.pick);

      for (const sd of simDraft) {
        const slotPlayer = DRAFTS[year][sd.pick - 1];
        sd.player = slotPlayer ? slotPlayer.player : '—';
      }

      results[year] = {
        actual: actualDraft.slice(0, 14),
        simulated: simDraft,
        blocked: [...new Set(blocked.map(b => b.team))],
        lotteryTeams,
      };

      const updatedTeams = new Set<string>();
      for (const sd of simDraft) {
        if (updatedTeams.has(sd.team)) continue;
        updatedTeams.add(sd.team);
        const h = getHistory(sd.team);
        if (sd.pick <= 2) h.top2Years.push(year);
        if (sd.pick <= 4) h.top4Years.push(year);
        if (sd.pick <= 3) h.thresholdYears[3].push(year);
        if (sd.pick <= 4) h.thresholdYears[4].push(year);
        if (sd.pick <= 5) h.thresholdYears[5].push(year);
      }
    }

    this.simResults = { results, years, teamHistory };
    this.statBlocked = years.reduce((s, y) => s + results[y].blocked.length, 0);
    this.statSecond  = years.filter(y => results[y].blocked.length > 0).length;
    this.statRedist  = this.statBlocked;
    this.statYears   = years.length;
    this.selectedYear = years[0];
    this.selectedTeam = null;
    this.cdr.detectChanges();
  }

  // ─── UI ACTIONS ───────────────────────────────────────────────────────────

  selectYear(y: number): void {
    this.selectedYear = y;
  }

  selectTeam(t: string): void {
    this.selectedTeam = this.selectedTeam === t ? null : t;
  }

  reroll(): void {
    this.rollSeed = Math.floor(Math.random() * 1000000);
    this.runSim();
  }

  // ─── TEMPLATE HELPERS ─────────────────────────────────────────────────────

  mergedRowClass(row: MergedRow): string {
    if (row.simBlocked) return 'blocked-pick';
    if (row.simStatus === 'second-lottery') return 'second-lottery';
    if (row.isTop4) return 'top4';
    return '';
  }

  teamColor(abbr: string): string {
    return TEAM_COLORS[abbr]?.primary ?? '#6c757d';
  }

  teamTextColor(abbr: string): string {
    // SAS has a light primary — use dark text
    const lightTeams = ['SAS'];
    return lightTeams.includes(abbr) ? '#212529' : '#ffffff';
  }

  tlPickClass(ty: { simPick: SimPick | null; isBlocked: boolean }): string {
    if (!ty.simPick) return 'tl-pick pick-playoff';
    if (ty.isBlocked) return 'tl-pick pick-blocked';
    if (ty.simPick.pick <= 4) return 'tl-pick pick-top4';
    if (ty.simPick.status === 'second-lottery') return 'tl-pick pick-second';
    return 'tl-pick pick-none';
  }

  shortYear(y: number): string {
    return `'${String(y).slice(2)}`;
  }
}