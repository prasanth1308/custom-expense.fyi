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
import VoiceInput, { VoiceInputRef } from 'components/voice-input';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';
import { Mic, MicOff } from 'lucide-react';

import { getCurrencySymbol } from 'lib/formatter';
import { parseVoiceInput } from 'lib/voice-parser';

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
	const [isVoiceListening, setIsVoiceListening] = useState(false);
	const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
	const voiceInputRef = useRef<VoiceInputRef>(null);
	const inputRef = useRef<any>(null);

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

	const handleVoiceResult = (text: string) => {
		setIsVoiceProcessing(true);
		try {
			const parsed = parseVoiceInput(text, accounts, members, expensesPay);
			setState((prev: any) => ({
				...prev,
				// Only update if parsed value exists (not empty)
				...(parsed.name && { name: parsed.name }),
				...(parsed.price && { price: parsed.price }),
				...(parsed.account_id && { account_id: parsed.account_id }),
				...(parsed.paid_via && { paid_via: parsed.paid_via }),
				...(parsed.member_id !== null && { member_id: parsed.member_id }),
			}));
			toast.success('Voice input processed successfully');
		} catch (error) {
			console.error('Error parsing voice input:', error);
			toast.error('Failed to parse voice input. Please try again.');
		} finally {
			setTimeout(() => {
				setIsVoiceProcessing(false);
			}, 500);
		}
	};

	const handleVoiceListeningChange = (listening: boolean) => {
		setIsVoiceListening(listening);
	};

	const handleStopListening = () => {
		// Stop listening by calling the stop function from VoiceInput
		if (voiceInputRef.current?.stopListening) {
			voiceInputRef.current.stopListening();
		}
	};

	// Create listening overlay
	const listeningOverlay = isVoiceListening || isVoiceProcessing ? (
		<div className="flex flex-col items-center justify-center gap-4 p-8">
			<div className="relative">
				<div className="h-20 w-20 rounded-full border-4 border-primary/20" />
				<div className="absolute inset-0 flex items-center justify-center">
					<Mic className="h-10 w-10 text-primary animate-pulse" />
				</div>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-20 w-20 rounded-full border-4 border-primary animate-ping opacity-75" />
				</div>
			</div>
			<div className="text-center">
				<h3 className="text-lg font-semibold text-primary mb-2">
					{isVoiceProcessing ? 'Processing...' : 'Listening...'}
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					{isVoiceProcessing
						? 'Please wait while we process your voice input'
						: 'Speak your expense details now'}
				</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={handleStopListening}
					className="flex items-center gap-2"
				>
					<MicOff className="h-4 w-4" />
					Stop Listening
				</Button>
			</div>
		</div>
	) : null;

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
		<Modal 
			someRef={inputRef} 
			show={show} 
			title={`${selected.id ? 'Edit' : 'Add'} Expense`} 
			onHide={onHide}
			blockClose={isVoiceListening || isVoiceProcessing}
			listeningOverlay={listeningOverlay}
		>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
						if (!selected.id) setState({ ...initialState });
					}}
				>
					<div className="relative">
						<div className="flex items-center justify-between mb-1.5">
							<Label htmlFor="name">Name</Label>
							<VoiceInput 
								ref={voiceInputRef}
								onResult={handleVoiceResult} 
								onListeningChange={handleVoiceListeningChange}
								onStopRequested={handleStopListening}
								disabled={loading || !show} 
							/>
						</div>
						<Input
							className="mt-1.5"
							id="name"
							placeholder="Swiggy - Biriyani or use voice: 'milk 30 HDFC UPI Family'"
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
					<div className="grid grid-cols-[50%,50%] gap-3">
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
					<div className="grid grid-cols-[50%,50%] gap-3">
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
					<div className="grid grid-cols-[50%,50%] gap-3">
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
					<div>
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

					<Button disabled={loading} className="mt-1.5" type="submit">
						{loading ? <CircleLoader /> : `${selected?.id ? 'Update' : 'Submit'}`}
					</Button>
				</form>
			</div>
		</Modal>
	);
}
