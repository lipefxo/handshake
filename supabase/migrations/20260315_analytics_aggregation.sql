-- Server-side analytics aggregation function
-- Returns pre-computed metrics instead of raw rows

CREATE OR REPLACE FUNCTION get_proposal_analytics(p_proposal_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalViews', COALESCE(v.total_views, 0),
    'uniqueVisitors', COALESCE(v.unique_visitors, 0),
    'avgDurationMs', COALESCE(v.avg_duration_ms, 0),
    'avgScrollDepthPct', COALESCE(v.avg_scroll_depth_pct, 0),
    'viewsByDay', COALESCE(vbd.days, '[]'::json),
    'slideBreakdown', COALESCE(sb.slides, '[]'::json),
    'deviceBreakdown', COALESCE(db.devices, '[]'::json),
    'topCountries', COALESCE(tc.countries, '[]'::json),
    'topReferrers', COALESCE(tr.referrers, '[]'::json),
    'recentViews', COALESCE(rv.recent, '[]'::json)
  ) INTO result
  FROM (
    -- Core aggregates
    SELECT
      COUNT(*)::INT AS total_views,
      COUNT(DISTINCT visitor_id)::INT AS unique_visitors,
      ROUND(AVG(duration_ms))::INT AS avg_duration_ms,
      ROUND(AVG(
        CASE WHEN slides_total > 0
          THEN ((max_slide_reached + 1)::FLOAT / slides_total) * 100
          ELSE 0
        END
      ))::INT AS avg_scroll_depth_pct
    FROM proposal_views
    WHERE proposal_id = p_proposal_id
  ) v,
  LATERAL (
    -- Views by day (last 30 days)
    SELECT json_agg(row_to_json(d) ORDER BY d.date) AS days
    FROM (
      SELECT
        created_at::DATE::TEXT AS date,
        COUNT(*)::INT AS views
      FROM proposal_views
      WHERE proposal_id = p_proposal_id
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY created_at::DATE
    ) d
  ) vbd,
  LATERAL (
    -- Slide breakdown
    SELECT json_agg(row_to_json(s) ORDER BY s."slideIndex") AS slides
    FROM (
      SELECT
        slide_index AS "slideIndex",
        slide_type AS "slideType",
        COUNT(*)::INT AS "viewCount",
        ROUND(AVG(dwell_time_ms))::INT AS "avgDwellMs"
      FROM proposal_slide_events
      WHERE proposal_id = p_proposal_id
      GROUP BY slide_index, slide_type
    ) s
  ) sb,
  LATERAL (
    -- Device breakdown
    SELECT json_agg(row_to_json(dd)) AS devices
    FROM (
      SELECT
        COALESCE(device_type, 'unknown') AS "deviceType",
        COUNT(*)::INT AS count
      FROM proposal_views
      WHERE proposal_id = p_proposal_id
      GROUP BY device_type
    ) dd
  ) db,
  LATERAL (
    -- Top countries
    SELECT json_agg(row_to_json(c)) AS countries
    FROM (
      SELECT
        country,
        COUNT(*)::INT AS count
      FROM proposal_views
      WHERE proposal_id = p_proposal_id AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    ) c
  ) tc,
  LATERAL (
    -- Top referrers
    SELECT json_agg(row_to_json(r)) AS referrers
    FROM (
      SELECT
        referrer,
        COUNT(*)::INT AS count
      FROM proposal_views
      WHERE proposal_id = p_proposal_id AND referrer IS NOT NULL
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    ) r
  ) tr,
  LATERAL (
    -- Recent views (last 20)
    SELECT json_agg(row_to_json(rv)) AS recent
    FROM (
      SELECT
        id,
        visitor_id AS "visitorId",
        device_type AS "deviceType",
        browser,
        country,
        city,
        max_slide_reached AS "maxSlideReached",
        slides_total AS "slidesTotal",
        duration_ms AS "durationMs",
        created_at AS "createdAt"
      FROM proposal_views
      WHERE proposal_id = p_proposal_id
      ORDER BY created_at DESC
      LIMIT 20
    ) rv
  ) rv;

  RETURN result;
END;
$$;
