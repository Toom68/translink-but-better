# Supabase Setup

## 1. Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public key** from Settings → API.

## 2. Run the Schema

1. Open the SQL Editor in your Supabase dashboard.
2. Copy and paste the contents of `schema.sql` into the editor.
3. Click **Run**.

This creates three tables (`profiles`, `saved_stops`, `preferences`) with Row Level Security policies that ensure users can only access their own data. It also adds a trigger to auto-create a profile and preferences row when a new user signs up.

## 3. Enable Email Auth (Magic Links)

1. Go to **Authentication → Providers**.
2. Enable **Email**.
3. Under **Email**, ensure **Confirm email** is ON (magic links require this).
4. Go to **Authentication → URL Configuration**.
5. Set the **Site URL** to your production URL (e.g. `https://your-app.netlify.app`).
6. Add redirect URLs:
   - `http://localhost:3000/callback` (dev)
   - `https://your-app.netlify.app/callback` (prod)

## 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

## 5. (Optional) Custom SMTP

Supabase's built-in email has rate limits (3-4 emails/hour). For production:

1. Go to **Authentication → Email Templates** to customize the magic link email.
2. Go to **Project Settings → Auth → SMTP Settings** and configure a custom SMTP provider (e.g. Resend, Postmark, SendGrid).

## 6. Verify

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Enter your email and click "Send magic link"
4. Check your inbox, click the link
5. You should be redirected back to the app, logged in
