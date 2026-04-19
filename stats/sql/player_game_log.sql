CREATE MATERIALIZED VIEW player_game_log AS
WITH cleaned AS (
    SELECT
        ps.id,
        ps.player_id,
        ps.team_id,
        ps.game_id,
        g.season,
        g.game_date,
        g.home_team_id,
        g.away_team_id,
        g.home_score,
        g.away_score,
        ps.minutes,
        ps.pts,
        ps.reb,
        ps.ast,
        ps.stl,
        ps.blk,
        ps.turnover,
        ps.fgm,
        ps.fga,
        ps.fg_pct,
        ps.fg3m,
        ps.fg3a,
        ps.fg3_pct,
        ps.ftm,
        ps.fta,
        ps.ft_pct,
        ps.oreb,
        ps.dreb,
        ps.pf,
        CASE
            WHEN ps.minutes IS NULL THEN 0
            WHEN ps.minutes ~ '^\d+:\d+$' THEN SPLIT_PART(ps.minutes, ':', 1)::integer
            WHEN ps.minutes ~ '^\d+$' THEN ps.minutes::integer
            ELSE 0
        END AS mins
    FROM stats_playerstat ps
    JOIN games_game g ON ps.game_id = g.id
)
SELECT
    id AS playerstat_id,
    player_id,
    team_id,
    game_id,
    season,
    game_date,
    home_team_id,
    away_team_id,
    home_score,
    away_score,
    minutes,
    pts,
    reb,
    ast,
    stl,
    blk,
    turnover,
    fgm,
    fga,
    fg_pct,
    fg3m,
    fg3a,
    fg3_pct,
    ftm,
    fta,
    ft_pct,
    oreb,
    dreb,
    pf
FROM cleaned
WHERE mins > 0
WITH DATA;

CREATE UNIQUE INDEX player_game_log_idx ON player_game_log (playerstat_id);
CREATE INDEX player_game_log_player_idx ON player_game_log (player_id);
CREATE INDEX player_game_log_team_idx ON player_game_log (team_id);
CREATE INDEX player_game_log_season_idx ON player_game_log (season);
CREATE INDEX player_game_log_date_idx ON player_game_log (game_date);