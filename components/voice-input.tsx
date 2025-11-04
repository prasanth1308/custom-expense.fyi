'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from 'components/ui/button';
import { toast } from 'sonner';

interface VoiceInputProps {
	onResult: (text: string) => void;
	onListeningChange?: (isListening: boolean) => void;
	onStopRequested?: () => void;
	disabled?: boolean;
}

export interface VoiceInputRef {
	stopListening: () => void;
}

const VoiceInput = forwardRef<VoiceInputRef, VoiceInputProps>(
	({ onResult, onListeningChange, onStopRequested, disabled = false }, ref) => {
	const [isListening, setIsListening] = useState(false);
	const [isSupported, setIsSupported] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const recognitionRef = useRef<any>(null);
	const permissionRequestedRef = useRef(false);

	useEffect(() => {
		// Check if browser supports Web Speech API
		if (typeof window !== 'undefined') {
			const SpeechRecognition =
				(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			
			if (SpeechRecognition) {
				setIsSupported(true);
				const recognition = new SpeechRecognition();
				recognition.continuous = false;
				recognition.interimResults = false;
				recognition.lang = 'en-US';

				recognition.onstart = () => {
					setIsListening(true);
					onListeningChange?.(true);
					toast.info('Listening... Speak now', { duration: 2000 });
				};

				recognition.onresult = (event: any) => {
					try {
						const transcript = event.results[0][0].transcript;
						setIsProcessing(true);
						setIsListening(false);
						onListeningChange?.(false);
						onResult(transcript);
						// Reset processing after a short delay
						setTimeout(() => {
							setIsProcessing(false);
						}, 500);
					} catch (error) {
						console.error('Error processing voice result:', error);
						setIsProcessing(false);
						setIsListening(false);
						onListeningChange?.(false);
					}
				};

				recognition.onerror = async (event: any) => {
					console.error('Speech recognition error:', event.error);
					setIsListening(false);
					onListeningChange?.(false);
					setIsProcessing(false);

					// Handle specific error types
					switch (event.error) {
						case 'not-allowed':
							permissionRequestedRef.current = false;
							setHasPermission(false);
							// Try to request permission - maybe user just enabled it
							const hasPermissionResult = await checkPermission();
							if (!hasPermissionResult) {
								toast.error('Microphone permission denied. Please enable microphone access in your browser settings and try again.');
							} else {
								// Permission was granted via getUserMedia, but SpeechRecognition still failed
								// This can happen in some browsers - suggest trying again or reloading
								toast.info('Permission granted. Please try clicking the Voice button again.');
							}
							break;
						case 'no-speech':
							toast.error('No speech detected. Please try again.');
							break;
						case 'audio-capture':
							toast.error('No microphone found. Please connect a microphone.');
							break;
						case 'network':
							toast.error('Network error. Please check your connection.');
							break;
						case 'aborted':
							// User stopped manually, don't show error
							break;
						default:
							toast.error(`Voice recognition error: ${event.error}. Please try again.`);
					}
				};

				recognition.onend = () => {
					// Only reset if not processing (to avoid conflicts)
					setTimeout(() => {
						setIsListening((prev) => {
							if (!prev) return prev; // Already stopped
							return false;
						});
						onListeningChange?.(false);
					}, 100);
				};

				recognitionRef.current = recognition;
			}
		}

		return () => {
			if (recognitionRef.current) {
				try {
					recognitionRef.current.stop();
				} catch (e) {
					// Ignore errors when stopping
				}
			}
		};
	}, [onResult, onListeningChange]);

	// Function to check and update permission status
	const refreshPermissionStatus = async () => {
		if (!isSupported) return;

		// Check if permission API is available
		if (navigator.permissions && navigator.permissions.query) {
			try {
				let permissionResult;
				// Try different permission name formats used by different browsers
				const permissionNames = ['microphone', 'audio_capture', 'audio-capture'];
				
				for (const permName of permissionNames) {
					try {
						permissionResult = await navigator.permissions.query({ name: permName as PermissionName });
						if (permissionResult) break;
					} catch {
						try {
							permissionResult = await (navigator.permissions as any).query({ name: permName });
							if (permissionResult) break;
						} catch {
							continue;
						}
					}
				}

				if (permissionResult) {
					const isGranted = permissionResult.state === 'granted';
					setHasPermission(isGranted);
					
					// Listen for permission changes
					permissionResult.onchange = () => {
						setHasPermission(permissionResult.state === 'granted');
					};
				} else {
					// None of the permission names worked, try getUserMedia as fallback
					try {
						const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
						stream.getTracks().forEach((track) => track.stop());
						setHasPermission(true);
					} catch {
						setHasPermission(false);
					}
				}
			} catch (e) {
				// Fallback: try getUserMedia to check permission
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					stream.getTracks().forEach((track) => track.stop());
					setHasPermission(true);
				} catch {
					setHasPermission(false);
				}
			}
		} else {
			// Permission API not available (Safari, older browsers)
			// Try getUserMedia to check permission (will show prompt if not granted)
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				stream.getTracks().forEach((track) => track.stop());
				setHasPermission(true);
			} catch {
				setHasPermission(false);
			}
		}
	};

	// Check and request microphone permission
	const checkPermission = async (): Promise<boolean> => {
		// Check if permission API is available (Chrome/Edge)
		if (navigator.permissions && navigator.permissions.query) {
			try {
				// Try different permission name formats used by different browsers
				const permissionNames = ['microphone', 'audio_capture', 'audio-capture'];
				let permissionResult;
				
				for (const permName of permissionNames) {
					try {
						permissionResult = await navigator.permissions.query({ name: permName as PermissionName });
						if (permissionResult) break;
					} catch {
						try {
							permissionResult = await (navigator.permissions as any).query({ name: permName });
							if (permissionResult) break;
						} catch {
							continue;
						}
					}
				}

				if (permissionResult) {
					if (permissionResult.state === 'granted') {
						permissionRequestedRef.current = true;
						setHasPermission(true);
						return true;
					}
					if (permissionResult.state === 'denied') {
						setHasPermission(false);
						toast.error('Microphone permission denied. Please enable microphone access in your browser settings.');
						// return false;
					}
					// If 'prompt', we'll try getUserMedia to trigger the prompt
				}
			} catch (e) {
				// Permission API might not be supported, fall through to getUserMedia
				console.log('Permission API not supported, trying getUserMedia');
			}
		}

		// Fallback: try to get user media to request/check permission
		// This will trigger the browser's native permission prompt if not already granted
		try {
			// This call will show the browser's permission popup if permission hasn't been granted
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			// Stop the stream immediately as we just needed permission
			// We don't need to keep the stream open for SpeechRecognition
			stream.getTracks().forEach((track) => track.stop());
			permissionRequestedRef.current = true;
			setHasPermission(true);
			// Small delay to ensure permission state is updated
			setTimeout(() => {
				refreshPermissionStatus();
			}, 100);
			return true;
		} catch (error: any) {
			console.error('Permission error:', error);
			permissionRequestedRef.current = false;
			if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
				setHasPermission(false);
				toast.error('Microphone permission denied. Please enable microphone access and try again.');
			} else if (error.name === 'NotFoundError') {
				toast.error('No microphone found. Please connect a microphone.');
			} else {
				toast.error('Failed to access microphone. Please check your browser settings.');
			}
			return false;
		}
	};

	// Check permission status on mount and when permission might change
	useEffect(() => {
		refreshPermissionStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSupported]);

	const stopListening = () => {
		try {
			recognitionRef.current?.stop();
			setIsListening(false);
			onListeningChange?.(false);
			onStopRequested?.();
		} catch (e) {
			setIsListening(false);
			onListeningChange?.(false);
			onStopRequested?.();
		}
	};

	// Expose stop function via ref
	useImperativeHandle(ref, () => ({
		stopListening,
	}));

	const toggleListening = async () => {
		if (!isSupported) {
			toast.error('Voice input is not supported in your browser.');
			return;
		}

		if (isListening) {
			stopListening();
		} else {
			// First, request microphone permission explicitly
			// This ensures the browser's permission prompt appears
			const hasPermission = await checkPermission();
			if (!hasPermission) {
				return; // Permission denied, error already shown by checkPermission
			}

			// Refresh permission status after granting to ensure UI is updated
			// Small delay to allow browser to update permission state
			setTimeout(() => {
				refreshPermissionStatus();
			}, 200);

			// Now start recognition - permission should be granted
			try {
				recognitionRef.current?.start();
				// onstart event will handle setting listening state and showing toast
			} catch (e: any) {
				console.error('Failed to start recognition:', e);
				setIsListening(false);
				onListeningChange?.(false);
				
				// Even after getting permission, some browsers might still fail
				if (e.name === 'NotAllowedError' || e.message?.includes('not-allowed') || e.error === 'not-allowed') {
					// Reset permission flag and suggest retry or reload
					permissionRequestedRef.current = false;
					setHasPermission(false);
					toast.error('Permission granted but recognition failed. Please try again or reload the page.');
				} else {
					toast.error('Failed to start voice recognition. Please try again.');
				}
			}
		}
	};

	if (!isSupported) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant={isListening || isProcessing ? 'destructive' : 'outline'}
				size="sm"
				onClick={toggleListening}
				disabled={disabled || isProcessing}
				className="flex items-center gap-2"
				title={isProcessing ? 'Processing...' : isListening ? 'Stop listening' : 'Start voice input'}
			>
				{isListening || isProcessing ? (
					<>
						<MicOff className="h-4 w-4 animate-pulse" />
						<span className="max-sm:hidden">{isProcessing ? 'Processing...' : 'Stop'}</span>
					</>
				) : (
					<>
						<Mic className="h-4 w-4" />
						<span className="max-sm:hidden">Voice</span>
					</>
				)}
			</Button>
			{hasPermission !== null && (
				<div
					className={`h-2 w-2 rounded-full ${
						hasPermission ? 'bg-green-500' : 'bg-red-500'
					}`}
					title={hasPermission ? 'Microphone permission granted' : 'Microphone permission denied'}
				/>
			)}
		</div>
	);
});

VoiceInput.displayName = 'VoiceInput';

export default VoiceInput;

