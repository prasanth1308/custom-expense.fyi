'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import { getSWRConfig } from 'lib/swr-config';
import { getVaultsCacheKey } from 'lib/cache-keys';

interface Vault {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  permission: 'read' | 'write';
  is_owner: boolean;
  members?: Array<{
    id: string;
    email: string;
    permission: 'read' | 'write';
  }>;
}

interface VaultContextType {
  currentVault: Vault | null;
  vaults: Vault[];
  isLoading: boolean;
  hasNoVaults: boolean;
  switchVault: (vaultId: string) => void;
  refreshVaults: () => Promise<void>;
  createVault: (name: string, description?: string) => Promise<void>;
  shareVault: (vaultId: string, userEmail: string, permission: 'read' | 'write') => Promise<void>;
  removeVaultMember: (vaultId: string, userId: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);
  const router = useRouter();
  const vaultsCacheKey = getVaultsCacheKey();
  const swrConfig = getSWRConfig('less-dynamic');

  const { data: vaultsData = [], isLoading, mutate } = useSWR<Vault[]>(
    vaultsCacheKey,
    swrConfig
  );

  const vaults = vaultsData || [];
  const hasNoVaults = !isLoading && vaults.length === 0;

  useEffect(() => {
    if (vaults.length > 0) {
      // Set current vault from localStorage or default to first vault
      const savedVaultId = localStorage.getItem('currentVaultId');
      const vaultToSet = savedVaultId 
        ? vaults.find((v: Vault) => v.id === savedVaultId) || vaults[0]
        : vaults[0];
      
      if (vaultToSet) {
        setCurrentVault(vaultToSet);
        localStorage.setItem('currentVaultId', vaultToSet.id);
      }
    }
  }, [vaults]);

  const switchVault = (vaultId: string) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      setCurrentVault(vault);
      localStorage.setItem('currentVaultId', vaultId);
      // Refresh the page to update all data with new vault context
      router.refresh();
    }
  };

  const refreshVaults = async () => {
    await mutate(undefined, { revalidate: true });
  };

  const createVault = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      
      if (response.ok) {
        await refreshVaults();
      } else {
        throw new Error('Failed to create vault');
      }
    } catch (error) {
      console.error('Failed to create vault:', error);
      throw error;
    }
  };

  const shareVault = async (vaultId: string, userEmail: string, permission: 'read' | 'write') => {
    try {
      const response = await fetch(`/api/vaults/${vaultId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, permission }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to share vault');
      }
      
      // Refresh vaults to get updated member list
      await refreshVaults();
    } catch (error) {
      console.error('Failed to share vault:', error);
      throw error;
    }
  };

  const removeVaultMember = async (vaultId: string, userId: string) => {
    try {
      const response = await fetch(`/api/vaults/${vaultId}/members/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove vault member');
      }
      
      await refreshVaults();
    } catch (error) {
      console.error('Failed to remove vault member:', error);
      throw error;
    }
  };

  // Vaults are fetched via SWR, no need for manual fetch

  return (
    <VaultContext.Provider
      value={{
        currentVault,
        vaults,
        isLoading,
        hasNoVaults,
        switchVault,
        refreshVaults,
        createVault,
        shareVault,
        removeVaultMember,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
