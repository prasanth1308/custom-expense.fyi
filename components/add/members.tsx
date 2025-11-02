'use client';

import { useEffect, useRef, useState } from 'react';

import { addMember, editMember } from 'app/dashboard/members/apis';
import { toast } from 'sonner';

import { useVault } from 'components/context/vault-provider';
import { useCacheInvalidation } from 'lib/cache-invalidation';
import CircleLoader from 'components/loader/circle';
import Modal from 'components/modal';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';

import messages from 'constants/messages';

interface AddMemberProps {
	show: boolean;
	selected: any;
	onHide: () => void;
	mutate: () => void;
	lookup: (value: any) => void;
}

const initialState = {
	name: '',
	notes: '',
	id: null,
};

export default function AddMember({ show, onHide, mutate, selected, lookup }: AddMemberProps) {
	const { currentVault } = useVault();
	const { invalidateRelatedCaches } = useCacheInvalidation();
	const [state, setState] = useState<any>(initialState);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<any>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		setState(selected.id ? selected : initialState);
	}, [selected]);

	const onSubmit = async () => {
		try {
			setLoading(true);
			const isEditing = selected?.id;
			const memberData = { ...state, vaultId: currentVault?.id };

			if (isEditing) {
				await editMember(memberData);
			} else {
				await addMember(memberData);
			}
			setLoading(false);
			toast.success(isEditing ? messages.updated : messages.success);
			// Invalidate members cache
			await invalidateRelatedCaches('members', { vaultId: currentVault?.id });
			if (mutate) mutate();
			onHide();
			setState(initialState);
		} catch {
			setLoading(false);
			toast.error(messages.error);
		}
	};

	return (
		<Modal someRef={inputRef} show={show} title={`${selected.id ? 'Edit' : 'Add'} Member`} onHide={onHide}>
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
						<Label htmlFor="name">Member Name</Label>
						<Input
							className="mt-1.5"
							id="name"
							placeholder="John Doe"
							maxLength={30}
							required
							ref={inputRef}
							autoFocus
							autoComplete="off"
							onChange={(event) => setState({ ...state, name: event.target.value })}
							value={state.name}
						/>
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

