CREATE MATERIALIZED VIEW player_game_log AS
SELECT
    ps.id AS playerstat_id,
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
    ps.pf
FROM stats_playerstat ps
JOIN games_game g ON ps.game_id = g.id
WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
    AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0
WITH DATA;

CREATE UNIQUE INDEX player_game_log_idx
    ON player_game_log (playerstat_id);

CREATE INDEX player_game_log_player_idx ON player_game_log (player_id);
CREATE INDEX player_game_log_team_idx ON player_game_log (team_id);
CREATE INDEX player_game_log_season_idx ON player_game_log (season);
CREATE INDEX player_game_log_date_idx ON player_game_log (game_date);