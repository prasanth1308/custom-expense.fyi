'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { incrementUsage } from 'app/dashboard/apis';
import { addExpense, editExpense } from 'app/dashboard/expenses/apis';
import { format } from 'date-fns';
import debounce from 'debounce';
import { toast } from 'sonner';

import AutoCompleteList from 'components/autocomplete-list';
import { useUser } from 'components/context/auth-provider';
import { useVault } from 'components/context/vault-provider';
import CircleLoader from 'components/loader/circle';
import Modal from 'components/modal';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';
import { VoiceInputButton } from 'components/ui/voice-input-button';

import { getCurrencySymbol } from 'lib/formatter';
import { parseVoiceInput } from 'lib/voiceParser';

import { expensesCategory, expensesPay, groupedExpenses } from 'constants/categories';
import { dateFormat, datePattern } from 'constants/date';
import messages from 'constants/messages';

interface AddExpenseProps {
	show: boolean;
	selected: any;
	onHide: () => void;
	mutate: () => void;
	lookup: (value: any) => void;
}

const initialState = {
	category: 'food',
	paid_via: 'upi',
	name: '',
	notes: '',
	price: '',
	date: '',
	id: null,
	account_id: null,
	member_id: null,
	autocomplete: [],
};

export default function AddExpense({ show, onHide, mutate, selected, lookup }: AddExpenseProps) {
	const user = useUser();
	const { currentVault } = useVault();
	const todayDate = format(new Date(), dateFormat);
	const [state, setState] = useState<any>({ ...initialState, date: todayDate });
	const [loading, setLoading] = useState(false);
	const [accounts, setAccounts] = useState<any[]>([]);
	const [members, setMembers] = useState<any[]>([]);
	const inputRef = useRef<any>(null);
	const [voiceTranscript, setVoiceTranscript] = useState<string>('');
	const [isVoiceListening, setIsVoiceListening] = useState(false);
	const [currentTranscript, setCurrentTranscript] = useState<string>('');
	const voiceInputRef = useRef<{ stopListening: () => void } | null>(null);
	const waveformAnimationRef = useRef<number | null>(null);
	const waveformRef = useRef<HTMLDivElement>(null);

	// Animate waveform when listening
	useEffect(() => {
		if (!isVoiceListening || !waveformRef.current) {
			if (waveformAnimationRef.current) {
				cancelAnimationFrame(waveformAnimationRef.current);
				waveformAnimationRef.current = null;
			}
			return;
		}

		const bars = waveformRef.current.querySelectorAll('.waveform-bar');
		if (bars.length === 0) return;

		let startTime: number | null = null;

		const animate = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const elapsed = timestamp - startTime;

			bars.forEach((bar, index) => {
				const delay = index * 50;
				const progress = (elapsed + delay) % 1000;
				const height = 20 + Math.sin((progress / 1000) * Math.PI * 2 + index * 0.5) * 30;
				(bar as HTMLElement).style.height = `${Math.max(8, height)}px`;
			});

			if (isVoiceListening) {
				waveformAnimationRef.current = requestAnimationFrame(animate);
			}
		};

		waveformAnimationRef.current = requestAnimationFrame(animate);

		return () => {
			if (waveformAnimationRef.current) {
				cancelAnimationFrame(waveformAnimationRef.current);
				waveformAnimationRef.current = null;
			}
		};
	}, [isVoiceListening]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(
		() =>
			setState(
				selected.id
					? {
							...selected,
							...{
								paid_via: selected.paid_via ? selected.paid_via : initialState.paid_via,
								account_id: selected.account_id || null,
								member_id: selected.member_id || null,
							},
					  }
					: { ...initialState, date: todayDate }
			),
		[selected, todayDate]
	);

	// Fetch accounts and members for dropdowns
	useEffect(() => {
		if (show && currentVault?.id) {
			Promise.all([
				fetch(`/api/accounts?vaultId=${currentVault.id}`).then((res) => res.json()),
				fetch(`/api/members?vaultId=${currentVault.id}`).then((res) => res.json()),
			])
				.then(([accountsData, membersData]) => {
					setAccounts(accountsData.filter((a: any) => a.active));
					setMembers(membersData.filter((m: any) => m.active));
				})
				.catch(() => {
					setAccounts([]);
					setMembers([]);
				});
		}
	}, [show, currentVault?.id]);

	const onLookup = useMemo(() => {
		const callbackHandler = (value: string) => {
			setState((prev: any) => ({ ...prev, autocomplete: lookup(value) }));
		};

		return debounce(callbackHandler, 500);
	}, [lookup]);

	// Handle voice transcript updates (fix setState during render)
	// Must be after onLookup is defined
	useEffect(() => {
		if (voiceTranscript.trim()) {
			// Parse the voice input to extract all expense details
			const parsed = parseVoiceInput(voiceTranscript);
			
			setState((prev: any) => {
				const updates: any = { autocomplete: [] };
				
				if (parsed.name && parsed.name !== prev.name) {
					updates.name = parsed.name;
					if (parsed.name.length > 2) {
						onLookup(parsed.name);
					}
				}
				
				if (parsed.price && parsed.price !== prev.price) {
					updates.price = parsed.price;
				}
				
				if (parsed.category && parsed.category !== prev.category) {
					updates.category = parsed.category;
				}
				
				if (parsed.paid_via && parsed.paid_via !== prev.paid_via) {
					updates.paid_via = parsed.paid_via;
				}
				
				if (parsed.date && parsed.date !== prev.date) {
					updates.date = parsed.date;
				}
				
				// Handle member matching
				if (parsed.notes && parsed.notes.startsWith('Member: ')) {
					const memberName = parsed.notes.replace('Member: ', '').trim();
					// Find matching member
					const matchedMember = members.find(
						(m: any) => m.name.toLowerCase() === memberName.toLowerCase()
					);
					if (matchedMember) {
						updates.member_id = matchedMember.id;
					}
					// Don't set notes if it's just a member reference
				} else if (parsed.notes && parsed.notes !== prev.notes) {
					updates.notes = parsed.notes;
				}
				
				// Only update if there are changes
				if (Object.keys(updates).length > 1) { // More than just autocomplete
					return { ...prev, ...updates };
				}
				
				return prev;
			});
			
			// Clear the transcript after processing
			setVoiceTranscript('');
		}
	}, [voiceTranscript, onLookup, members]);

	const onSubmit = async () => {
		try {
			setLoading(true);
			const isEditing = selected?.id;
			const expenseData = { ...state, vaultId: currentVault?.id };
			
			if (isEditing) {
				await editExpense(expenseData);
			} else {
				await addExpense(expenseData);
				incrementUsage();
			}
			setLoading(false);
			toast.success(isEditing ? messages.updated : messages.success);
			if (mutate) mutate();
			onHide();
			setState({ ...initialState });
		} catch {
			setLoading(false);
			toast.error(messages.error);
		}
	};

	return (
		<Modal someRef={inputRef} show={show} title={`${selected.id ? 'Edit' : 'Add'} Expense`} onHide={onHide}>
			{/* Voice Listening Overlay - Siri/Google Assistant style */}
			{isVoiceListening && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-200">
					<div className="flex flex-col items-center gap-6 px-6">
						{/* Animated Waveform */}
						<div ref={waveformRef} className="flex items-end justify-center gap-1.5 h-24">
							{[...Array(20)].map((_, i) => (
								<div
									key={i}
									className="waveform-bar w-1.5 bg-primary rounded-full transition-all duration-150"
									style={{
										height: '20px',
									}}
								/>
							))}
						</div>
						
						{/* Transcript Display */}
						{currentTranscript && (
							<div className="max-w-md text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
								<p className="text-sm text-muted-foreground mb-1">Listening...</p>
								<p className="text-lg font-medium text-primary">{currentTranscript}</p>
							</div>
						)}
						
						{/* Stop Button */}
						<Button
							type="button"
							variant="destructive"
							size="lg"
							onClick={() => {
								if (voiceInputRef.current?.stopListening) {
									voiceInputRef.current.stopListening();
								}
								setIsVoiceListening(false);
							}}
							className="rounded-full h-14 w-14 shadow-lg"
						>
							<svg
								className="h-6 w-6"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<rect x="6" y="6" width="12" height="12" rx="2" />
							</svg>
						</Button>
						
						<p className="text-xs text-muted-foreground mt-2">Tap to stop</p>
					</div>
				</div>
			)}
			
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
						if (!selected.id) setState({ ...initialState });
					}}
				>
					<div className="relative animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75">
						<Label htmlFor="name">Name</Label>
						<div className="relative">
							<Input
								className="mt-1.5"
								id="name"
								placeholder="Swiggy - Biriyani"
								maxLength={30}
								required
								ref={inputRef}
								autoFocus
								autoComplete="off"
								onChange={({ target }) => {
									const { value } = target;
									if (value.length) {
										setState({ ...state, name: value, autocomplete: [] });
										if (value.length > 2) onLookup(value);
									} else {
										setState({ ...state, name: '', category: 'food', paid_via: 'upi' });
									}
								}}
								value={state.name}
							/>
						</div>
						<AutoCompleteList
							onHide={() => {
								setState({ ...state, autocomplete: [] });
							}}
							data={state.autocomplete}
							searchTerm={state.name.length > 2 ? state.name.toLowerCase() : ''}
							onClick={({ name, category, paid_via }) => {
								setState({ ...state, name, category, paid_via, autocomplete: [] });
							}}
							show={Boolean(state.autocomplete?.length)}
						/>
					</div>
					<div className="grid grid-cols-[50%,50%] gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
						<div className="mr-3">
							<Label htmlFor="price">
								Price
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user.currency, user.locale)})
								</span>
							</Label>
							<Input
								className="mt-1.5"
								id="price"
								type="number"
								placeholder="199"
								required
								min="0"
								inputMode="decimal"
								step="any"
								onChange={(event) => setState({ ...state, price: event.target.value })}
								value={state.price}
							/>
						</div>
						<div className="mr-3">
							<Label htmlFor="date">Spent Date</Label>
							<Input
								className="mt-1.5 appearance-none"
								id="date"
								type="date"
								required
								max={todayDate}
								pattern={datePattern}
								onChange={(event) => {
									setState({ ...state, date: event.target.value });
								}}
								value={state.date}
							/>
						</div>
					</div>
					<div className="grid grid-cols-[50%,50%] gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-225">
						<div className="mr-3">
							<Label htmlFor="category">Category</Label>
							<select
								id="category"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, category: event.target.value });
								}}
								value={state.category}
								required
							>
								{Object.keys(groupedExpenses).map((key) => {
									return (
										<optgroup label={groupedExpenses[key].name} key={groupedExpenses[key].name}>
											{Object.keys(groupedExpenses[key].list).map((listKey) => {
												return (
													<option key={listKey} value={listKey}>
														{groupedExpenses[key].list[listKey].name}
													</option>
												);
											})}
										</optgroup>
									);
								})}
								<option key={'other'} value={'other'}>
									{expensesCategory.other.name}
								</option>
							</select>
						</div>
						<div className="mr-3">
							<Label htmlFor="paid">Paid Via</Label>
							<select
								id="paid"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => {
									setState({ ...state, paid_via: event.target.value });
								}}
								value={state.paid_via}
								required
							>
								{Object.keys(expensesPay).map((key) => {
									return (
										<option key={key} value={key}>
											{expensesPay[key].name}
										</option>
									);
								})}
							</select>
						</div>
					</div>
					<div className="grid grid-cols-[50%,50%] gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">
						<div className="mr-3">
							<Label htmlFor="account">Account (Optional)</Label>
							<select
								id="account"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => setState({ ...state, account_id: event.target.value || null })}
								value={state.account_id || ''}
							>
								<option value="">Not assigned</option>
								{accounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.name}
									</option>
								))}
							</select>
						</div>
						<div className="mr-3">
							<Label htmlFor="member">Member (Optional)</Label>
							<select
								id="member"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => setState({ ...state, member_id: event.target.value || null })}
								value={state.member_id || ''}
							>
								<option value="">Family</option>
								{members.map((member) => (
									<option key={member.id} value={member.id}>
										{member.name}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-375">
						<Label className="block">
							Notes <span className="text-center text-sm text-muted-foreground">(optional)</span>
						</Label>
						<Textarea
							className="mt-2 h-20"
							onChange={(event) => setState({ ...state, notes: event.target.value })}
							value={state.notes}
							maxLength={60}
						/>
					</div>

					<div className="mt-1.5 space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-450">
						<div className="flex items-center gap-3">
							<Button disabled={loading} className="flex-1" type="submit">
								{loading ? <CircleLoader /> : `${selected?.id ? 'Update' : 'Submit'}`}
							</Button>
							<VoiceInputButton
								ref={voiceInputRef}
							onTranscript={(transcript) => {
								// Only process if transcript is different to avoid duplicate processing
								// Update state to trigger useEffect (fixes setState during render warning)
								if (transcript.trim() && transcript.trim() !== voiceTranscript.trim()) {
									setVoiceTranscript(transcript);
								}
							}}
							onError={(error) => {
								toast.error(error || 'Voice input error');
							}}
							onListeningChange={(isListening, transcript) => {
								setIsVoiceListening(isListening);
								setCurrentTranscript(transcript);
							}}
							autoStop={true}
							silenceTimeout={3000}
							lang={user.locale || 'en-US'}
							showStopButton={true}
							size="sm"
							variant="outline"
						/>
						</div>
						<div className="text-xs text-muted-foreground text-center px-2">
							💡 Voice format: <span className="font-mono">Name Price Category Paid Via Member</span>
							<br />
							Example: <span className="font-mono">Milk 40 Food UPI Family</span>
						</div>
					</div>
				</form>
			</div>
		</Modal>
	);
}
