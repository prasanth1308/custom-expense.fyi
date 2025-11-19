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
}

export default function Modal({ show, title, children, onHide, someRef }: ModalProps) {
	const isDesktop = true; // useMediaQuery('(min-width: 768px)');

	return (
		<>
			{isDesktop ? (
				<Transition appear show={show} as={Fragment}>
					<Dialog initialFocus={someRef} open={show} as="div" className={`relative z-20 `} onClose={onHide}>
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
									enter="ease-out duration-500"
									enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90 sm:rotate-[-2deg]"
									enterTo="opacity-100 translate-y-0 sm:scale-100 sm:rotate-0"
									leave="ease-in duration-200"
									leaveFrom="opacity-100 translate-y-0 sm:scale-100 sm:rotate-0"
									leaveTo="opacity-0 translate-y-4 sm:scale-95 sm:rotate-2"
								>
									<Dialog.Panel className="fixed bottom-0 w-full transform overflow-hidden bg-background p-4 text-left align-middle text-primary shadow-2xl transition-all sm:static sm:max-w-md sm:rounded-lg sm:border sm:border-border animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4">
										<Dialog.Title
											as="h2"
											className="mb-3 mt-[-4px] flex w-full items-center text-lg font-semibold text-primary animate-in fade-in-0 slide-in-from-top-2 duration-300"
										>
											{title}
											<button
												onClick={onHide}
												className="absolute right-[4px] top-[3px] flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full text-primary transition-all duration-75 hover:bg-secondary focus:outline-none active:bg-secondary"
											>
												<X className="h-5 w-5 text-primary" />
											</button>
										</Dialog.Title>
										<div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
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
					<DrawerOverlay onClick={onHide} />
					<DrawerContent className="text-primary">
						<DrawerHeader className="text-left">
							<DrawerTitle>{title}</DrawerTitle>
						</DrawerHeader>
						<div className="p-4 pt-0 pb-8">{children}</div>
					</DrawerContent>
				</Drawer>
			)}
		</>
	);
}
