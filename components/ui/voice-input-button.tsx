'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

import { useSpeechRecognition } from 'hooks/useSpeechRecognition';
import { Button } from 'components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'components/ui/tooltip';

import { cn } from 'lib/utils';

interface VoiceInputButtonProps {
	onTranscript?: (transcript: string) => void;
	onError?: (error: string) => void;
	autoStop?: boolean;
	silenceTimeout?: number;
	lang?: string;
	className?: string;
	size?: 'default' | 'sm' | 'lg' | 'icon';
	variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	showStopButton?: boolean;
	onStopListening?: () => void;
	onListeningChange?: (isListening: boolean, transcript: string) => void;
}

export const VoiceInputButton = forwardRef<
	{ stopListening: () => void },
	VoiceInputButtonProps
>(({
	onTranscript,
	onError,
	autoStop = true,
	silenceTimeout = 3000,
	lang = 'en-US',
	className,
	size = 'icon',
	variant = 'ghost',
	showStopButton = false,
	onStopListening,
	onListeningChange,
}, ref) => {
	const animationRef = useRef<number | null>(null);
	const waveformRef = useRef<HTMLDivElement>(null);

	const {
		transcript,
		isListening,
		error,
		isSupported,
		permissionStatus,
		startListening,
		stopListening,
		reset,
		requestPermission,
	} = useSpeechRecognition({
		lang,
		continuous: true,
		interimResults: true,
		autoStop,
		silenceTimeout,
		onTranscript: (text) => {
			if (onTranscript) {
				onTranscript(text);
			}
		},
		onError: (err) => {
			if (onError) {
				onError(err);
			}
		},
	});

	// Expose stopListening via ref
	useImperativeHandle(ref, () => ({
		stopListening: () => {
			stopListening();
			if (onStopListening) {
				onStopListening();
			}
		},
	}));

	// Notify parent of listening state changes
	useEffect(() => {
		if (onListeningChange) {
			onListeningChange(isListening, transcript);
		}
	}, [isListening, transcript, onListeningChange]);

	// Waveform animation
	useEffect(() => {
		if (!isListening || !waveformRef.current) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
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
				const delay = index * 100;
				const progress = (elapsed + delay) % 1000;
				const height = 20 + Math.sin((progress / 1000) * Math.PI * 2 + index * 0.5) * 15;
				(bar as HTMLElement).style.height = `${Math.max(4, height)}px`;
			});

			if (isListening) {
				animationRef.current = requestAnimationFrame(animate);
			}
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
		};
	}, [isListening]);

	// Cleanup animation on unmount
	useEffect(() => {
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
		};
	}, []);

	const handleClick = async () => {
		if (!isSupported) {
			if (onError) {
				onError('Speech recognition is not supported in this browser');
			}
			return;
		}

		if (isListening) {
			stopListening();
		} else {
			// If permission is not granted, request it first
			if (permissionStatus !== 'granted') {
				const hasPermission = await requestPermission();
				if (!hasPermission) {
					// Permission was denied or needs user interaction
					return;
				}
			}
			
			// Reset transcript when starting a new session
			reset();
			// startListening is now async and handles permission requests
			await startListening();
		}
	};

	const getTooltipText = () => {
		if (!isSupported) {
			return 'Speech recognition not supported';
		}
		if (permissionStatus === 'denied') {
			return 'Microphone permission denied. Please enable in browser settings.';
		}
		if (permissionStatus === 'prompt') {
			return 'Click to request microphone permission';
		}
		if (error) {
			return error;
		}
		if (isListening) {
			return 'Click to stop recording';
		}
		return 'Click to start voice input';
	};

	if (!isSupported) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant={variant}
							size={size}
							className={cn(className)}
							disabled
							onClick={handleClick}
						>
							<MicOff className="h-4 w-4 text-muted-foreground" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Speech recognition not supported</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}


	return (
		<div className="flex items-center gap-2">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant={variant}
							size={size}
							className={cn(
								'relative overflow-hidden',
								isListening && 'animate-pulse',
								(error || permissionStatus === 'denied') && 'border-destructive',
								className
							)}
							onClick={handleClick}
							aria-label={isListening ? 'Stop recording' : 'Start voice input'}
							disabled={permissionStatus === 'denied'}
						>
							<div className="relative">
								{isListening ? (
									<div className="flex items-center gap-1">
										<Mic className="h-4 w-4 text-destructive" />
										<div
											ref={waveformRef}
											className="flex items-end gap-0.5 h-4"
											aria-hidden="true"
										>
											<div className="waveform-bar w-0.5 bg-destructive rounded-full transition-all duration-150" />
											<div className="waveform-bar w-0.5 bg-destructive rounded-full transition-all duration-150" />
											<div className="waveform-bar w-0.5 bg-destructive rounded-full transition-all duration-150" />
											<div className="waveform-bar w-0.5 bg-destructive rounded-full transition-all duration-150" />
										</div>
									</div>
								) : (
									<Mic
										className={cn(
											'h-4 w-4',
											(error || permissionStatus === 'denied') && 'text-destructive',
											permissionStatus === 'prompt' && 'text-muted-foreground'
										)}
									/>
								)}
								{/* Permission status indicator dot */}
								{permissionStatus === 'granted' && !isListening && (
									<span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-background animate-pulse" />
								)}
								{permissionStatus === 'denied' && (
									<span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full border border-background" />
								)}
								{permissionStatus === 'prompt' && (
									<span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-yellow-500 rounded-full border border-background animate-pulse" />
								)}
							</div>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{getTooltipText()}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			{showStopButton && isListening && (
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={() => {
						stopListening();
						if (onStopListening) {
							onStopListening();
						}
					}}
					className="text-xs"
				>
					Stop
				</Button>
			)}
		</div>
	);
});

VoiceInputButton.displayName = 'VoiceInputButton';

