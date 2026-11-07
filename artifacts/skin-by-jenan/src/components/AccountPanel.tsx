import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, LoaderCircle, LogOut, UserRound } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';

type AuthMode = 'signIn' | 'signUp';
type AuthNotice = { kind: 'success' | 'error'; message: string } | null;

const inputClass =
  'mt-2 w-full rounded-xl border border-[#e3cfd2] bg-[#fffaf7] px-4 py-3 text-sm font-normal outline-none focus:border-[#ce4f7d]';

export function AccountPanel() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<AuthNotice>(null);

  useEffect(() => {
    if (!supabaseClient) return;

    void supabaseClient.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseClient) return;

    setBusy(true);
    setNotice(null);
    try {
      if (mode === 'signUp') {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setNotice({
          kind: 'success',
          message: data.session
            ? 'Your account is ready. You are signed in.'
            : 'Your account is created. Check your email to confirm it, then sign in.',
        });
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setNotice({ kind: 'success', message: 'You are signed in.' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      const isRedirectError = /redirect|url configuration/i.test(message);
      setNotice({
        kind: 'error',
        message: isRedirectError
          ? 'Add this app address in Supabase Auth → URL Configuration → Redirect URLs, then try again.'
          : message,
      });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabaseClient) return;
    setBusy(true);
    setNotice(null);
    const { error } = await supabaseClient.auth.signOut();
    setBusy(false);
    setNotice(
      error
        ? { kind: 'error', message: error.message }
        : { kind: 'success', message: 'You have signed out.' },
    );
  }

  if (user) {
    return (
      <div className="mt-4 rounded-[28px] bg-[#f7eee9] p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efd8df] text-[#ce4f7d]">
          <UserRound size={24} />
        </div>
        <p className="serif mt-5 text-2xl">Welcome back</p>
        <p className="mt-2 break-all text-sm text-[#806975]">{user.email}</p>
        {notice && (
          <p
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mt-4 text-sm ${notice.kind === 'error' ? 'text-[#8c3449]' : 'text-[#527453]'}`}
          >
            {notice.message}
          </p>
        )}
        <p className="mt-5 text-xs leading-5 text-[#806975]">
          Your account uses Supabase Auth. Your bag and favorites are currently saved to this
          browser session.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={busy}
          className="mt-6 rounded-full border border-[#d8bec4] px-5 py-3 text-sm font-semibold text-[#542d3c] disabled:opacity-60"
        >
          {busy ? <LoaderCircle size={16} className="mr-2 inline animate-spin" /> : <LogOut size={16} className="mr-2 inline" />}
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[28px] bg-[#f7eee9] p-6 md:p-7">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efd8df] text-[#ce4f7d]">
        <UserRound size={24} />
      </div>
      <p className="serif mt-5 text-2xl">
        {mode === 'signUp' ? 'Create your account' : 'Welcome back'}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#806975]">
        {mode === 'signUp'
          ? 'Create an account to join us for your next little ritual.'
          : 'Sign in to your Skin by Jenan account.'}
      </p>

      {!supabaseClient && (
        <p role="alert" className="mt-4 rounded-xl bg-white/70 p-3 text-sm text-[#8c3449]">
          Supabase Auth is not configured yet. Add the publishable key in the app environment.
        </p>
      )}

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`mt-4 text-sm ${notice.kind === 'error' ? 'text-[#8c3449]' : 'text-[#527453]'}`}
        >
          {notice.message}
        </p>
      )}

      <form onSubmit={submitAuth} className="mt-5 space-y-4">
        <label className="block text-xs font-semibold">
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-semibold">
          Password
          <input
            required
            type="password"
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            minLength={mode === 'signUp' ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === 'signUp' ? 'At least 8 characters' : 'Your password'}
            className={inputClass}
          />
        </label>
        {mode === 'signUp' && (
          <p className="text-[11px] leading-5 text-[#806975]">
            Confirmation emails return to this site. The site address must be allowed in Supabase
            Auth URL Configuration.
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !supabaseClient}
          className="w-full rounded-full bg-[#542d3c] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? <LoaderCircle size={16} className="mr-2 inline animate-spin" /> : null}
          {mode === 'signUp' ? 'Create account' : 'Sign in'}
          {!busy && <ArrowRight size={15} className="ml-2 inline" />}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[#806975]">
        {mode === 'signUp' ? 'Already have an account?' : 'New to Skin by Jenan?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signUp' ? 'signIn' : 'signUp');
            setNotice(null);
          }}
          className="font-bold text-[#a64b6a] underline underline-offset-2"
        >
          {mode === 'signUp' ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  );
}
