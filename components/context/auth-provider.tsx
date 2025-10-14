'use client';

import { useRouter } from 'next/navigation';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SWRConfig } from 'swr';

import fetcher from 'lib/fetcher';

interface User {
	currency: string;
	locale: string;
	billing_start_date: string;
	trial_start_date: string;
	order_status: string;
	usage: number;
	email: string;
	plan_status: string;
	new_signup_email: boolean;
	basic_usage_limit_email: boolean;
	premium_plan_expired_email: boolean;
	premium_usage_limit_email: boolean;
	monthly_email_report: boolean;
	isPremium: boolean;
	isPremiumPlanEnded: boolean;
}

interface Session {}

const AuthContext = createContext(null);

export const AuthProvider = (props: any) => {
	const [initial, setInitial] = useState(true);
	const [session, setSession] = useState<Session | null>(null);
	const router = useRouter();
	const supabase = createClientComponentClient();
	const { accessToken, user, children, ...others } = props;

	useEffect(() => {
		console.log('Parsing URL hash for Supabase tokens');
		console.log('Current URL:', window.location.href);
		console.log('Current hash:', window.location.hash);
		console.log('AccessToken prop:', accessToken);
		console.log('Session state:', session);
		
		// Parse the hash fragment properly for Supabase auth tokens
		const hashParams = new URLSearchParams(window?.location?.hash?.substring(1) ?? '');
		const access_token = hashParams.get('access_token');
		const refresh_token = hashParams.get('refresh_token');
		
		console.log('Parsed access_token:', access_token);
		console.log('Parsed refresh_token:', refresh_token);

		// If we already have a session, just clean up the URL and don't process tokens again
		if (session && access_token) {
			console.log('Already have session, just cleaning up URL');
			window.history.replaceState(null, '', window.location.pathname);
			return;
		}

		if (access_token && refresh_token) {
			console.log('Setting Supabase session with tokens');
			const setSessionAndRedirect = async () => {
				try {
					const { data, error } = await supabase.auth.setSession({ 
						access_token, 
						refresh_token 
					});
					console.log('Session set result:', data, error);
					if (!error && data.session) {
						// Clear the hash from URL after processing
						window.history.replaceState(null, '', window.location.pathname);
						setSession(data.session);
						setInitial(false);
						console.log('Session successfully set, staying on dashboard');
					} else {
						console.error('Failed to set session:', error);
						window.location.href = '/signin';
					}
				} catch (err) {
					console.error('Error setting session:', err);
					window.location.href = '/signin';
				}
			};
			setSessionAndRedirect();
		} else if (!accessToken && !access_token) {
			console.log('No tokens found, redirecting to signin');
			// Only redirect to signin if we don't have tokens in URL and no existing access token
			window.location.href = '/signin';
		} else {
			console.log('Tokens or accessToken found, not redirecting');
			setInitial(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		async function getActiveSession() {
			const {
				data: { session: activeSession },
			} = await supabase.auth.getSession();
			setSession(activeSession ?? null);
			setInitial(false);
		}

		getActiveSession();

		const {
			data: { subscription: authListener },
		} = supabase.auth.onAuthStateChange((event, currentSession) => {
			console.log('Auth state change:', event, currentSession?.access_token ? 'has token' : 'no token');
			
			if (event === 'SIGNED_IN') {
				// Clear any auth tokens from URL hash after successful signin
				if (window.location.hash.includes('access_token')) {
					window.history.replaceState(null, '', window.location.pathname);
				}
				// Don't refresh immediately to avoid reload with hash tokens
			}
			
			if (event === 'TOKEN_REFRESHED') {
				router.refresh();
			}

			if (event == 'SIGNED_OUT') {
				window.location.href = '/signin';
			}

			setSession(currentSession);
		});

		return () => {
			authListener?.unsubscribe();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const value = useMemo(() => {
		return {
			initial,
			session,
			user,
			signOut: () => supabase.auth.signOut(),
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initial, session, user]);

	return (
		<AuthContext.Provider value={value} {...others}>
			<SWRConfig value={{ fetcher }}>{session ? children : null}</SWRConfig>
		</AuthContext.Provider>
	);
};

export const useUser = () => {
	const context = useContext<any>(AuthContext);
	if (context === undefined) {
		throw new Error(`useUser must be used within a AuthContext.`);
	}
	return context?.user ?? null;
};
