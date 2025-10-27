-- Complete Supabase trigger function and trigger definition
-- This should be executed in your Supabase SQL editor

-- 1. Create the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger that fires when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.expenses TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.income TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.investments TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.subscriptions TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.feedbacks TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.contact TO postgres, anon, authenticated, service_role;
