'use client';

import { Fragment } from 'react';

import { Dialog, Transition } from '@headlessui/react';
import { useMediaQuery } from 'hooks/useMediaQuery';
import { X } from 'lucide-react';

import { Drawer, DrawerContent, DrawerHeader, DrawerOverlay, DrawerTitle } from 'components/ui/drawer';

interface ModalProps {
	show: boolean;
	title: string;
	children: any;
	onHide: () => void;
	someRef: any;
	blockClose?: boolean;
	listeningOverlay?: React.ReactNode;
}

export default function Modal({ show, title, children, onHide, someRef, blockClose = false, listeningOverlay }: ModalProps) {
	const isDesktop = true; // useMediaQuery('(min-width: 768px)');

	const handleClose = () => {
		if (!blockClose) {
			onHide();
		}
	};

	return (
		<>
			{isDesktop ? (
				<Transition appear show={show} as={Fragment}>
					<Dialog initialFocus={someRef} open={show} as="div" className={`relative z-20 `} onClose={handleClose}>
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-500"
							enterFrom="opacity-0 sm:translate-y-0 sm:scale-100"
							enterTo="opacity-100 translate-y-0 sm:scale-100"
							leave="ease-out duration-100"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur" />
						</Transition.Child>
						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center text-center">
								<Transition.Child
									as={Fragment}
									enter="ease-out duration-300"
									enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
									enterTo="opacity-100 translate-y-0 sm:scale-100"
									leave="ease-out duration-100"
									leaveFrom="opacity-100"
									leaveTo="opacity-0"
								>
									<Dialog.Panel className="fixed bottom-0 w-full transform overflow-hidden bg-background p-4 text-left align-middle text-primary  shadow-lg transition-all sm:static sm:max-w-md sm:rounded-lg sm:border sm:border-border relative">
										{listeningOverlay && (
											<div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-lg flex items-center justify-center">
												{listeningOverlay}
											</div>
										)}
										<div className={listeningOverlay ? 'pointer-events-none opacity-50' : ''}>
											<Dialog.Title
												as="h2"
												className="mb-3 mt-[-4px] flex w-full items-center text-lg font-semibold text-primary"
											>
												{title}
												<button
													onClick={handleClose}
													disabled={blockClose}
													className={`absolute right-[4px] top-[3px] flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full text-primary transition-all duration-75 hover:bg-secondary focus:outline-none active:bg-secondary ${
														blockClose ? 'opacity-50 cursor-not-allowed' : ''
													}`}
												>
													<X className="h-5 w-5 text-primary" />
												</button>
											</Dialog.Title>
											{children}
										</div>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>
			) : (
				<Drawer open={show}>
					<DrawerOverlay onClick={handleClose} />
					<DrawerContent className="text-primary relative">
						{listeningOverlay && (
							<div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
								{listeningOverlay}
							</div>
						)}
						<div className={listeningOverlay ? 'pointer-events-none opacity-50' : ''}>
							<DrawerHeader className="text-left">
								<DrawerTitle>{title}</DrawerTitle>
							</DrawerHeader>
							<div className="p-4 pt-0 pb-8">{children}</div>
						</div>
					</DrawerContent>
				</Drawer>
			)}
		</>
	);
}
