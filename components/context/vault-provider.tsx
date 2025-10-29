'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const hasNoVaults = !isLoading && vaults.length === 0;

  const fetchVaults = async () => {
    try {
      const response = await fetch('/api/vaults');
      if (response.ok) {
        const data = await response.json();
        setVaults(data);
        
        // Set current vault from localStorage or default to first vault
        const savedVaultId = localStorage.getItem('currentVaultId');
        const vaultToSet = savedVaultId 
          ? data.find((v: Vault) => v.id === savedVaultId) || data[0]
          : data[0];
        
        if (vaultToSet) {
          setCurrentVault(vaultToSet);
          localStorage.setItem('currentVaultId', vaultToSet.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    await fetchVaults();
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

  useEffect(() => {
    fetchVaults();
  }, []);

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
