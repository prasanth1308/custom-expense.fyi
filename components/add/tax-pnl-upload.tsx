'use client';

import { useState, useRef } from 'react';

import { toast } from 'sonner';

import { useVault } from 'components/context/vault-provider';
import CircleLoader from 'components/loader/circle';
import Modal from 'components/modal';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';

import { apiUrls } from 'lib/apiUrls';

interface TaxPnlUploadProps {
	show: boolean;
	onHide: () => void;
	onSuccess: () => void;
}

const providers = [
	{ value: 'kite', label: 'Kite (Zerodha)' },
	{ value: 'paytm_money', label: 'Paytm Money' },
	// Add more providers as needed
];

export default function TaxPnlUpload({ show, onHide, onSuccess }: TaxPnlUploadProps) {
	const { currentVault } = useVault();
	const [loading, setLoading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [provider, setProvider] = useState('kite');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		const fileExtension = file.name.split('.').pop()?.toLowerCase();
		if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
			toast.error('Please select an Excel or CSV file');
			return;
		}

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error('File size should be less than 10MB');
			return;
		}

		setSelectedFile(file);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error('Please select a file');
			return;
		}

		if (!currentVault?.id) {
			toast.error('Vault not selected');
			return;
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('provider', provider);
			formData.append('vaultId', currentVault.id);

			const response = await fetch(apiUrls.taxPnl.upload, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to upload file');
			}

			const data = await response.json();
			toast.success(`File uploaded successfully! Processed ${data.count} holdings.`);
			setSelectedFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
			onSuccess();
			onHide();
		} catch (error: any) {
			console.error('Upload error:', error);
			toast.error(error.message || 'Failed to upload file');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal someRef={modalRef} show={show} title="Upload Holdings File" onHide={onHide}>
			<div className="sm:flex sm:items-start max-sm:pb-6">
				<form
					className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						handleUpload();
					}}
				>
					<div>
						<Label htmlFor="provider">Provider</Label>
						<select
							id="provider"
							className="mt-1.5 flex h-9 max-sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							value={provider}
							onChange={(e) => setProvider(e.target.value)}
							required
						>
							{providers.map((p) => (
								<option key={p.value} value={p.value}>
									{p.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<Label htmlFor="file">Holdings File (Excel/CSV)</Label>
						<Input
							ref={fileInputRef}
							id="file"
							type="file"
							accept=".xlsx,.xls,.csv"
							onChange={handleFileSelect}
							className="mt-1.5"
							required
						/>
						{selectedFile && (
							<p className="mt-1 text-sm text-muted-foreground">
								Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
							</p>
						)}
					</div>

					<Button disabled={loading || !selectedFile} className="mt-1.5" type="submit">
						{loading ? <CircleLoader /> : 'Upload'}
					</Button>
				</form>
			</div>
		</Modal>
	);
}

