declare module 'text-filter';
declare module 'debounce';

declare module '*.svg' {
	const content: string;
	export default content;
}

// Web Speech API type declarations
interface SpeechRecognition extends EventTarget {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	serviceURI: string;
	grammars: SpeechGrammarList;
	start(): void;
	stop(): void;
	abort(): void;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
	onstart: (() => void) | null;
	onaudiostart: (() => void) | null;
	onaudioend: (() => void) | null;
	onsoundstart: (() => void) | null;
	onsoundend: (() => void) | null;
	onspeechstart: (() => void) | null;
	onspeechend: (() => void) | null;
	onnomatch: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message: string;
}

interface SpeechRecognitionResultList {
	length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
	isFinal: boolean;
}

interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

interface SpeechGrammarList {
	length: number;
	item(index: number): SpeechGrammar;
	addFromURI(src: string, weight?: number): void;
	addFromString(string: string, weight?: number): void;
	[index: number]: SpeechGrammar;
}

interface SpeechGrammar {
	src: string;
	weight: number;
}

interface Window {
	SpeechRecognition: {
		new (): SpeechRecognition;
	};
	webkitSpeechRecognition: {
		new (): SpeechRecognition;
	};
}
