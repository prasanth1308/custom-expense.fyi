-- Step 1: Create the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    created_at, 
    updated_at, 
    currency, 
    locale, 
    plan_status, 
    trial_start_date, 
    usage, 
    basic_usage_limit_email, 
    new_signup_email, 
    premium_plan_expired_email, 
    premium_usage_limit_email, 
    monthly_email_report
  )
  VALUES (
    new.id, 
    new.email, 
    now(), 
    now(), 
    'INR', 
    'en', 
    'basic', 
    now(), 
    0, 
    false, 
    false, 
    false, 
    false, 
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.expenses TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.income TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.investments TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.subscriptions TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.feedbacks TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.contact TO postgres, anon, authenticated, service_role;

-- Step 4: Enable Row Level Security (RLS) for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Policy to allow users to read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy to allow users to update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy to allow service role to insert users (for the trigger)
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Step 6: Test the trigger (optional - you can run this to verify it works)
-- This will create a test user and verify the trigger works
-- DO $$ 
-- DECLARE
--   test_user_id uuid := gen_random_uuid();
-- BEGIN
--   -- Insert a test user in auth.users
--   INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
--   VALUES (test_user_id, 'test@example.com', now(), now(), now());
--   
--   -- Check if the user was created in public.users
--   IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
--     RAISE NOTICE 'Trigger working correctly - user created in public.users';
--   ELSE
--     RAISE NOTICE 'Trigger failed - user not created in public.users';
--   END IF;
--   
--   -- Clean up test user
--   DELETE FROM public.users WHERE id = test_user_id;
--   DELETE FROM auth.users WHERE id = test_user_id;
-- END $$;
