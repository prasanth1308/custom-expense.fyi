'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Settings, Users, Lock, Unlock, AlertTriangle } from 'lucide-react';

import { Button } from 'components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from 'components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'components/ui/dropdown-menu';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Textarea } from 'components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Badge } from 'components/ui/badge';

import { useVault } from 'components/context/vault-provider';

interface VaultSwitcherProps {
  className?: string;
}

export function VaultSwitcher({ className }: VaultSwitcherProps) {
  const { currentVault, vaults, hasNoVaults, switchVault, createVault, shareVault, removeVaultMember } = useVault();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{id: string, email: string} | null>(null);
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultDescription, setNewVaultDescription] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('read');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateVault = async () => {
    if (!newVaultName.trim()) return;
    
    setIsLoading(true);
    try {
      await createVault(newVaultName.trim(), newVaultDescription.trim() || undefined);
      setNewVaultName('');
      setNewVaultDescription('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create vault:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareVault = async () => {
    if (!shareEmail.trim() || !currentVault) return;
    
    setIsLoading(true);
    try {
      await shareVault(currentVault.id, shareEmail.trim(), sharePermission);
      setShareEmail('');
      setSharePermission('read');
      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('Failed to share vault:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMemberClick = (member: {id: string, email: string}) => {
    setMemberToRemove(member);
    setIsRemoveConfirmOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!currentVault || !memberToRemove) return;
    
    setIsLoading(true);
    try {
      await removeVaultMember(currentVault.id, memberToRemove.id);
      setIsRemoveConfirmOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentVault) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Don't render if there are no vaults
  if (hasNoVaults) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Vault Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-blue-500" />
              <span className="font-medium">{currentVault.name}</span>
              {currentVault.is_owner && (
                <Badge variant="secondary" className="text-xs">
                  Owner
                </Badge>
              )}
              {!currentVault.is_owner && (
                <Badge variant="outline" className="text-xs">
                  {currentVault.permission === 'write' ? 'Write' : 'Read'}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {vaults.map((vault) => (
            <DropdownMenuItem
              key={vault.id}
              onClick={() => switchVault(vault.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span>{vault.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {vault.is_owner && (
                  <Badge variant="secondary" className="text-xs">
                    Owner
                  </Badge>
                )}
                {!vault.is_owner && (
                  <Badge variant="outline" className="text-xs">
                    {vault.permission === 'write' ? 'Write' : 'Read'}
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          {vaults.length < 3 && (
            <>
              <div className="border-t my-1" />
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Vault
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Vault</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vault-name">Vault Name</Label>
                      <Input
                        id="vault-name"
                        value={newVaultName}
                        onChange={(e) => setNewVaultName(e.target.value)}
                        placeholder="Enter vault name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vault-description">Description (Optional)</Label>
                      <Textarea
                        id="vault-description"
                        value={newVaultDescription}
                        onChange={(e) => setNewVaultDescription(e.target.value)}
                        placeholder="Enter vault description"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateVault}
                        disabled={!newVaultName.trim() || isLoading}
                      >
                        {isLoading ? 'Creating...' : 'Create Vault'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Vault Management */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Vault Management
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vault Info */}
            <div>
              <h3 className="font-medium mb-2">Vault Information</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-gray-600">Name</Label>
                  <p className="font-medium">{currentVault.name}</p>
                </div>
                {currentVault.description && (
                  <div>
                    <Label className="text-sm text-gray-600">Description</Label>
                    <p className="text-sm">{currentVault.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-600">Your Permission</Label>
                  <Badge variant={currentVault.permission === 'write' ? 'default' : 'outline'}>
                    {currentVault.permission === 'write' ? (
                      <>
                        <Unlock className="h-3 w-3 mr-1" />
                        Write Access
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Read Access
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Share Vault */}
            {currentVault.permission === 'write' && (
              <div>
                <h3 className="font-medium mb-2">Share Vault</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="share-email">Email Address</Label>
                    <Input
                      id="share-email"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="Enter user email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="share-permission">Permission</Label>
                    <Select value={sharePermission} onValueChange={(value: 'read' | 'write') => setSharePermission(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Read Only
                          </div>
                        </SelectItem>
                        <SelectItem value="write">
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4" />
                            Read & Write
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleShareVault}
                    disabled={!shareEmail.trim() || isLoading}
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isLoading ? 'Sharing...' : 'Share Vault'}
                  </Button>
                </div>
              </div>
            )}

            {/* Vault Members */}
            <div>
              <h3 className="font-medium mb-2">Vault Members</h3>
              <div className="space-y-2">
                {currentVault.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{member.email}</p>
                      <Badge variant={member.permission === 'write' ? 'default' : 'outline'} className="text-xs">
                        {member.permission === 'write' ? 'Write' : 'Read'}
                      </Badge>
                    </div>
                    {currentVault.permission === 'write' && member.id !== currentVault.owner_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMemberClick({id: member.id, email: member.email})}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Member
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Are you sure you want to remove this member?</p>
                <p className="text-sm text-red-600 mt-1">
                  <strong>{memberToRemove?.email}</strong> will lose access to this vault and won&apos;t be able to view or edit any data.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>This action cannot be undone.</strong> If you want to give them access again, you&apos;ll need to share the vault with them again.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemoveConfirmOpen(false);
                  setMemberToRemove(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRemoveMember}
                disabled={isLoading}
              >
                {isLoading ? 'Removing...' : 'Remove Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
