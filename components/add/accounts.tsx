'use client';

import { useEffect, useRef, useState } from 'react';

import { addAccount, editAccount } from 'app/dashboard/accounts/apis';
import { toast } from 'sonner';

import { useUser } from 'components/context/auth-provider';
import { useVault } from 'components/context/vault-provider';
import CircleLoader from 'components/loader/circle';
import Modal from 'components/modal';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';

import { getCurrencySymbol } from 'lib/formatter';

import { accountTypes } from 'constants/accounts';
import messages from 'constants/messages';

interface AddAccountProps {
	show: boolean;
	selected: any;
	onHide: () => void;
	mutate: () => void;
	lookup: (value: any) => void;
}

const initialState = {
	name: '',
	type: 'bank',
	starting_balance: '0',
	notes: '',
	member_id: null,
	id: null,
};

export default function AddAccount({ show, onHide, mutate, selected, lookup }: AddAccountProps) {
	const user = useUser();
	const { currentVault } = useVault();
	const [state, setState] = useState<any>(initialState);
	const [loading, setLoading] = useState(false);
	const [members, setMembers] = useState<any[]>([]);
	const inputRef = useRef<any>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		setState(
			selected.id
				? { ...selected, member_id: selected.member_id || null }
				: { ...initialState, member_id: null }
		);
	}, [selected]);

	// Fetch members for dropdown
	useEffect(() => {
		if (show && currentVault?.id) {
			fetch(`/api/members?vaultId=${currentVault.id}`)
				.then((res) => res.json())
				.then((data) => {
					setMembers(data.filter((m: any) => m.active));
				})
				.catch(() => {
					setMembers([]);
				});
		}
	}, [show, currentVault?.id]);

	const onSubmit = async () => {
		try {
			setLoading(true);
			const isEditing = selected?.id;
			const accountData = { ...state, vaultId: currentVault?.id };

			if (isEditing) {
				await editAccount(accountData);
			} else {
				await addAccount(accountData);
			}
			setLoading(false);
			toast.success(isEditing ? messages.updated : messages.success);
			if (mutate) mutate();
			onHide();
			setState(initialState);
		} catch {
			setLoading(false);
			toast.error(messages.error);
		}
	};

	return (
		<Modal someRef={inputRef} show={show} title={`${selected.id ? 'Edit' : 'Add'} Account`} onHide={onHide}>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						onSubmit();
						if (!selected.id) setState(initialState);
					}}
				>
					<div>
						<Label htmlFor="name">Account Name</Label>
						<Input
							className="mt-1.5"
							id="name"
							placeholder="Chase Bank"
							maxLength={30}
							required
							ref={inputRef}
							autoFocus
							autoComplete="off"
							onChange={(event) => setState({ ...state, name: event.target.value })}
							value={state.name}
						/>
					</div>
					<div className="grid grid-cols-[50%,50%] gap-3">
						<div className="mr-3">
							<Label htmlFor="type">Account Type</Label>
							<select
								id="type"
								className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onChange={(event) => setState({ ...state, type: event.target.value })}
								value={state.type}
								required
							>
								{Object.keys(accountTypes).map((key) => {
									return (
										<option key={key} value={key}>
											{accountTypes[key as keyof typeof accountTypes].name}
										</option>
									);
								})}
							</select>
						</div>
						<div className="mr-3">
							<Label htmlFor="starting_balance">
								Starting Balance
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									({getCurrencySymbol(user.currency, user.locale)})
								</span>
							</Label>
							<Input
								className="mt-1.5"
								id="starting_balance"
								type="number"
								placeholder="0"
								required
								min="0"
								inputMode="decimal"
								step="any"
								onChange={(event) => setState({ ...state, starting_balance: event.target.value })}
								value={state.starting_balance}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="member">Link to Member (Optional)</Label>
						<select
							id="member"
							className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							onChange={(event) =>
								setState({ ...state, member_id: event.target.value || null })
							}
							value={state.member_id || ''}
						>
							<option value="">Not linked</option>
							{members.map((member) => (
								<option key={member.id} value={member.id}>
									{member.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<Label className="block">
							Notes <span className="text-center text-sm text-muted-foreground">(optional)</span>
						</Label>
						<Textarea
							className="mt-2 h-20"
							onChange={(event) => setState({ ...state, notes: event.target.value })}
							value={state.notes || ''}
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

