-- Function to reset a sequence to a specific value
CREATE OR REPLACE FUNCTION reset_sequence(sequence_name text, value bigint)
RETURNS void AS $$
BEGIN
    EXECUTE format('SELECT setval(%L, %L, true)', sequence_name, value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the reset_sequence function if it doesn't exist
CREATE OR REPLACE FUNCTION create_reset_sequence_function()
RETURNS void AS $$
BEGIN
    -- This function does nothing, it's just a placeholder
    -- The actual reset_sequence function is created above
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 