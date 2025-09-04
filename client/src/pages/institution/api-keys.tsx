import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Snippet from '@/components/ui/Snippet';
import { 
  Key, 
  Plus, 
  Copy, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Trash2,
  CheckCircle,
  XCircle,
  Code
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: number;
  lastUsed?: number;
  status: 'active' | 'disabled';
}

interface CreateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateKey: (key: Omit<APIKey, 'id' | 'key' | 'createdAt'>) => void;
}

function CreateKeyDialog({ open, onOpenChange, onCreateKey }: CreateKeyDialogProps) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read:portfolio']);

  const availableScopes = [
    { id: 'read:portfolio', label: 'Read Portfolio', description: 'Access portfolio data and positions' },
    { id: 'read:analytics', label: 'Read Analytics', description: 'Access analytics and KPIs' },
    { id: 'create:alerts', label: 'Create Alerts', description: 'Create and manage alerts' },
    { id: 'simulate:strategies', label: 'Simulate Strategies', description: 'Run strategy simulations' }
  ];

  const handleScopeToggle = (scopeId: string) => {
    setScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const handleCreate = () => {
    if (!name.trim() || scopes.length === 0) return;
    
    onCreateKey({
      name: name.trim(),
      scopes,
      status: 'active'
    });
    
    setName('');
    setScopes(['read:portfolio']);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="key-name">Key Name</Label>
            <Input
              id="key-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Trading Bot"
            />
          </div>
          
          <div>
            <Label>Permissions</Label>
            <div className="space-y-2 mt-2">
              {availableScopes.map(scope => (
                <div key={scope.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={scope.id}
                    checked={scopes.includes(scope.id)}
                    onChange={() => handleScopeToggle(scope.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={scope.id} className="text-sm font-medium">
                      {scope.label}
                    </label>
                    <p className="text-xs text-gray-500">{scope.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || scopes.length === 0}>
              Create Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAPIKeys = () => {
    try {
      const stored = localStorage.getItem('blossom.api-keys');
      const keys = stored ? JSON.parse(stored) : [];
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const generateAPIKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'blossom_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createAPIKey = (keyData: Omit<APIKey, 'id' | 'key' | 'createdAt'>) => {
    const newKey: APIKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: generateAPIKey(),
      createdAt: Date.now(),
      ...keyData
    };

    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys as APIKey[]);
    localStorage.setItem('blossom.api-keys', JSON.stringify(updatedKeys));

    toast({
      title: "API Key Created",
      description: `${newKey.name} has been created successfully.`,
    });

    console.log('api:key:created', { id: newKey.id, name: newKey.name, scopes: newKey.scopes });
  };

  const toggleKeyStatus = (keyId: string) => {
    const updatedKeys = apiKeys.map(key => 
      key.id === keyId 
        ? { ...key, status: key.status === 'active' ? 'disabled' : 'active' }
        : key
    );
    setApiKeys(updatedKeys as APIKey[]);
    localStorage.setItem('blossom.api-keys', JSON.stringify(updatedKeys));
  };

  const deleteKey = (keyId: string) => {
    const updatedKeys = apiKeys.filter(key => key.id !== keyId);
    setApiKeys(updatedKeys as APIKey[]);
    localStorage.setItem('blossom.api-keys', JSON.stringify(updatedKeys));

    toast({
      title: "API Key Deleted",
      description: "The API key has been permanently deleted.",
    });
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
      
      toast({
        title: "Copied to Clipboard",
        description: "API key copied successfully.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '••••••••••••••••••••••••••••••••';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getScopeBadgeColor = (scope: string) => {
    const colors: Record<string, string> = {
      'read:portfolio': 'bg-blue-100 text-blue-800',
      'read:analytics': 'bg-green-100 text-green-800',
      'create:alerts': 'bg-orange-100 text-orange-800',
      'simulate:strategies': 'bg-purple-100 text-purple-800'
    };
    return colors[scope] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-gray-600">
          Manage API keys for programmatic access to Blossom AI services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Keys Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-pink-600" />
                  <span>Your API Keys</span>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                    {apiKeys.length}
                  </Badge>
                </CardTitle>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Key</span>
                    </Button>
                  </DialogTrigger>
                  <CreateKeyDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    onCreateKey={createAPIKey}
                  />
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No API keys created yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Create Your First API Key
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Scopes</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {maskKey(key.key)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(key.key, key.id)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedKey === key.id ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {key.scopes.map(scope => (
                                <Badge key={scope} className={`text-xs ${getScopeBadgeColor(scope)}`}>
                                  {scope.split(':')[0]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(key.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={key.status === 'active' ? 'default' : 'secondary'}
                              className={key.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {key.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKeyStatus(key.id)}
                                className="h-6 w-6 p-0"
                              >
                                {key.status === 'active' ? (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteKey(key.id)}
                                className="h-6 w-6 p-0 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-600" />
                <span>Usage Examples</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Get Portfolio</h4>
                <Snippet>{`curl -H 'Authorization: Bearer YOUR_KEY' \\
  https://api.blossom.ai/portfolio`}</Snippet>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Create Alert</h4>
                <Snippet>{`curl -X POST https://api.blossom.ai/alerts \\
  -H 'Authorization: Bearer YOUR_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{\"type\":\"apy_threshold\",\"asset\":\"USDC\"}'`}</Snippet>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Simulate Strategy</h4>
                <Snippet>{`curl -X POST https://api.blossom.ai/strategies/simulate \\
  -H 'Authorization: Bearer YOUR_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{\"message\":\"Deploy 1M USDC on Solana\"}'`}</Snippet>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Full API documentation and rate limits are available in our developer portal.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
