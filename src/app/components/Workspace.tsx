import { Samples } from './Samples';
import { Files } from './Files';
import { Reports } from './Reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sample, FileItem, User, Project } from '../types';
import { Badge } from './ui/badge';
import { Calendar, MapPin, User as UserIcon, Building2, Map as MapIcon } from 'lucide-react';
import { Button } from './ui/button';

interface WorkspaceProps {
  activeTab: 'samples' | 'files' | 'reports';
  onTabChange: (tab: 'samples' | 'files' | 'reports') => void;
  samples: Sample[];
  files: FileItem[];
  canEdit: boolean;
  canManageSchema: boolean;
  onAddSample: (sample: Omit<Sample, 'id'>) => void | Promise<void>;
  onUpdateSample: (id: string, updates: Partial<Sample>) => void | Promise<void>;
  onDeleteFile: (id: string) => void | Promise<void>;
  onAddToMap: (fileId: string) => void | Promise<void>;
  onLinkToSample: (fileId: string, sampleId: string) => void | Promise<void>;
  selectedFolder: string;
  onFolderChange: (folder: string) => void;
  showTabs?: boolean;
  currentUser?: User | null;
  project?: Project | null;
  onViewMap?: () => void;
}

export function Workspace({
  activeTab,
  onTabChange,
  samples,
  files,
  canEdit,
  canManageSchema,
  onAddSample,
  onUpdateSample,
  onDeleteFile,
  onAddToMap,
  onLinkToSample,
  selectedFolder,
  onFolderChange,
  showTabs = true,
  currentUser,
  project,
  onViewMap
}: WorkspaceProps) {
  const projectName = project?.name || selectedFolder.split('/').filter(Boolean).pop() || 'General';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-2xl border border-muted/60 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{projectName}</h2>
            {project && (
              <Badge variant="outline" className={`capitalize ${
                project.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700'
              }`}>
                {project.status}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-muted-foreground">
            {project?.client && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{project.client}</span>
              </div>
            )}
            {project?.site && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{project.site}</span>
              </div>
            )}
            {project?.manager && (
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>Manager: {project.manager}</span>
              </div>
            )}
            {project?.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={onViewMap}>
              <MapIcon className="h-4 w-4" />
              View Project Map
            </Button>
          </div>
          <div className="text-right px-4 border-r border-muted/60">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Samples</p>
            <p className="text-xl font-semibold">{samples.length}</p>
          </div>
          <div className="text-right px-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Files</p>
            <p className="text-xl font-semibold">{files.length}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as WorkspaceProps['activeTab'])}>
        <TabsList>
          <TabsTrigger value="samples">Samples</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {project?.description && (
          <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">Scope of Works / Description</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        <TabsContent value="samples">
          <Samples
            samples={samples}
            onAddSample={onAddSample}
            onUpdateSample={onUpdateSample}
            canEdit={canEdit}
            canManageSchema={canManageSchema}
            defaultSite={project?.site}
          />
        </TabsContent>

        <TabsContent value="files">
          <Files
            files={files}
            samples={samples}
            onDeleteFile={onDeleteFile}
            onAddToMap={onAddToMap}
            onLinkToSample={onLinkToSample}
            canEdit={canEdit}
            selectedFolder={selectedFolder}
            onFolderChange={onFolderChange}
          />
        </TabsContent>

        <TabsContent value="reports">
          <Reports samples={samples} files={files} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
