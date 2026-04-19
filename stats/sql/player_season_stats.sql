CREATE MATERIALIZED VIEW player_season_stats AS
SELECT
    ps.player_id,
    ps.team_id,
    g.season,
    COUNT(*) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0) AS gp,
    ROUND(AVG(ps.pts) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 1) AS ppg,
    ROUND(AVG(ps.reb) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 1) AS rpg,
    ROUND(AVG(ps.ast) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 1) AS apg,
    ROUND(AVG(ps.stl) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 1) AS spg,
    ROUND(AVG(ps.blk) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 1) AS bpg,
    ROUND(AVG(ps.turnover) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 1) AS topg,
    ROUND(AVG(ps.fgm::float / NULLIF(ps.fga, 0)) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 3) AS fg_pct,
    ROUND(AVG(ps.fg3m::float / NULLIF(ps.fg3a, 0)) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 3) AS fg3_pct,
    ROUND(AVG(ps.ftm::float / NULLIF(ps.fta, 0)) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0)::numeric, 3) AS ft_pct,
    SUM(ps.pts) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0) AS total_pts,
    SUM(ps.turnover) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0) AS total_tov,
    SUM(ps.reb) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0) AS total_reb,
    SUM(ps.ast) FILTER (WHERE REGEXP_REPLACE(ps.minutes, '[^0-9].*', '') ~ '^[0-9]+$'
        AND REGEXP_REPLACE(ps.minutes, '[^0-9].*', '')::integer > 0) AS total_ast
FROM stats_playerstat ps
JOIN games_game g ON ps.game_id = g.id
GROUP BY ps.player_id, ps.team_id, g.season
WITH DATA;

CREATE UNIQUE INDEX player_season_stats_idx
    ON player_season_stats (player_id, team_id, season);