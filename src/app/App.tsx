import { useEffect, useRef, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { MapView } from './components/MapView';
import { UserManagement } from './components/UserManagement';
import { Sharing } from './components/Sharing';
import { AuditLog } from './components/AuditLog';
import { OfflineQueue } from './components/OfflineQueue';
import { GlobalSearch } from './components/GlobalSearch';
import { Workspace } from './components/Workspace';
import { Reports } from './components/Reports';
import { MapOverlay, User, ShareLink, FileItem, Sample, AuditLogEntry, SyncQueueItem, Project } from './types';
import { Button } from './components/ui/button';
import { LayoutDashboard, Map, Users, Share2, Menu, X, ClipboardList, History, LogOut, CloudOff, Search, Briefcase, Plus, MapPin, Filter, ChevronRight, Edit2, ArrowLeft, Check, FileClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Label } from './components/ui/label';
import { Input } from './components/ui/input';
import { toast, Toaster } from 'sonner';
import { api, getToken, setToken } from './lib/api';

type View = 'dashboard' | 'projects' | 'create-project' | 'edit-project' | 'workspace' | 'map' | 'users' | 'sharing' | 'audit' | 'offline' | 'search' | 'reports' | 'project-log';

const jobCategories = ['Asbestos Survey', 'Air Monitoring', 'Clearance Inspection', 'Management Plan', 'Remediation Oversight'];
const jobTemplates = ['Standard Div 6', 'Residential Management', 'Commercial Audit', 'Pre-Demolition'];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [overlays, setOverlays] = useState<MapOverlay[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [filesFolder, setFilesFolder] = useState<string>('/Projects');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<'samples' | 'files' | 'reports'>('samples');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [currentProjectsTab, setCurrentProjectsTab] = useState<'active' | 'completed' | 'all'>('active');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'inspector';
  const canManageUsers = currentUser?.role === 'admin';
  const canManageSharing = currentUser?.role === 'admin' || currentUser?.role === 'inspector';
  const canManageSchema = currentUser?.role === 'admin';
  const canViewAudit = currentUser?.role === 'admin';

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setFilesFolder(`/Projects/${project.name}`);
    setWorkspaceTab('samples');
    setCurrentView('workspace');
  };

  const calculateNextJobNumber = () => {
    if (projects.length === 0) return 'A000000';
    
    // Find highest job number starting with 'A'
    const jobNumbers = projects
      .map(p => p.jobNumber || '')
      .filter(n => n.startsWith('A') && /A\d{6}/.test(n))
      .map(n => parseInt(n.substring(1)))
      .sort((a, b) => b - a);
      
    const nextNum = jobNumbers.length > 0 ? jobNumbers[0] + 1 : projects.length;
    return `A${String(nextNum).padStart(6, '0')}`;
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const saved = await api.createProject(projectData);
      setProjects([saved, ...projects]);
      toast.success('Project created successfully');
      addAudit('Created project', saved.name);
      return saved;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
      return null;
    }
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updated = await api.updateProject(id, updates);
      setProjects(projects.map(p => p.id === id ? updated : p));
      if (selectedProject?.id === id) setSelectedProject(updated);
      toast.success('Project updated');
      addAudit('Updated project', updated.name);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
      toast.success('Project deleted');
      addAudit('Deleted project', id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    }
  };

  // Overlay management
  const handleUpdateOverlay = (id: string, updates: Partial<MapOverlay>) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
    addAudit('Updated overlay', id);
    queueIfOffline('update', 'overlay', { id, updates });
  };

  const handleReorderOverlay = (id: string, direction: 'up' | 'down') => {
    const ordered = [...overlays].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const index = ordered.findIndex(o => o.id === id);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index + 1 : index - 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;
    const current = ordered[index];
    const target = ordered[swapIndex];
    const currentZ = current.zIndex ?? index + 1;
    const targetZ = target.zIndex ?? swapIndex + 1;
    current.zIndex = targetZ;
    target.zIndex = currentZ;
    setOverlays(ordered);
  };

  const handleDeleteOverlay = async (id: string) => {
    setOverlays(overlays.filter(o => o.id !== id));
    setFiles(files.map(f => f.overlayId === id ? { ...f, isOverlay: false, overlayId: undefined } : f));
    const affected = files.filter(f => f.overlayId === id);
    try {
      await Promise.all(affected.map(file => api.updateFile(file.id, { isOverlay: false, overlayId: null })));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update overlay file');
    }
    toast.success('Overlay removed from map');
    addAudit('Deleted overlay', id);
    queueIfOffline('delete', 'overlay', { id });
  };

  const handleAddOverlay = async (file: File) => {
    try {
      const projectName = selectedProject?.name || 'Unassigned';
      const uploaded = await api.uploadFile(file, {
        isOverlay: true,
        uploadedBy: currentUser?.name || 'Current User',
        folderPath: `/Projects/${projectName}/Maps/Overlays`
      });

      await api.updateFile(uploaded.id, { isOverlay: true, overlayId: uploaded.id });

      const newOverlay: MapOverlay = {
        id: uploaded.id,
        name: uploaded.name,
        url: uploaded.url,
        type: uploaded.type === 'pdf' ? 'pdf' : uploaded.type === 'video' ? 'video' : 'image',
        position: { x: 100, y: 100 },
        size: { width: 500, height: 400 },
        rotation: 0,
        opacity: 0.8,
        locked: false,
        visible: true,
        zIndex: overlays.length + 1,
        uploadedBy: uploaded.uploadedBy,
        uploadedAt: uploaded.uploadedAt
      };

      setFiles(prev => [...prev, { ...uploaded, isOverlay: true, overlayId: uploaded.id }]);
      setOverlays(prev => [...prev, newOverlay]);
      addAudit('Added overlay', uploaded.name);
      queueIfOffline('create', 'overlay', { name: uploaded.name });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add overlay');
    }
  };

  const handleAddFile = async (file: File) => {
    try {
      const projectName = selectedProject?.name || 'Unassigned';
      const uploaded = await api.uploadFile(file, {
        isOverlay: false,
        uploadedBy: currentUser?.name || 'Current User',
        folderPath: `/Projects/${projectName}/General/Uploads`
      });
      setFiles(prev => [...prev, uploaded]);
      addAudit('Uploaded file', uploaded.name);
      queueIfOffline('upload', 'file', { name: uploaded.name });
      return uploaded.id;
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file');
      return '';
    }
  };

  const handleDeleteFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.isOverlay && file.overlayId) {
      setOverlays(overlays.filter(o => o.id !== file.overlayId));
    }
    try {
      await api.deleteFile(id);
      setFiles(files.filter(f => f.id !== id));
      toast.success('File deleted');
      addAudit('Deleted file', file?.name || id);
      queueIfOffline('delete', 'file', { id, name: file?.name });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete file');
    }
  };

  const handleAddToMap = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const newOverlay: MapOverlay = {
      id: file.id,
      name: file.name,
      url: file.url,
      type: file.type as 'image' | 'pdf' | 'video',
      position: { x: 150, y: 150 },
      size: { width: 500, height: 400 },
      rotation: 0,
      opacity: 0.8,
      locked: false,
      visible: true,
      zIndex: overlays.length + 1,
      uploadedBy: file.uploadedBy,
      uploadedAt: new Date().toISOString()
    };

    setOverlays([...overlays, newOverlay]);
    setFiles(files.map(f => f.id === fileId ? { ...f, isOverlay: true, overlayId: file.id } : f));
    try {
      await api.updateFile(fileId, { isOverlay: true, overlayId: file.id });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update file');
    }
    toast.success('File added to map');
    addAudit('Linked file to map', file?.name || fileId);
    queueIfOffline('update', 'file', { id: fileId, action: 'addToMap' });
    setCurrentView('map');
  };

  const handleCreateSampleFromFile = async (file: File, location?: { x: number; y: number }) => {
    const fileId = await handleAddFile(file);
    if (!fileId) return '';
    const nextIndex = 1000 + samples.length + 1;
    const sampleId = `S-${nextIndex}`;
    const newSample: Sample = {
      id: sampleId,
      sampleNo: sampleId,
      location: selectedProject?.site || 'Unassigned',
      itemDescription: 'Created from file',
      materialType: 'Unknown',
      sampleType: 'Photo',
      collectionDate: new Date().toISOString().split('T')[0],
      assessmentStatus: 'pending',
      collector: currentUser?.name || 'Current User',
      notes: `Created from file: ${file.name}`,
      locationPoint: location,
      linkedFileIds: [fileId]
    };
    try {
      const saved = await api.createSample(newSample);
      setSamples([saved, ...samples]);
      await api.updateFile(fileId, { linkedSampleIds: [sampleId] });
      setFiles(files.map(f => f.id === fileId ? { ...f, linkedSampleIds: [sampleId] } : f));
      return saved.id;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create sample');
      return '';
    }
  };

  const handleLinkFileToSample = async (fileId: string, sampleId: string) => {
    const linkedIds = (() => {
      const file = files.find(f => f.id === fileId);
      const linked = new Set(file?.linkedSampleIds || []);
      linked.add(sampleId);
      return Array.from(linked);
    })();
    setFiles(files.map(f => {
      if (f.id !== fileId) return f;
      return { ...f, linkedSampleIds: linkedIds };
    }));
    setSamples(samples.map(s => {
      if (s.id !== sampleId) return s;
      const linked = new Set(s.linkedFileIds || []);
      linked.add(fileId);
      return { ...s, linkedFileIds: Array.from(linked) };
    }));
    try {
      await api.updateFile(fileId, { linkedSampleIds: linkedIds });
      toast.success('File linked to sample');
    } catch (err: any) {
      toast.error(err.message || 'Failed to link file');
    }
    addAudit('Linked file to sample', `${fileId} -> ${sampleId}`);
  };

  const handleAddUser = async (userData: Omit<User, 'id' | 'createdAt' | 'lastActive'> & { password?: string }) => {
    try {
      const newUser = await api.createUser({
        username: userData.username || userData.email || userData.name,
        password: userData.password || 'admin123',
        role: userData.role,
        name: userData.name,
        email: userData.email
      });
      setUsers(prev => [newUser, ...prev]);
      toast.success('User added successfully');
      addAudit('Added user', newUser.name);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add user');
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      await api.updateUser(id, updates);
      const refreshed = await api.fetchUsers();
      setUsers(refreshed);
      toast.success('User updated');
      addAudit('Updated user', id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success('User removed');
      addAudit('Deleted user', id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleCreateLink = async (link: Omit<ShareLink, 'id' | 'url' | 'createdAt' | 'views'>) => {
    try {
      const created = await api.createShare(link);
      const newLink: ShareLink = {
        ...link,
        id: created.token,
        url: created.url,
        createdAt: new Date().toISOString(),
        views: 0
      };
      setShareLinks([...shareLinks, newLink]);
      addAudit('Created share link', newLink.name);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create share link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await api.deleteShare(id);
      setShareLinks(shareLinks.filter(l => l.id !== id));
      toast.success('Share link deleted');
      addAudit('Deleted share link', id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete share link');
    }
  };

  const handleAddSample = async (sample: Omit<Sample, 'id'>) => {
    try {
      const saved = await api.createSample(sample);
      setSamples([saved, ...samples]);
      toast.success('Sample created');
      addAudit('Created sample', saved.sampleId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create sample');
    }
  };

  const handleUpdateSample = async (id: string, updates: Partial<Sample>) => {
    try {
      const saved = await api.updateSample(id, updates);
      setSamples(samples.map(s => s.id === id ? { ...s, ...saved } : s));
      addAudit('Updated sample', id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update sample');
    }
  };

  const handleOpenProject = (projectName: string) => {
    const project = projects.find(p => p.name === projectName);
    if (project) {
      handleProjectClick(project);
    } else {
      setFilesFolder(`/Projects/${projectName}`);
      setWorkspaceTab('samples');
      setCurrentView('workspace');
    }
  };

  const addAudit = (action: string, target?: string, details?: string, actorOverride?: string) => {
    const entry: AuditLogEntry = {
      id: String(auditLog.length + 1),
      timestamp: new Date().toISOString(),
      actor: actorOverride || currentUser?.name || 'System',
      action,
      target,
      details
    };
    setAuditLog(prev => [entry, ...prev]);
  };

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      toast.error('Enter a username and password');
      return;
    }
    try {
      const user = await api.login(loginUsername, loginPassword);
      const now = new Date().toISOString();
      const current: User = {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        email: user.email || '',
        role: user.role,
        createdAt: now,
        lastActive: now
      };
      setCurrentUser(current);
      setLoginPassword('');
      setCurrentView('dashboard');
      addAudit('Login', current.name, undefined, current.name);
      if (rememberMe) {
        localStorage.setItem('aims.authUser', JSON.stringify(current));
        localStorage.setItem('aims.rememberedUsername', loginUsername);
      } else {
        localStorage.removeItem('aims.authUser');
        localStorage.removeItem('aims.rememberedUsername');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    addAudit('Logout', currentUser?.name, undefined, currentUser?.name);
    setCurrentUser(null);
    setToken(null);
    setUsers([]);
    setSamples([]);
    setFiles([]);
    setShareLinks([]);
    setProjects([]);
    localStorage.removeItem('aims.authUser');
  };

  useEffect(() => {
    const remembered = localStorage.getItem('aims.authUser');
    const token = getToken();
    if (remembered && token) {
      try {
        const parsed = JSON.parse(remembered) as User;
        setCurrentUser(parsed);
        setLoginUsername(parsed.username || parsed.name);
      } catch {
        localStorage.removeItem('aims.authUser');
      }
    } else {
      const rememberedUsername = localStorage.getItem('aims.rememberedUsername');
      if (rememberedUsername) {
        setLoginUsername(rememberedUsername);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    const loadData = async () => {
      try {
        const [samplesData, filesData, projectsData] = await Promise.all([
          api.fetchSamples(),
          api.fetchFiles(),
          api.fetchProjects()
        ]);
        if (!isMounted) return;
        setSamples(samplesData);
        setFiles(filesData);
        setProjects(projectsData);
        
        const overlayFiles = filesData.filter(file => file.isOverlay);
        setOverlays(overlayFiles.map((file, index) => ({
          id: file.overlayId || file.id,
          name: file.name,
          url: file.url,
          type: file.type === 'pdf' ? 'pdf' : file.type === 'video' ? 'video' : 'image',
          position: { x: 100 + index * 20, y: 100 + index * 20 },
          size: { width: 500, height: 400 },
          rotation: 0,
          opacity: 0.8,
          locked: false,
          visible: true,
          zIndex: index + 1,
          uploadedBy: file.uploadedBy,
          uploadedAt: file.uploadedAt
        })));
        
        if (canManageUsers) {
          const usersData = await api.fetchUsers();
          if (!isMounted) return;
          setUsers(usersData);
        } else {
          setUsers([currentUser]);
        }
        
        if (canManageSharing) {
          const sharesData = await api.fetchShares();
          if (!isMounted) return;
          setShareLinks(sharesData);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load data');
        handleLogout();
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleSlash = (event: KeyboardEvent) => {
      if (event.key !== '/') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      event.preventDefault();
      setCurrentView('search');
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleSlash);
    return () => window.removeEventListener('keydown', handleSlash);
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <Map className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">Welcome to AIMS</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Asbestos Inspection Management System</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm">Username</Label>
              <Input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Password</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="h-11"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded"
              />
              Remember me
            </label>
            <Button className="w-full h-11 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md" onClick={handleLogin}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const navigationItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as View, label: 'Projects', icon: Briefcase },
    { id: 'workspace' as View, label: 'Workspace', icon: ClipboardList },
    { id: 'map' as View, label: 'Map View', icon: Map },
    { id: 'offline' as View, label: 'Offline Queue', icon: CloudOff },
    ...(canManageUsers ? [{ id: 'users' as View, label: 'Users', icon: Users }] : []),
    ...(canManageSharing ? [{ id: 'sharing' as View, label: 'Sharing', icon: Share2 }] : []),
    ...(canViewAudit ? [{ id: 'audit' as View, label: 'Audit Log', icon: History }] : []),
    ...(canViewAudit ? [{ id: 'project-log' as View, label: 'Project Log', icon: FileClock }] : []),
  ];

  const viewLabels: Record<View, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    'create-project': 'Create New Job',
    'edit-project': 'Edit Job',
    'project-detail': 'Project Details',
    workspace: 'Workspace',
    map: 'Map View',
    users: 'User Management',
    sharing: 'Sharing',
    audit: 'Audit Log',
    'project-log': 'Project Activity Log',
    offline: 'Offline Queue',
    search: 'Search',
    reports: 'Reports'
  };

  const filteredProjects = projects.filter(project => {
    if (currentProjectsTab === 'active' && project.status !== 'active') return false;
    if (currentProjectsTab === 'completed' && project.status !== 'completed') return false;
    
    if (globalSearchQuery) {
      const query = globalSearchQuery.toLowerCase();
      return (
        (project.jobNumber || '').toLowerCase().includes(query) ||
        project.name.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.site.toLowerCase().includes(query) ||
        project.manager.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const toggleStaff = (staffName: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffName) ? prev.filter(s => s !== staffName) : [...prev, staffName]
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-foreground">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
                <Map className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-slate-900 leading-tight">AIMS</h1>
                <p className="text-[11px] text-muted-foreground leading-tight">Inspection Management</p>
              </div>
            </div>

            <div className="hidden md:block w-px h-8 bg-border/60" />

            <div className="hidden md:flex flex-1 justify-center px-4">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setCurrentView('search');
                  }}
                  onFocus={() => setCurrentView('search')}
                  placeholder="Search everything..."
                  className="pl-10 pr-12 h-10 rounded-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold shadow-sm">
                  {userInitials}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight">{currentUser.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight capitalize">{currentUser.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex md:hidden items-center gap-1 ml-auto">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentView('search')}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="sticky top-16 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center justify-between h-12">
            <nav className="flex items-center gap-1 -mb-px">
              {navigationItems.map((item) => {
                const isActive = currentView === item.id || (item.id === 'projects' && (currentView === 'create-project' || currentView === 'edit-project' || currentView === 'workspace'));
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all border-b-2 ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                AIMS <span className="mx-1.5 opacity-40">/</span> <span className="text-slate-900">{viewLabels[currentView]}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            samples={samples} 
            projects={projects}
            users={users}
            currentUser={currentUser}
            onNavigate={handleViewChange} 
            onOpenProject={handleOpenProject} 
            onUpdateProject={handleUpdateProject}
          />
        )}

        {currentView === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h2>
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={() => setCurrentProjectsTab('active')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${currentProjectsTab === 'active' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Active Jobs</button>
                  <button onClick={() => setCurrentProjectsTab('completed')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${currentProjectsTab === 'completed' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Completed Jobs</button>
                  <button onClick={() => setCurrentProjectsTab('all')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${currentProjectsTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>All Jobs</button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search jobs..." 
                    className="pl-9 w-64 h-10 bg-white border-slate-200"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  />
                </div>
                {canEdit && (
                  <Button className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 font-bold" onClick={() => { setSelectedStaff([]); setCurrentView('create-project'); }}>
                    <Plus className="h-4 w-4" />
                    New Job
                  </Button>
                )}
              </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Job Number</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Job Name / Site</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Assigned To</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center text-center">Start Date</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Due Date</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="w-10 px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => handleProjectClick(project)}>
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-emerald-700 hover:underline">{project.jobNumber || 'No #' }</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-slate-700">{project.client}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-600 font-medium">{project.name}</span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">{project.site}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white" title={`Manager: ${project.manager}`}>
                              {project.manager.slice(0, 2).toUpperCase()}
                            </div>
                            {(project.assignedStaff || []).slice(0, 2).map((s, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border-2 border-white" title={s}>
                                {s.slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                            {(project.assignedStaff || []).length > 2 && (
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border-2 border-white">
                                +{(project.assignedStaff || []).length - 2}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm text-slate-500 font-medium">
                            {new Date(project.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-sm font-medium ${project.dueDate && new Date(project.dueDate) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                            {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            project.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            project.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject(project);
                                setSelectedStaff(project.assignedStaff || []);
                                setCurrentView('edit-project');
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-slate-400 italic bg-slate-50/30">
                          No jobs found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'create-project' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('projects')} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-900">Create New Job</h2>
            </div>

            <Card className="border-slate-200 shadow-md bg-white">
              <CardContent className="p-8">
                <form className="space-y-10" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const projectData = {
                    jobNumber: formData.get('jobNumber') as string,
                    name: formData.get('name') as string,
                    client: formData.get('client') as string,
                    site: formData.get('site') as string,
                    status: 'active' as const,
                    category: formData.get('category') as string,
                    template: formData.get('template') as string,
                    pricingModel: formData.get('pricingModel') as Project['pricingModel'],
                    estimatedCost: Number(formData.get('estimatedCost')),
                    startDate: formData.get('startDate') as string || new Date().toISOString().split('T')[0],
                    dueDate: formData.get('dueDate') as string || undefined,
                    description: formData.get('description') as string,
                    manager: formData.get('manager') as string || currentUser?.name || 'Admin',
                    assignedStaff: selectedStaff
                  };
                  const saved = await handleAddProject(projectData);
                  if (saved) { handleProjectClick(saved); }
                }}>
                  {/* SECTION: Basic Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">1. Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="client" className="text-xs font-bold uppercase text-slate-500">Client*</Label>
                        <Input id="client" name="client" placeholder="e.g. Focus Environmental" required className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobNumber" className="text-xs font-bold uppercase text-slate-500">Job Number (Auto-suggested)</Label>
                        <Input id="jobNumber" name="jobNumber" defaultValue={calculateNextJobNumber()} className="h-11 font-mono font-bold text-emerald-700" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">Job Name*</Label>
                        <Input id="name" name="name" placeholder="e.g. Asbestos Audit - Site A" required className="h-11" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="site" className="text-xs font-bold uppercase text-slate-500">Site Address*</Label>
                        <Input id="site" name="site" placeholder="Full street address" required className="h-11" />
                      </div>
                    </div>
                  </div>

                  {/* SECTION: Job Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">2. Job Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-xs font-bold uppercase text-slate-500">Job Category</Label>
                        <select id="category" name="category" className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm">
                          <option value="">Select Category...</option>
                          {jobCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template" className="text-xs font-bold uppercase text-slate-500">Job Template</Label>
                        <select id="template" name="template" className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm">
                          <option value="">Select Template...</option>
                          {jobTemplates.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manager" className="text-xs font-bold uppercase text-slate-500">Job Manager</Label>
                        <select id="manager" name="manager" defaultValue={currentUser?.name} className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm">
                          {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: Staff Assigned */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">3. Staff Assigned</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {users.map((user) => {
                        const isSelected = selectedStaff.includes(user.name);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleStaff(user.name)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{user.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{user.role}</p>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION: Dates & Financials */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">4. Schedule & Financials</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-xs font-bold uppercase text-slate-500">Start Date</Label>
                        <Input id="startDate" name="startDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-xs font-bold uppercase text-slate-500">Due Date</Label>
                        <Input id="dueDate" name="dueDate" type="date" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricingModel" className="text-xs font-bold uppercase text-slate-500">Pricing Model</Label>
                        <select id="pricingModel" name="pricingModel" className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm">
                          <option value="fixed">Fixed Price</option>
                          <option value="time-materials">Time & Materials</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimatedCost" className="text-xs font-bold uppercase text-slate-500">Estimated Cost ($)</Label>
                        <Input id="estimatedCost" name="estimatedCost" type="number" placeholder="0.00" className="h-11" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold uppercase text-slate-500">Internal Description</Label>
                    <textarea id="description" name="description" className="flex min-h-[120px] w-full rounded-md border border-input bg-slate-50 px-3 py-3 text-sm focus:bg-white transition-colors" placeholder="Enter job scope or internal notes..." />
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t">
                    <Button type="button" variant="ghost" onClick={() => setCurrentView('projects')} className="h-12 px-8 font-bold text-slate-500">Cancel</Button>
                    <Button type="submit" className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg px-12 font-bold text-lg">Save & Create Job</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'edit-project' && editingProject && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('projects')} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-slate-900">Edit Job: {editingProject.jobNumber || editingProject.name}</h2>
            </div>

            <Card className="border-slate-200 shadow-md bg-white">
              <CardContent className="p-8">
                <form className="space-y-10" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updates = {
                    jobNumber: formData.get('jobNumber') as string,
                    name: formData.get('name') as string,
                    client: formData.get('client') as string,
                    site: formData.get('site') as string,
                    status: formData.get('status') as Project['status'],
                    category: formData.get('category') as string,
                    template: formData.get('template') as string,
                    pricingModel: formData.get('pricingModel') as Project['pricingModel'],
                    estimatedCost: Number(formData.get('estimatedCost')),
                    startDate: formData.get('startDate') as string,
                    dueDate: formData.get('dueDate') as string || undefined,
                    description: formData.get('description') as string,
                    manager: formData.get('manager') as string,
                    assignedStaff: selectedStaff
                  };
                  await handleUpdateProject(editingProject.id, updates);
                  setCurrentView('projects');
                }}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Job Status & Basic Info</h3>
                      <div className="flex items-center gap-3">
                        <Label className="text-xs font-bold uppercase text-slate-500">Status:</Label>
                        <select name="status" defaultValue={editingProject.status} className="h-9 rounded-md border bg-slate-50 px-3 text-xs font-bold">
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Client*</Label><Input name="client" defaultValue={editingProject.client} required className="h-11" /></div>
                      <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Job Number</Label><Input name="jobNumber" defaultValue={editingProject.jobNumber} className="h-11" /></div>
                      <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Job Name*</Label><Input name="name" defaultValue={editingProject.name} required className="h-11" /></div>
                      <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Site Address*</Label><Input name="site" defaultValue={editingProject.site} required className="h-11" /></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Staff Assigned</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {users.map((user) => {
                        const isSelected = selectedStaff.includes(user.name);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleStaff(user.name)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{user.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{user.role}</p>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4 pt-8 border-t">
                    <Button type="button" variant="destructive" onClick={() => { if(confirm('Are you sure? All related samples and files will be deleted.')) { handleDeleteProject(editingProject.id); setCurrentView('projects'); } }} className="h-12 px-6 font-bold">Delete Project</Button>
                    <div className="flex gap-3">
                      <Button type="button" variant="ghost" onClick={() => setCurrentView('projects')} className="h-12 px-8 font-bold text-slate-500">Cancel</Button>
                      <Button type="submit" className="h-12 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg px-12 font-bold">Save Changes</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'workspace' && (
          <Workspace
            activeTab={workspaceTab}
            onTabChange={setWorkspaceTab}
            samples={selectedProject ? samples.filter(s => s.site === selectedProject.site) : samples}
            files={selectedProject ? files.filter(f => f.folderPath?.includes(selectedProject.name)) : files}
            canEdit={canEdit}
            canManageSchema={canManageSchema}
            onAddSample={handleAddSample}
            onUpdateSample={handleUpdateSample}
            onDeleteFile={handleDeleteFile}
            onAddToMap={handleAddToMap}
            onLinkToSample={handleLinkFileToSample}
            selectedFolder={filesFolder}
            onFolderChange={setFilesFolder}
            showTabs={false}
            auditLog={auditLog}
            currentUser={currentUser}
            project={selectedProject}
            onViewMap={() => setCurrentView('map')}
          />
        )}

        {currentView === 'map' && (
          <MapView 
            overlays={selectedProject ? overlays.filter(o => o.name.toLowerCase().includes(selectedProject.name.toLowerCase()) || (files.find(f => f.id === o.id)?.folderPath?.includes(selectedProject.name))) : overlays}
            samples={selectedProject ? samples.filter(s => s.site === selectedProject.site) : samples}
            onUpdateOverlay={handleUpdateOverlay}
            onDeleteOverlay={handleDeleteOverlay}
            onAddOverlay={handleAddOverlay}
            onUpdateSample={handleUpdateSample}
            onAddSample={handleAddSample}
            onAddFile={handleAddFile}
            onLinkToSample={handleLinkFileToSample}
            onCreateSampleFromFile={handleCreateSampleFromFile}
            onReorderOverlay={handleReorderOverlay}
            canEdit={canEdit}
            project={selectedProject}
            onBackToProject={() => setCurrentView('workspace')}
          />
        )}
        
        {currentView === 'users' && canManageUsers && (
          <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />
        )}
        
        {currentView === 'sharing' && canManageSharing && (
          <Sharing shareLinks={shareLinks} onCreateLink={handleCreateLink} onDeleteLink={handleDeleteLink} canManage={canManageSharing} />
        )}

        {currentView === 'audit' && canViewAudit && <AuditLog entries={auditLog} />}

        {currentView === 'project-log' && canViewAudit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Project Activity Log</h2>
              <Button variant="outline" onClick={() => setCurrentView('dashboard')}>Back to Dashboard</Button>
            </div>
            <AuditLog entries={auditLog} />
          </div>
        )}

        {currentView === 'offline' && (
          <OfflineQueue queue={syncQueue} isOnline={isOnline} onSync={() => { setSyncQueue([]); toast.success('Sync complete'); }} onClear={() => setSyncQueue([])} />
        )}

        {currentView === 'search' && (
          <GlobalSearch samples={samples} files={files} users={users} shareLinks={shareLinks} query={globalSearchQuery} />
        )}

        {currentView === 'reports' && (
          <Reports samples={samples} files={files} />
        )}
      </main>
    </div>
  );
}
