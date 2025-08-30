# 🚀 Supabase Setup for BlossomAI Authentication

## **📋 Prerequisites**

1. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
2. **Node.js & npm** - Already installed in your project

## **🔧 Step-by-Step Setup**

### **1. Create Supabase Project**

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name**: `blossomai` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click **"Create new project"**

### **2. Get API Keys**

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### **3. Configure Environment Variables**

1. Create a file called `.env.local` in your `client/` directory
2. Add your Supabase credentials:

```bash
# client/.env.local
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### **4. Set Up Database Tables**

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'institutional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_connections table
CREATE TABLE public.wallet_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  chain TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own wallet connections" ON public.wallet_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wallet connections" ON public.wallet_connections
  FOR ALL USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company',
    COALESCE(NEW.raw_user_meta_data->>'role', 'institutional')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **5. Configure Authentication**

1. Go to **Authentication** → **Settings**
2. Configure email templates (optional but recommended)
3. Set up any additional providers (Google, GitHub, etc.) if desired

### **6. Test Your Setup**

1. Start your development server: `npm run dev`
2. Visit your app and try to create an account
3. Check the Supabase dashboard to see new users

## **🔒 Security Features**

- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - users can only access their own data
- **Secure authentication** via Supabase Auth
- **Environment variable protection** for API keys

## **🌐 Production Deployment**

When deploying to Vercel:

1. Add the same environment variables in your Vercel project settings
2. Ensure your Supabase project is in production mode
3. Update any CORS settings if needed

## **📞 Support**

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your environment variables are correct
3. Ensure all SQL commands were executed successfully

---

**Your BlossomAI platform now has enterprise-grade authentication!** 🎉
