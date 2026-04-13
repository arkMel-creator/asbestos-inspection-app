import { useMemo, useState } from 'react';
import { FileItem, Sample } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, FileImage, FileText, Video, File, Download, Eye, Trash2, MapPin } from 'lucide-react';
import JSZip from 'jszip';

interface FilesProps {
  files: FileItem[];
  samples: Sample[];
  onDeleteFile: (id: string) => void;
  onAddToMap: (fileId: string) => void;
  onLinkToSample: (fileId: string, sampleId: string) => void | Promise<void>;
  canEdit: boolean;
  selectedFolder: string;
  onFolderChange: (folder: string) => void;
}

export function Files({
  files,
  samples,
  onDeleteFile,
  onAddToMap,
  onLinkToSample,
  canEdit,
  selectedFolder,
  onFolderChange
}: FilesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [linkDialogFile, setLinkDialogFile] = useState<FileItem | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  const filteredFiles = files.filter(file => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = (file.folderPath || '/Projects').startsWith(selectedFolder);
    return matchesSearch && matchesFolder;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return FileImage;
      case 'pdf':
        return FileText;
      case 'video':
        return Video;
      default:
        return File;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 text-blue-800';
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: files.length,
    images: files.filter(f => f.type === 'image').length,
    pdfs: files.filter(f => f.type === 'pdf').length,
    videos: files.filter(f => f.type === 'video').length,
    onMap: files.filter(f => f.isOverlay).length,
    linked: files.filter(f => (f.linkedSampleIds || []).length > 0).length
  };

  const folderTree = useMemo(() => {
    const tree: Record<string, any> = {};
    files.forEach(file => {
      const path = (file.folderPath || '/Projects').split('/').filter(Boolean);
      let current = tree;
      path.forEach(part => {
        current[part] = current[part] || {};
        current = current[part];
      });
    });
    return tree;
  }, [files]);

  const renderTree = (node: Record<string, any>, basePath: string, depth = 0) => {
    return Object.keys(node).map(key => {
      const fullPath = `${basePath}/${key}`;
      const isActive = selectedFolder === fullPath;
      return (
        <div key={fullPath}>
          <button
            className={`w-full text-left text-sm px-2 py-1 rounded ${
              isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
            style={{ paddingLeft: `${8 + depth * 12}px` }}
            onClick={() => onFolderChange(fullPath)}
          >
            {key}
          </button>
          {renderTree(node[key], fullPath, depth + 1)}
        </div>
      );
    });
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map(f => f.id));
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleZipDownload = async () => {
    if (selectedFileIds.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const filesToZip = files.filter(f => selectedFileIds.includes(f.id));
      for (const file of filesToZip) {
        if (!file.url || file.url === '#') continue;
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      const folderName = selectedFolder.split('/').filter(Boolean).slice(-1)[0] || 'Files';
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}-${date}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">File Library</h2>
        <p className="text-sm text-muted-foreground">
          Manage your uploaded files and assets
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              className={`w-full text-left text-sm px-2 py-1 rounded ${
                selectedFolder === '/Projects' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
              onClick={() => onFolderChange('/Projects')}
            >
              Projects
            </button>
            <div className="mt-2">
              {renderTree(folderTree, '')}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <File className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileImage className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl">{stats.images}</p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl">{stats.pdfs}</p>
              <p className="text-xs text-muted-foreground">PDFs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Video className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl">{stats.videos}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl">{stats.onMap}</p>
              <p className="text-xs text-muted-foreground">On Map</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <p className="text-2xl">{stats.linked}</p>
              <p className="text-xs text-muted-foreground">Linked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedFileIds.length} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleSelectAll}>
              {selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0
                ? 'Clear Selection'
                : 'Select All'}
            </Button>
            <Button onClick={handleZipDownload} disabled={selectedFileIds.length === 0 || isZipping}>
              {isZipping ? 'Preparing ZIP...' : 'Download as ZIP'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      <Card>
        <CardContent className="p-6">
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                      <label className="absolute left-2 top-2 bg-white/90 rounded p-1">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                        />
                      </label>
                      {file.thumbnail ? (
                        <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      )}
                      {file.isOverlay && (
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          On Map
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <p className="text-sm truncate" title={file.name}>{file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getFileTypeColor(file.type)}>
                            {file.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        by {file.uploadedBy}
                      </p>
                      <div className="flex gap-2">
                        {!file.isOverlay && file.type === 'image' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => onAddToMap(file.id)}
                            disabled={!canEdit}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Add to Map
                          </Button>
                        )}
                        <Dialog open={linkDialogFile?.id === file.id} onOpenChange={(open) => {
                          if (!open) {
                            setLinkDialogFile(null);
                            setSelectedSample('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setLinkDialogFile(file)}
                              disabled={!canEdit}
                            >
                              Link to Sample
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Link File to Sample</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <Select value={selectedSample} onValueChange={setSelectedSample}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a sample" />
                                </SelectTrigger>
                                <SelectContent>
                                  {samples.map(sample => (
                                    <SelectItem key={sample.id} value={sample.id}>
                                      {sample.sampleId} • {sample.site}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => {
                                  setLinkDialogFile(null);
                                  setSelectedSample('');
                                }}>
                                  Cancel
                                </Button>
                                <Button
                                  disabled={!selectedSample}
                                  onClick={() => {
                                    if (!linkDialogFile || !selectedSample) return;
                                    onLinkToSample(linkDialogFile.id, selectedSample);
                                    setLinkDialogFile(null);
                                    setSelectedSample('');
                                  }}
                                >
                                  Link
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewFile(file)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => onDeleteFile(file.id)}
                          disabled={!canEdit}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFileIds.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                    />
                    <div className="flex-shrink-0">
                      {file.thumbnail ? (
                        <img src={file.thumbnail} alt={file.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString()} • {file.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getFileTypeColor(file.type)}>
                        {file.type}
                      </Badge>
                      {file.isOverlay && (
                        <Badge className="bg-green-100 text-green-800">
                          On Map
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!file.isOverlay && file.type === 'image' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddToMap(file.id)}
                          disabled={!canEdit}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Add to Map
                        </Button>
                      )}
                      <Dialog open={linkDialogFile?.id === file.id} onOpenChange={(open) => {
                        if (!open) {
                          setLinkDialogFile(null);
                          setSelectedSample('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLinkDialogFile(file)}
                            disabled={!canEdit}
                          >
                            Link to Sample
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Link File to Sample</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <Select value={selectedSample} onValueChange={setSelectedSample}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a sample" />
                              </SelectTrigger>
                              <SelectContent>
                                {samples.map(sample => (
                                  <SelectItem key={sample.id} value={sample.id}>
                                    {sample.sampleId} • {sample.site}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => {
                                setLinkDialogFile(null);
                                setSelectedSample('');
                              }}>
                                Cancel
                              </Button>
                              <Button
                                disabled={!selectedSample}
                                onClick={() => {
                                  if (!linkDialogFile || !selectedSample) return;
                                  onLinkToSample(linkDialogFile.id, selectedSample);
                                  setLinkDialogFile(null);
                                  setSelectedSample('');
                                }}
                              >
                                Link
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewFile(file)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onDeleteFile(file.id)}
                        disabled={!canEdit}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No files found</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
      <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}

// Preview dialog
export function FilePreviewDialog({
  file,
  onClose
}: {
  file: FileItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{file?.name}</DialogTitle>
        </DialogHeader>
        {file && (
          <div className="space-y-4">
            {file.type === 'image' && (
              <img src={file.url} alt={file.name} className="w-full max-h-[70vh] object-contain rounded" />
            )}
            {file.type === 'pdf' && (
              <iframe title={file.name} src={file.url} className="w-full h-[70vh] rounded border" />
            )}
            {file.type === 'video' && (
              <video src={file.url} controls className="w-full max-h-[70vh] rounded" />
            )}
            {file.type === 'other' && (
              <div className="text-sm text-muted-foreground">
                Preview not available for this file type.
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => window.open(file.url, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
