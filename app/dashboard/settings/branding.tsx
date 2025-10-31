'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from 'components/context/auth-provider';
import { Card, CardContent, CardHeader } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Label } from 'components/ui/label';
import { Input } from 'components/ui/input';
import { toast } from 'sonner';

import { updateUser } from './apis';

const colorSchemes = [
	{ value: 'default', label: 'Default', preview: 'bg-slate-600' },
	{ value: 'blue', label: 'Blue', preview: 'bg-blue-600' },
	{ value: 'purple', label: 'Purple', preview: 'bg-purple-600' },
	{ value: 'green', label: 'Green', preview: 'bg-green-600' },
	{ value: 'red', label: 'Red', preview: 'bg-red-600' },
	{ value: 'orange', label: 'Orange', preview: 'bg-orange-600' },
	{ value: 'teal', label: 'Teal', preview: 'bg-teal-600' },
	{ value: 'pink', label: 'Pink', preview: 'bg-pink-600' },
	{ value: 'indigo', label: 'Indigo', preview: 'bg-indigo-600' },
	{ value: 'amber', label: 'Amber', preview: 'bg-amber-600' },
	{ value: 'cyan', label: 'Cyan', preview: 'bg-cyan-600' },
];

export default function Branding() {
	const user = useUser();
	const [colorScheme, setColorScheme] = useState(user?.color_scheme || 'default');
	const [logoUrl, setLogoUrl] = useState(user?.logo_url || '');
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleColorSchemeChange = async (scheme: string) => {
		setColorScheme(scheme);
		try {
			await updateUser({ color_scheme: scheme });
			// Apply the color scheme class to the document
			document.documentElement.className = document.documentElement.className
				.replace(/color-scheme-\w+/g, '')
				.replace(/\s+/g, ' ')
				.trim();
			if (scheme !== 'default') {
				document.documentElement.classList.add(`color-scheme-${scheme}`);
			}
			toast.success('Color scheme updated');
		} catch (error) {
			toast.error('Failed to update color scheme');
			setColorScheme(user?.color_scheme || 'default');
		}
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		// Validate file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			toast.error('Image size should be less than 2MB');
			return;
		}

		setUploading(true);

		try {
			// Convert to base64 for now (in production, upload to storage service like Supabase Storage)
			const reader = new FileReader();
			reader.onloadend = async () => {
				const base64String = reader.result as string;
				try {
					await updateUser({ logo_url: base64String });
					setLogoUrl(base64String);
					toast.success('Logo updated successfully');
				} catch (error) {
					toast.error('Failed to update logo');
				} finally {
					setUploading(false);
				}
			};
			reader.readAsDataURL(file);
		} catch (error) {
			toast.error('Failed to upload logo');
			setUploading(false);
		}
	};

	const handleRemoveLogo = async () => {
		try {
			await updateUser({ logo_url: null });
			setLogoUrl('');
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
			toast.success('Logo removed');
		} catch (error) {
			toast.error('Failed to remove logo');
		}
	};

	// Sync state when user data changes
	useEffect(() => {
		if (user) {
			setColorScheme(user.color_scheme || 'default');
			setLogoUrl(user.logo_url || '');
		}
	}, [user]);

	return (
		<Card className="w-full">
			<CardHeader>
				<h2 className="font-semibold text-primary dark:text-white">Branding</h2>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Color Scheme Selection */}
				<div>
					<Label className="mb-3 block">Color Scheme</Label>
					<p className="mb-4 text-sm text-muted-foreground">
						Choose a color scheme to personalize your app appearance
					</p>
					<div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
						{colorSchemes.map((scheme) => (
							<button
								key={scheme.value}
								onClick={() => handleColorSchemeChange(scheme.value)}
								className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
									colorScheme === scheme.value
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-primary/50'
								}`}
							>
								<div className={`h-8 w-full rounded ${scheme.preview}`} />
								<span className="text-xs font-medium">{scheme.label}</span>
								{colorScheme === scheme.value && (
									<div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-primary" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Logo Upload */}
				<div>
					<Label className="mb-3 block">Logo</Label>
					<p className="mb-4 text-sm text-muted-foreground">
						Upload a custom logo for your account (max 2MB, recommended: 64x64px)
					</p>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
						{logoUrl && (
							<div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
								<Image src={logoUrl} alt="Logo" fill className="object-contain" />
							</div>
						)}
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
							>
								{logoUrl ? 'Change Logo' : 'Upload Logo'}
							</Button>
							{logoUrl && (
								<Button type="button" variant="destructive" onClick={handleRemoveLogo}>
									Remove
								</Button>
							)}
							<Input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

