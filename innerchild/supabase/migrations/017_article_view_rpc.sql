-- The articles table only allows UPDATE by admins (RLS), so an anonymous
-- visitor reading an article cannot bump view_count directly. This RPC runs
-- as the function owner (SECURITY DEFINER), bypassing RLS for the single
-- "+1" update path while keeping the rest of the table locked down.

CREATE OR REPLACE FUNCTION increment_article_view(p_article_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_article_id
  RETURNING view_count INTO new_count;
  RETURN new_count;
END;
$$;

-- Allow any client (anon + authenticated) to call the function.
GRANT EXECUTE ON FUNCTION increment_article_view(UUID) TO anon, authenticated;
