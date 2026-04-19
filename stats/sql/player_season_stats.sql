CREATE MATERIALIZED VIEW player_season_stats AS
WITH cleaned AS (
    SELECT
        ps.player_id,
        ps.team_id,
        g.season,
        ps.pts,
        ps.reb,
        ps.ast,
        ps.stl,
        ps.blk,
        ps.turnover,
        ps.fgm,
        ps.fga,
        ps.fg3m,
        ps.fg3a,
        ps.ftm,
        ps.fta,
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
    ROW_NUMBER() OVER (ORDER BY player_id, team_id, season) AS id,
    player_id,
    team_id,
    season,
    COUNT(*) FILTER (WHERE mins > 0) AS gp,
    ROUND(AVG(pts) FILTER (WHERE mins > 0)::numeric, 1) AS ppg,
    ROUND(AVG(reb) FILTER (WHERE mins > 0)::numeric, 1) AS rpg,
    ROUND(AVG(ast) FILTER (WHERE mins > 0)::numeric, 1) AS apg,
    ROUND(AVG(stl) FILTER (WHERE mins > 0)::numeric, 1) AS spg,
    ROUND(AVG(blk) FILTER (WHERE mins > 0)::numeric, 1) AS bpg,
    ROUND(AVG(turnover) FILTER (WHERE mins > 0)::numeric, 1) AS topg,
    ROUND(AVG(fgm::float / NULLIF(fga, 0)) FILTER (WHERE mins > 0)::numeric, 3) AS fg_pct,
    ROUND(AVG(fg3m::float / NULLIF(fg3a, 0)) FILTER (WHERE mins > 0)::numeric, 3) AS fg3_pct,
    ROUND(AVG(ftm::float / NULLIF(fta, 0)) FILTER (WHERE mins > 0)::numeric, 3) AS ft_pct,
    SUM(pts) FILTER (WHERE mins > 0) AS total_pts,
    SUM(turnover) FILTER (WHERE mins > 0) AS total_tov,
    SUM(reb) FILTER (WHERE mins > 0) AS total_reb,
    SUM(ast) FILTER (WHERE mins > 0) AS total_ast
FROM cleaned
GROUP BY player_id, team_id, season
WITH DATA;

CREATE UNIQUE INDEX player_season_stats_idx
    ON player_season_stats (player_id, team_id, season);

CREATE UNIQUE INDEX player_season_stats_id_idx
    ON player_season_stats (id);