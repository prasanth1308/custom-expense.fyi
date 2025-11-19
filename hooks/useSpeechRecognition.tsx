'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
	lang?: string;
	continuous?: boolean;
	interimResults?: boolean;
	autoStop?: boolean;
	silenceTimeout?: number; // in milliseconds
	onTranscript?: (transcript: string) => void;
	onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
	transcript: string;
	isListening: boolean;
	error: string | null;
	isSupported: boolean;
	permissionStatus: PermissionState | null;
	startListening: () => Promise<void>;
	stopListening: () => void;
	reset: () => void;
	requestPermission: () => Promise<boolean>;
}

export function useSpeechRecognition(
	options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
	const {
		lang = 'en-US',
		continuous = false,
		interimResults = true,
		autoStop = true,
		silenceTimeout = 3000,
		onTranscript,
		onError,
	} = options;

	const [transcript, setTranscript] = useState('');
	const [isListening, setIsListening] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSupported, setIsSupported] = useState(false);
	const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastTranscriptTimeRef = useRef<number>(Date.now());
	const stopListeningRef = useRef<(() => void) | null>(null);
	const onTranscriptRef = useRef<((text: string) => void) | undefined>(onTranscript);
	const onErrorRef = useRef<((error: string) => void) | undefined>(onError);
	const isStoppingRef = useRef<boolean>(false);
	const accumulatedFinalTranscriptRef = useRef<string>('');
	const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Update refs when callbacks change
	useEffect(() => {
		onTranscriptRef.current = onTranscript;
		onErrorRef.current = onError;
	}, [onTranscript, onError]);

	// Check browser support and initial permission status
	useEffect(() => {
		const SpeechRecognition =
			window.SpeechRecognition || (window as any).webkitSpeechRecognition;
		setIsSupported(!!SpeechRecognition);

		// Check initial permission status if Permissions API is available
		if (navigator.permissions && navigator.permissions.query) {
			navigator.permissions
				.query({ name: 'microphone' as PermissionName })
				.then((result) => {
					setPermissionStatus(result.state);
					// Listen for permission changes
					result.onchange = () => {
						setPermissionStatus(result.state);
					};
				})
				.catch(() => {
					// Permissions API might not support microphone query in some browsers
					// This is okay, we'll request permission when needed
				});
		}
	}, []);

	// Initialize recognition
	useEffect(() => {
		if (!isSupported) return;

		const SpeechRecognition =
			window.SpeechRecognition || (window as any).webkitSpeechRecognition;
		const recognition = new SpeechRecognition();

		recognition.lang = lang;
		recognition.continuous = continuous;
		recognition.interimResults = interimResults;

		// Event handlers
		const handleResult = (event: SpeechRecognitionEvent) => {
			let finalTranscript = '';
			let hasFinal = false;

			// Only process final results, ignore interim results
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) {
					const transcript = event.results[i][0].transcript;
					finalTranscript += transcript + ' ';
					hasFinal = true;
				}
			}

			// Accumulate final transcripts
			if (hasFinal && finalTranscript) {
				accumulatedFinalTranscriptRef.current += finalTranscript;
				const accumulatedText = accumulatedFinalTranscriptRef.current.trim();
				
				// Update transcript state for display (but don't process yet)
				setTranscript(accumulatedText);
				lastTranscriptTimeRef.current = Date.now();

				// Clear any existing process timeout
				if (processTimeoutRef.current) {
					clearTimeout(processTimeoutRef.current);
				}

				// Wait 1.5 seconds after last final result before processing
				processTimeoutRef.current = setTimeout(() => {
					const finalText = accumulatedFinalTranscriptRef.current.trim();
					if (finalText && onTranscriptRef.current) {
						// Process the complete accumulated transcript
						onTranscriptRef.current(finalText);
						// Reset accumulation after processing
						accumulatedFinalTranscriptRef.current = '';
					}
					if (processTimeoutRef.current) {
						clearTimeout(processTimeoutRef.current);
						processTimeoutRef.current = null;
					}
				}, 1500); // 1.5 second delay
			}

			// Reset silence timeout on new final results
			if (autoStop && hasFinal) {
				if (silenceTimeoutRef.current) {
					clearTimeout(silenceTimeoutRef.current);
				}
				silenceTimeoutRef.current = setTimeout(() => {
					// stopListening will check isListening internally
					if (stopListeningRef.current) {
						stopListeningRef.current();
					}
				}, silenceTimeout);
			}
		};

		const handleError = (event: SpeechRecognitionErrorEvent) => {
			// Don't process errors if we're in the process of stopping
			if (isStoppingRef.current && (event.error === 'aborted' || event.error === 'no-speech')) {
				return;
			}

			let errorMessage = 'Speech recognition error';
			
			switch (event.error) {
				case 'no-speech':
					errorMessage = 'No speech detected';
					break;
				case 'aborted':
					// User or system aborted, not a real error - don't report it
					isStoppingRef.current = false;
					return;
				case 'audio-capture':
					errorMessage = 'Microphone not accessible';
					break;
				case 'network':
					errorMessage = 'Network error';
					break;
				case 'not-allowed':
					errorMessage = 'Microphone permission denied';
					break;
				case 'service-not-allowed':
					errorMessage = 'Speech recognition service not allowed';
					break;
				default:
					errorMessage = `Speech recognition error: ${event.error}`;
			}

			isStoppingRef.current = false;
			setError(errorMessage);
			setIsListening(false);
			if (onErrorRef.current) {
				onErrorRef.current(errorMessage);
			}
		};

		const handleEnd = () => {
			isStoppingRef.current = false;
			setIsListening(false);
			if (silenceTimeoutRef.current) {
				clearTimeout(silenceTimeoutRef.current);
				silenceTimeoutRef.current = null;
			}
			// Process any remaining accumulated transcript when recognition ends
			if (processTimeoutRef.current) {
				clearTimeout(processTimeoutRef.current);
				processTimeoutRef.current = null;
			}
			const finalText = accumulatedFinalTranscriptRef.current.trim();
			if (finalText && onTranscriptRef.current) {
				// Process the complete accumulated transcript immediately when recognition ends
				onTranscriptRef.current(finalText);
				accumulatedFinalTranscriptRef.current = '';
			}
		};

		const handleStart = () => {
			setIsListening(true);
			setError(null);
			lastTranscriptTimeRef.current = Date.now();
		};

		recognition.addEventListener('result', handleResult as EventListener);
		recognition.addEventListener('error', handleError as EventListener);
		recognition.addEventListener('end', handleEnd);
		recognition.addEventListener('start', handleStart);

		recognitionRef.current = recognition;

		// Cleanup function
		return () => {
			if (recognitionRef.current) {
				try {
					recognitionRef.current.removeEventListener('result', handleResult as EventListener);
					recognitionRef.current.removeEventListener('error', handleError as EventListener);
					recognitionRef.current.removeEventListener('end', handleEnd);
					recognitionRef.current.removeEventListener('start', handleStart);
					recognitionRef.current.abort();
				} catch (e) {
					// Ignore errors during cleanup
				}
				recognitionRef.current = null;
			}
			if (silenceTimeoutRef.current) {
				clearTimeout(silenceTimeoutRef.current);
				silenceTimeoutRef.current = null;
			}
			if (processTimeoutRef.current) {
				clearTimeout(processTimeoutRef.current);
				processTimeoutRef.current = null;
			}
			accumulatedFinalTranscriptRef.current = '';
		};
	}, [isSupported, lang, continuous, interimResults, autoStop, silenceTimeout]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (recognitionRef.current) {
				try {
					recognitionRef.current.abort();
				} catch (e) {
					// Ignore errors during cleanup
				}
				recognitionRef.current = null;
			}
			if (silenceTimeoutRef.current) {
				clearTimeout(silenceTimeoutRef.current);
				silenceTimeoutRef.current = null;
			}
			if (processTimeoutRef.current) {
				clearTimeout(processTimeoutRef.current);
				processTimeoutRef.current = null;
			}
			accumulatedFinalTranscriptRef.current = '';
		};
	}, []);

	// Check microphone permission
	const checkPermission = useCallback(async (): Promise<boolean> => {
		try {
			// Try using Permissions API if available
			if (navigator.permissions && navigator.permissions.query) {
				const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
				setPermissionStatus(result.state);
				
				if (result.state === 'granted') {
					return true;
				} else if (result.state === 'prompt') {
					// Permission needs to be requested
					return false;
				} else {
					// Permission denied
					setError('Microphone permission denied. Please enable it in your browser settings.');
					if (onErrorRef.current) {
						onErrorRef.current('Microphone permission denied');
					}
					return false;
				}
			}

			// Fallback: Try to get user media to trigger permission prompt
			// This will request permission if not already granted
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				// Stop the stream immediately, we just needed to check/request permission
				stream.getTracks().forEach((track) => track.stop());
				setPermissionStatus('granted');
				return true;
			} catch (err: any) {
				if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
					setPermissionStatus('denied');
					setError('Microphone permission denied. Please enable it in your browser settings.');
					if (onErrorRef.current) {
						onErrorRef.current('Microphone permission denied');
					}
					return false;
				}
				// Other errors (e.g., no microphone available)
				setPermissionStatus('prompt');
				return false;
			}
		} catch (err) {
			// Permissions API not available, try getUserMedia as fallback
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				stream.getTracks().forEach((track) => track.stop());
				setPermissionStatus('granted');
				return true;
			} catch (mediaErr: any) {
				if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
					setPermissionStatus('denied');
					setError('Microphone permission denied. Please enable it in your browser settings.');
					if (onErrorRef.current) {
						onErrorRef.current('Microphone permission denied');
					}
					return false;
				}
				return false;
			}
		}
	}, []);

	// Request microphone permission
	const requestPermission = useCallback(async (): Promise<boolean> => {
		return await checkPermission();
	}, [checkPermission]);

	const startListening = useCallback(async () => {
		if (!isSupported || !recognitionRef.current) {
			setError('Speech recognition not supported');
			if (onErrorRef.current) {
				onErrorRef.current('Speech recognition not supported');
			}
			return;
		}

		if (isListening) {
			return;
		}

		// Check permission status
		if (permissionStatus === 'denied') {
			setError('Microphone permission denied. Please enable it in your browser settings.');
			if (onErrorRef.current) {
				onErrorRef.current('Microphone permission denied');
			}
			return;
		}

		// Request permission if not granted
		if (permissionStatus !== 'granted') {
			const hasPermission = await checkPermission();
			if (!hasPermission) {
				// Permission was denied or needs user interaction
				// Only show error if permission status is 'prompt' (not denied or null)
				if (permissionStatus === 'prompt') {
					setError('Microphone permission is required. Please allow access when prompted.');
					if (onErrorRef.current) {
						onErrorRef.current('Microphone permission required');
					}
				}
				return;
			}
		}

		try {
			setError(null);
			recognitionRef.current.start();
		} catch (err: any) {
			let errorMsg = 'Failed to start speech recognition';
			
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				errorMsg = 'Microphone permission denied. Please enable it in your browser settings.';
				setPermissionStatus('denied');
			} else if (err.message) {
				errorMsg = err.message;
			}
			
			setError(errorMsg);
			if (onErrorRef.current) {
				onErrorRef.current(errorMsg);
			}
		}
	}, [isSupported, isListening, permissionStatus, checkPermission]);

	const stopListening = useCallback(() => {
		// Prevent recursive calls
		if (isStoppingRef.current) {
			return;
		}

		if (!recognitionRef.current || !isListening) {
			return;
		}

		// Set flag to prevent recursive calls
		isStoppingRef.current = true;

		try {
			recognitionRef.current.stop();
		} catch (err) {
			// Reset flag on error
			isStoppingRef.current = false;
			// Ignore errors when stopping - don't log to prevent infinite loops
		}

		if (silenceTimeoutRef.current) {
			clearTimeout(silenceTimeoutRef.current);
			silenceTimeoutRef.current = null;
		}
	}, [isListening]);

	// Update ref when stopListening changes
	useEffect(() => {
		stopListeningRef.current = stopListening;
	}, [stopListening]);

	const reset = useCallback(() => {
		setTranscript('');
		setError(null);
		accumulatedFinalTranscriptRef.current = '';
		if (processTimeoutRef.current) {
			clearTimeout(processTimeoutRef.current);
			processTimeoutRef.current = null;
		}
		if (isListening) {
			stopListening();
		}
	}, [isListening, stopListening]);

	return {
		transcript,
		isListening,
		error,
		isSupported,
		permissionStatus,
		startListening,
		stopListening,
		reset,
		requestPermission,
	};
}

