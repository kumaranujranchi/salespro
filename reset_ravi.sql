-- Script to delete user 'ravi@gmail.com' so they can try registration again

DO $$
DECLARE
    target_email text := 'ravi@gmail.com';
    user_id uuid;
BEGIN
    -- Get User ID
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NOT NULL THEN
        -- Delete from auth.users (Cascades to profiles)
        DELETE FROM auth.users WHERE id = user_id;
        RAISE NOTICE 'User % has been deleted. You can now register again.', target_email;
    ELSE
        RAISE NOTICE 'User % does not exist.', target_email;
    END IF;
END $$;
