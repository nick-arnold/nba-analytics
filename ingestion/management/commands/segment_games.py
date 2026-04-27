from django.core.management.base import BaseCommand
from games.models import Game, Team
from stats.models import PlayByPlay, GameSegment, GameKeyEvent


# ── Configuration ─────────────────────────────────────────────────────────────

LEAD_CHANGE_THRESHOLD = 2
RUN_NET_DIFF = 8          # score must swing by this many points to be a RUN
RUN_MAX_DIFF = 12         # large sustained lead = RUN even without net swing
BLOWOUT_THRESHOLD = 17    # final segment only: large lead = BLOWOUT
MERGE_MAX_DIFF = 10
MIN_SEGMENT_POINTS = 4


# ── Helpers ───────────────────────────────────────────────────────────────────

def count_lead_changes(plays, game):
    lead_changes = 0
    prev_leader = None
    for p in plays:
        diff = p.home_score - p.away_score
        leader = 1 if diff > 0 else (-1 if diff < 0 else 0)
        if prev_leader is not None and leader != 0 and prev_leader != 0 and leader != prev_leader:
            lead_changes += 1
        if leader != 0:
            prev_leader = leader
    return lead_changes


def classify(plays, game, is_final_segment=False):
    if not plays:
        return 'TIGHT', None, None

    home_pts = sum(p.score_value or 0 for p in plays if p.team_id == game.home_team_id)
    away_pts = sum(p.score_value or 0 for p in plays if p.team_id == game.away_team_id)
    total_pts = home_pts + away_pts
    lead_changes = count_lead_changes(plays, game)
    max_diff = max(abs(p.home_score - p.away_score) for p in plays)

    net_diff = abs(
        (plays[-1].home_score - plays[-1].away_score) -
        (plays[0].home_score - plays[0].away_score)
    )

    start_diff = plays[0].home_score - plays[0].away_score
    end_diff = plays[-1].home_score - plays[-1].away_score
    swing = end_diff - start_diff
    dominant_team_id = game.home_team_id if swing > 0 else game.away_team_id

    if total_pts > 0:
        home_ratio = home_pts / total_pts
        away_ratio = away_pts / total_pts
        dominant_ratio = home_ratio if dominant_team_id == game.home_team_id else away_ratio
    else:
        dominant_ratio = None

    if lead_changes >= LEAD_CHANGE_THRESHOLD:
        return 'BACK_AND_FORTH', None, None

    if net_diff >= RUN_NET_DIFF:
        seg_type = 'BLOWOUT' if (is_final_segment and max_diff >= BLOWOUT_THRESHOLD) else 'RUN'
        return seg_type, dominant_ratio, dominant_team_id

    if max_diff >= RUN_MAX_DIFF:
        last_diff = plays[-1].home_score - plays[-1].away_score
        dominant_team_id = game.home_team_id if last_diff > 0 else game.away_team_id
        dominant_ratio = (home_pts / total_pts if dominant_team_id == game.home_team_id else away_pts / total_pts) if total_pts > 0 else None
        seg_type = 'BLOWOUT' if (is_final_segment and max_diff >= BLOWOUT_THRESHOLD) else 'RUN'
        return seg_type, dominant_ratio, dominant_team_id

    return 'TIGHT', None, None


def detect_key_events(plays, game):
    events = []
    prev_diff = None
    prev_leader = None
    max_diff_seen = 0

    for p in plays:
        if p.home_score is None or p.away_score is None:
            continue
        diff = p.home_score - p.away_score
        abs_diff = abs(diff)
        leader = 1 if diff > 0 else (-1 if diff < 0 else 0)

        if diff == 0 and prev_diff != 0 and prev_diff is not None:
            events.append({
                'event_type': 'TIE',
                'play_order': p.order,
                'period': p.period,
                'clock': p.clock,
                'home_score': p.home_score,
                'away_score': p.away_score,
                'differential': 0,
                'team_id': None,
            })

        if prev_leader is not None and leader != 0 and prev_leader != 0 and leader != prev_leader:
            events.append({
                'event_type': 'LEAD_CHANGE',
                'play_order': p.order,
                'period': p.period,
                'clock': p.clock,
                'home_score': p.home_score,
                'away_score': p.away_score,
                'differential': diff,
                'team_id': game.home_team_id if diff > 0 else game.away_team_id,
            })

        if abs_diff >= BLOWOUT_THRESHOLD and max_diff_seen < BLOWOUT_THRESHOLD:
            events.append({
                'event_type': 'BLOWOUT_START',
                'play_order': p.order,
                'period': p.period,
                'clock': p.clock,
                'home_score': p.home_score,
                'away_score': p.away_score,
                'differential': diff,
                'team_id': game.home_team_id if diff > 0 else game.away_team_id,
            })

        max_diff_seen = max(max_diff_seen, abs_diff)
        prev_diff = diff
        if leader != 0:
            prev_leader = leader

    return events


def initial_segments(scoring_plays, key_events):
    if not scoring_plays:
        return []

    breakpoint_orders = {scoring_plays[0].order, scoring_plays[-1].order}
    for e in key_events:
        if e['event_type'] in ('TIE', 'LEAD_CHANGE', 'BLOWOUT_START'):
            breakpoint_orders.add(e['play_order'])

    breakpoints = sorted(breakpoint_orders)

    raw = []
    for i in range(len(breakpoints) - 1):
        window = [p for p in scoring_plays
                  if breakpoints[i] <= p.order <= breakpoints[i + 1]]
        if window and sum(p.score_value or 0 for p in window) >= MIN_SEGMENT_POINTS:
            raw.append(window)
        else:
            if raw:
                raw[-1] = raw[-1] + window

    return raw


def merge_segments(raw_windows, game):
    if not raw_windows:
        return []

    merged = [raw_windows[0][:]]

    for window in raw_windows[1:]:
        prev = merged[-1]
        prev_type, _, prev_dom = classify(prev, game)
        curr_type, _, curr_dom = classify(window, game)
        prev_max = max(abs(p.home_score - p.away_score) for p in prev)
        curr_max = max(abs(p.home_score - p.away_score) for p in window)
        combined_max = max(abs(p.home_score - p.away_score) for p in prev + window)

        same_run = (
            prev_type == 'RUN' and curr_type == 'RUN'
            and prev_dom == curr_dom
            and combined_max <= BLOWOUT_THRESHOLD
        )
        same_tight = (
            prev_type in ('TIGHT', 'BACK_AND_FORTH')
            and curr_type in ('TIGHT', 'BACK_AND_FORTH')
            and prev_max <= MERGE_MAX_DIFF
            and curr_max <= MERGE_MAX_DIFF
        )
        run_into_btf = (
            prev_type in ('TIGHT', 'BACK_AND_FORTH')
            and curr_type == 'RUN'
            and curr_max <= MERGE_MAX_DIFF
        )
        btf_into_run = (
            prev_type == 'RUN'
            and curr_type in ('TIGHT', 'BACK_AND_FORTH')
            and prev_max <= MERGE_MAX_DIFF
        )

        if same_run or same_tight or run_into_btf or btf_into_run:
            merged[-1] = prev + window
        else:
            merged.append(window[:])

    return merged


def save_segments(game, final_windows, key_events, stdout):
    GameSegment.objects.filter(game=game).delete()
    GameKeyEvent.objects.filter(game=game).delete()

    team_cache = {t.id: t for t in Team.objects.all()}

    for i, window in enumerate(final_windows):
        if not window:
            continue

        is_final = (i == len(final_windows) - 1)
        seg_type, run_ratio, dominant_team_id = classify(window, game, is_final_segment=is_final)
        lead_changes = count_lead_changes(window, game)

        first = window[0]
        last = window[-1]
        diff_start = first.home_score - first.away_score
        diff_end = last.home_score - last.away_score
        diff_max = max(abs(p.home_score - p.away_score) for p in window)

        dominant_team = team_cache.get(dominant_team_id) if dominant_team_id else None

        segment = GameSegment.objects.create(
            game=game,
            sequence=i + 1,
            segment_type=seg_type,
            dominant_team=dominant_team,
            start_order=first.order,
            end_order=last.order,
            start_period=first.period,
            end_period=last.period,
            start_clock=first.clock,
            end_clock=last.clock,
            home_score_start=first.home_score,
            away_score_start=first.away_score,
            home_score_end=last.home_score,
            away_score_end=last.away_score,
            differential_start=diff_start,
            differential_end=diff_end,
            differential_max=diff_max,
            lead_change_count=lead_changes,
            run_ratio=run_ratio,
        )

        for e in key_events:
            if first.order <= e['play_order'] <= last.order:
                benefiting_team = team_cache.get(e['team_id']) if e['team_id'] else None
                GameKeyEvent.objects.create(
                    game=game,
                    segment=segment,
                    event_type=e['event_type'],
                    benefiting_team=benefiting_team,
                    play_order=e['play_order'],
                    period=e['period'],
                    clock=e['clock'],
                    home_score=e['home_score'],
                    away_score=e['away_score'],
                    differential=e['differential'],
                )

    stdout.write(f"  {game.nba_game_id} — {len(final_windows)} segments, {len(key_events)} key events saved")


# ── Command ───────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Segment games into narrative chunks based on score progression'

    def add_arguments(self, parser):
        parser.add_argument('--game-id', type=str, help='Specific nba_game_id to segment')
        parser.add_argument('--season', type=int, help='Segment all games for a season')
        parser.add_argument('--postseason', action='store_true', help='Postseason games only')
        parser.add_argument('--force', action='store_true', help='Re-segment even if segments already exist')

    def handle(self, *args, **options):
        force = options.get('force', False)

        if options['game_id']:
            games = Game.objects.filter(nba_game_id=options['game_id'])
        elif options['season']:
            season_str = f"{options['season']}-{str(options['season']+1)[-2:]}"
            games = Game.objects.filter(season=season_str, home_score__isnull=False)
            if options['postseason']:
                games = games.filter(game_type='playoff')
        else:
            self.stdout.write('Provide --game-id or --season')
            return

        # Unless --force, skip games that already have segments
        if not force:
            already_segmented = set(
                GameSegment.objects.filter(game__in=games)
                .values_list('game_id', flat=True)
                .distinct()
            )
            games = games.exclude(id__in=already_segmented)

        total = games.count()
        if total == 0:
            self.stdout.write('No new games to segment.')
            return

        self.stdout.write(f'Segmenting {total} games...')

        for game in games.select_related('home_team', 'away_team'):
            all_plays = list(PlayByPlay.objects.filter(game=game).order_by('order'))
            scoring_plays = [p for p in all_plays if p.scoring_play and p.home_score is not None]

            if not scoring_plays:
                self.stdout.write(f'  {game.nba_game_id} — no scoring plays, skipping')
                continue

            key_events = detect_key_events(all_plays, game)
            raw_windows = initial_segments(scoring_plays, key_events)
            final_windows = merge_segments(raw_windows, game)

            save_segments(game, final_windows, key_events, self.stdout)

        self.stdout.write('Done.')