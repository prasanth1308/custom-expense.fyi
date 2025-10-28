'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
	const router = useRouter();

	useEffect(() => {
		inputElement.current?.focus();

		async function getUser() {
			const { data } = await supabase.auth.getUser();
			const { user } = data;
			if (user) {
				router.push(url.app.overview);
			}
		}

		getUser();
	}, [router, supabase.auth]);

	const handleSendOTP = async () => {
		setState((prev) => ({ ...prev, loading: true, error: '', success: false }));

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email: state.email,
				options: {
					shouldCreateUser: false,
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
				router.push(url.app.overview);
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
					shouldCreateUser: false,
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
				} else {
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
							inputMode="email"
							autoComplete="email"
							type="email"
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
			) : (
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

			<p className="text-center text-sm font-medium text-gray-700">
				Don{"'"}t have an account?{' '}
				<Link
					href={url.app.signup}
					className="border-b-[1px] border-gray-700 pb-[1px] font-bold hover:border-gray-500 hover:text-gray-600"
				>
					Sign up
				</Link>{' '}
				for free.
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
							: 'Code verified successfully!'
						}
					</span>
				) : null}

				{!state.success && state.error ? <span className="text-red-500">{state.error}</span> : null}
			</p>
		</form>
	);
}
