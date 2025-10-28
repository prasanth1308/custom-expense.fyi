-- Test script to verify the trigger is working
-- Run this in Supabase SQL Editor after setting up the trigger

-- Test 1: Check if trigger function exists
SELECT 
  routine_name, 
  routine_type, 
  routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Test 2: Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test 3: Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Test 4: Manual test (optional - creates a test user)
-- Uncomment the lines below to test the trigger manually
-- DO $$ 
-- DECLARE
--   test_user_id uuid := gen_random_uuid();
--   user_count_before int;
--   user_count_after int;
-- BEGIN
--   -- Count users before
--   SELECT COUNT(*) INTO user_count_before FROM public.users;
--   
--   -- Insert a test user in auth.users (this should trigger the function)
--   INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
--   VALUES (test_user_id, 'test-trigger@example.com', now(), now(), now());
--   
--   -- Count users after
--   SELECT COUNT(*) INTO user_count_after FROM public.users;
--   
--   -- Check if trigger worked
--   IF user_count_after > user_count_before THEN
--     RAISE NOTICE 'SUCCESS: Trigger working - user count increased from % to %', user_count_before, user_count_after;
--   ELSE
--     RAISE NOTICE 'FAILED: Trigger not working - user count remained %', user_count_before;
--   END IF;
--   
--   -- Clean up test user
--   DELETE FROM public.users WHERE id = test_user_id;
--   DELETE FROM auth.users WHERE id = test_user_id;
-- END $$;
