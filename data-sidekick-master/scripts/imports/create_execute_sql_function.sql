-- Function to execute SQL queries
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 