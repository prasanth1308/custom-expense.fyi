'use client';

import { useState } from 'react';
import { Plus, Vault, Users } from 'lucide-react';

import { Button } from 'components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';

import { useVault } from 'components/context/vault-provider';

export function NoVaultsPrompt() {
  const { createVault } = useVault();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [vaultDescription, setVaultDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateVault = async () => {
    if (!vaultName.trim()) {
      setError('Vault name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createVault(vaultName.trim(), vaultDescription.trim() || undefined);
      setIsCreateDialogOpen(false);
      setVaultName('');
      setVaultDescription('');
    } catch (error: any) {
      setError(error.message || 'Failed to create vault');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Vault className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">No Vaults Found</CardTitle>
          <CardDescription>
            You need to create a vault to start tracking your expenses. Vaults help you organize your financial data and share it with others.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Vault className="h-4 w-4" />
              <span>Create up to 3 personal vaults</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Share vaults with read/write permissions</span>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Vault
          </Button>
        </CardContent>
      </Card>

      {/* Create Vault Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Vault</DialogTitle>
            <DialogDescription>
              Choose a name for your vault. You can always change this later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vault-name">Vault Name *</Label>
              <Input
                id="vault-name"
                placeholder="My Personal Vault"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vault-description">Description (Optional)</Label>
              <Textarea
                id="vault-description"
                placeholder="A brief description of this vault..."
                value={vaultDescription}
                onChange={(e) => setVaultDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setVaultName('');
                  setVaultDescription('');
                  setError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVault}
                disabled={isLoading || !vaultName.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Vault'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
