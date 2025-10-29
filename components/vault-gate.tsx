'use client';

import { useVault } from 'components/context/vault-provider';
import { NoVaultsPrompt } from 'components/no-vaults-prompt';

interface VaultGateProps {
  children: React.ReactNode;
}

export function VaultGate({ children }: VaultGateProps) {
  const { hasNoVaults, isLoading } = useVault();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasNoVaults) {
    return <NoVaultsPrompt />;
  }

  return <>{children}</>;
}
