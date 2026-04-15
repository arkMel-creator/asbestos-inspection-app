import { useState } from 'react';
import { ShareLink } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Share2, Copy, Link2, Eye, Calendar, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SharingProps {
  shareLinks: ShareLink[];
  onCreateLink: (link: Omit<ShareLink, 'id' | 'url' | 'createdAt' | 'views'>) => void;
  onDeleteLink: (id: string) => void;
  canManage: boolean;
}

export function Sharing({ shareLinks, onCreateLink, onDeleteLink, canManage }: SharingProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({
    name: '',
    accessType: 'view-only' as 'view-only' | 'edit',
    accessScope: 'public' as 'public' | 'password' | 'restricted',
    password: '',
    allowedEmailsText: '',
    createdBy: 'Current User',
    expiresAt: ''
  });

  const handleCreateLink = () => {
    if (newLink.name) {
      onCreateLink({
        name: newLink.name,
        accessType: newLink.accessType,
        accessScope: newLink.accessScope,
        password: newLink.accessScope === 'password' ? newLink.password : undefined,
        allowedEmails: newLink.accessScope === 'restricted'
          ? newLink.allowedEmailsText.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        createdBy: newLink.createdBy,
        expiresAt: newLink.expiresAt
      });
      setNewLink({
        name: '',
        accessType: 'view-only',
        accessScope: 'public',
        password: '',
        allowedEmailsText: '',
        createdBy: 'Current User',
        expiresAt: ''
      });
      setIsCreateDialogOpen(false);
      toast.success('Share link created successfully!');
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const stats = {
    total: shareLinks.length,
    active: shareLinks.filter(l => !isExpired(l.expiresAt)).length,
    expired: shareLinks.filter(l => isExpired(l.expiresAt)).length,
    totalViews: shareLinks.reduce((sum, link) => sum + link.views, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1">Share Links</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage shareable links for external access
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canManage}>
              <Share2 className="mr-2 h-4 w-4" />
              Create Share Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Share Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="linkName">Link Name</Label>
                <Input
                  id="linkName"
                  placeholder="e.g., Client Review Link"
                  value={newLink.name}
                  onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessType">Access Type</Label>
                <Select 
                  value={newLink.accessType} 
                  onValueChange={(value: any) => setNewLink({ ...newLink, accessType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view-only">View Only</SelectItem>
                    <SelectItem value="edit">Edit Access</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newLink.accessType === 'view-only' 
                    ? 'Recipients can only view content, no editing allowed'
                    : 'Recipients can view and edit overlays and files'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessScope">Access Scope</Label>
                <Select 
                  value={newLink.accessScope} 
                  onValueChange={(value: any) => setNewLink({ ...newLink, accessScope: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (link-only)</SelectItem>
                    <SelectItem value="password">Password protected</SelectItem>
                    <SelectItem value="restricted">Email restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newLink.accessScope === 'password' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Set a password"
                    value={newLink.password}
                    onChange={(e) => setNewLink({ ...newLink, password: e.target.value })}
                  />
                </div>
              )}

              {newLink.accessScope === 'restricted' && (
                <div className="space-y-2">
                  <Label htmlFor="emails">Allowed Emails</Label>
                  <Input
                    id="emails"
                    placeholder="email1@company.com, email2@client.com"
                    value={newLink.allowedEmailsText}
                    onChange={(e) => setNewLink({ ...newLink, allowedEmailsText: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple emails with commas
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={newLink.expiresAt}
                  onChange={(e) => setNewLink({ ...newLink, expiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLink}>Create Link</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Links</p>
                <p className="text-2xl mt-1">{stats.total}</p>
              </div>
              <Link2 className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Links</p>
                <p className="text-2xl mt-1">{stats.active}</p>
              </div>
              <Share2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl mt-1">{stats.expired}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl mt-1">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Share2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-900 mb-1">How Share Links Work</h4>
              <p className="text-sm text-blue-800">
                Share links allow external users to access your maps and files without requiring an account. 
                You can set view-only or edit permissions, and optionally add an expiration date for added security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Links Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link Name</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead>Access Scope</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm">{link.name}</p>
                      <p className="text-xs text-muted-foreground">
                        by {link.createdBy}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      link.accessType === 'view-only' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }>
                      {link.accessType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-slate-100 text-slate-800">
                      {link.accessScope || 'public'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(link.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {link.expiresAt ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(link.expiresAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {link.views}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired(link.expiresAt) ? (
                      <Badge className="bg-red-100 text-red-800">Expired</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.url, link.id)}
                        disabled={isExpired(link.expiresAt)}
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {copiedId === link.id ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteLink(link.id)}
                        disabled={!canManage}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {shareLinks.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No share links created yet</p>
              <p className="text-sm">Create a link to share your maps with others</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
