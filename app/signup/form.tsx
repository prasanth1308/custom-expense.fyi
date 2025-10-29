'use client';

import Link from 'next/link';

import { useEffect, useRef, useState } from 'react';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import CircleLoader from 'components/loader/circle';
import { Button } from 'components/ui/button';

import { apiUrls } from 'lib/apiUrls';

import url from 'constants/url';

const initialState = { loading: false, email: '', otp: '', success: false, error: '', step: 'email' };

export default function Form() {
	const [state, setState] = useState(initialState);
	const inputElement = useRef<HTMLInputElement>(null);
	const supabase = createClientComponentClient();

	useEffect(() => {
		inputElement.current?.focus();
	}, []);

	const handleSendOTP = async () => {
		setState((prev) => ({ ...prev, loading: true, error: '', success: false }));

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email: state.email,
				options: {
					shouldCreateUser: true,
				},
			});

			if (error) {
				throw error;
			}
			setState((prev) => ({ ...prev, success: true, loading: false, step: 'otp' }));
		} catch (error: any) {
			setState((prev) => ({ ...prev, error: error.message, loading: false }));
		}
	};

	const handleVerifyOTP = async () => {
		setState((prev) => ({ ...prev, loading: true, error: '', success: false }));

		try {
			const { data, error } = await supabase.auth.verifyOtp({
				email: state.email,
				token: state.otp,
				type: 'email',
			});

			if (error) {
				throw error;
			}

			if (data.user) {
				setState((prev) => ({ ...prev, success: true, loading: false }));
				// Redirect to dashboard where vault creation prompt will appear
				setTimeout(() => {
					window.location.href = url.app.overview;
				}, 1000);
			}
		} catch (error: any) {
			setState((prev) => ({ ...prev, error: error.message, loading: false }));
		}
	};


	const handleResendOTP = async () => {
		setState((prev) => ({ ...prev, loading: true, error: '', success: false }));

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email: state.email,
				options: {
					shouldCreateUser: true,
				},
			});

			if (error) {
				throw error;
			}
			setState((prev) => ({ ...prev, success: true, loading: false }));
		} catch (error: any) {
			setState((prev) => ({ ...prev, error: error.message, loading: false }));
		}
	};

	return (
		<form
			className="grid w-full grid-cols-1 items-center gap-4 text-gray-800"
			onSubmit={(event) => {
				event.preventDefault();
				if (state.step === 'email') {
					handleSendOTP();
				} else if (state.step === 'otp') {
					handleVerifyOTP();
				}
			}}
		>
			{state.step === 'email' ? (
				<>
					<label className="mb-1 block">
						<span className="mb-2 block text-sm font-semibold leading-6">Email Address</span>
						<input
							className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-sm ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
							autoFocus
							type="email"
							inputMode="email"
							autoComplete="email"
							placeholder="tim@apple.com"
							required
							value={state.email}
							onChange={(event) => {
								setState({ ...state, email: event.target.value });
							}}
							ref={inputElement}
						/>
					</label>
					<Button size={'lg'} type="submit" disabled={state.loading}>
						{state.loading ? <CircleLoader /> : 'Send verification code'}
					</Button>
				</>
			) : state.step === 'otp' ? (
				<>
					<label className="mb-1 block">
						<span className="mb-2 block text-sm font-semibold leading-6">Verification Code</span>
						<input
							className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-sm ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
							autoFocus
							inputMode="numeric"
							type="text"
							placeholder="123456"
							required
							maxLength={6}
							value={state.otp}
							onChange={(event) => {
								setState({ ...state, otp: event.target.value });
							}}
							ref={inputElement}
						/>
					</label>
					<Button size={'lg'} type="submit" disabled={state.loading}>
						{state.loading ? <CircleLoader /> : 'Verify code'}
					</Button>
					<Button
						type="button"
						variant="outline"
						size={'lg'}
						onClick={handleResendOTP}
						disabled={state.loading}
						className="w-full"
					>
						Resend code
					</Button>
					<Button
						type="button"
						variant="ghost"
						size={'sm'}
						onClick={() => setState({ ...state, step: 'email', otp: '', error: '', success: false })}
						className="w-full"
					>
						← Back to email
					</Button>
				</>
			)}

			<p className="text-center text-sm font-medium text-zinc-700">
				Already registered?{' '}
				<Link
					href={url.app.signin}
					className="border-b-[1px] border-zinc-700 pb-[1px] font-bold hover:border-zinc-500 hover:text-zinc-600"
				>
					Sign in
				</Link>{' '}
				to your account.
			</p>

			<p
				className={`mb-6 h-[50px] text-center text-sm font-medium ${
					(state.success && !state.error) || (!state.success && state.error) ? '' : 'invisible'
				}`}
			>
				{state.success && !state.error ? (
					<span className="text-green-700">
						{state.step === 'email' 
							? 'Verification code sent to your email. Check your inbox.' 
							: state.step === 'otp'
							? 'Account verified! Now let\'s create your first vault.'
							: 'Vault created successfully!'
						}
					</span>
				) : null}

				{!state.success && state.error ? <span className="text-red-500">{state.error}</span> : null}
			</p>
		</form>
	);
}
