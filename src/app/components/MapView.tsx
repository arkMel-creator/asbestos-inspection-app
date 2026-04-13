import { useState, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { MapOverlay, Sample, SampleStatus, RiskLevel, Project } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  Layers,
  Upload,
  MapPin,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface MapViewProps {
  overlays: MapOverlay[];
  samples: Sample[];
  onUpdateOverlay: (id: string, updates: Partial<MapOverlay>) => void | Promise<void>;
  onDeleteOverlay: (id: string) => void | Promise<void>;
  onAddOverlay: (file: File) => void | Promise<void>;
  onUpdateSample: (id: string, updates: Partial<Sample>) => void | Promise<void>;
  onAddSample?: (sample: Omit<Sample, 'id'>) => void | Promise<void>;
  onAddFile: (file: File) => Promise<string>;
  onLinkToSample: (fileId: string, sampleId: string) => Promise<void>;
  onCreateSampleFromFile: (file: File, location?: { x: number; y: number }) => Promise<string>;
  onReorderOverlay: (id: string, direction: 'up' | 'down') => void;
  canEdit: boolean;
  project?: Project | null;
  onBackToProject?: () => void;
}

export function MapView({
  overlays,
  samples,
  onUpdateOverlay,
  onDeleteOverlay,
  onAddOverlay,
  onUpdateSample,
  onAddSample,
  onAddFile,
  onLinkToSample,
  onCreateSampleFromFile,
  onReorderOverlay,
  canEdit,
  project,
  onBackToProject
}: MapViewProps) {
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    layers: true,
    markers: true,
    addSample: true
  });
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; overlayId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [placementSampleId, setPlacementSampleId] = useState<string>('');
  const [pendingUploads, setPendingUploads] = useState<Array<{
    file: File;
    dropPoint?: { x: number; y: number };
  }>>([]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setIsDragging(true);
  }, [canEdit]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canEdit) {
      toast.error('You do not have permission to add overlays');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const rect = mapContainerRef.current?.getBoundingClientRect();
    const dropPoint = rect
      ? { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) }
      : undefined;
    setPendingUploads(prev => [...prev, ...files.map(file => ({ file, dropPoint }))]);
  }, [canEdit]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error('You do not have permission to add overlays');
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const rect = mapContainerRef.current?.getBoundingClientRect();
    const dropPoint = rect
      ? { x: Math.round(rect.width / 2), y: Math.round(rect.height / 2) }
      : undefined;
    setPendingUploads(prev => [...prev, ...files.map(file => ({ file, dropPoint }))]);
  };

  const handleRotate = (overlayId: string) => {
    if (!canEdit) return;
    const overlay = overlays.find(o => o.id === overlayId);
    if (overlay) {
      onUpdateOverlay(overlayId, { rotation: (overlay.rotation + 15) % 360 });
    }
  };

  const orderedOverlays = [...overlays].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  const selectedSampleData = samples.find(s => s.id === selectedSample);

  const uniqueValues = (values: string[]) => Array.from(new Set(values)).filter(Boolean);
  const sites = uniqueValues(samples.map(s => s.site));
  const areas = uniqueValues(samples.map(s => s.area));
  const equipment = uniqueValues(samples.map(s => s.equipment));

  const filteredSamples = samples.filter(sample => {
    if (!sample.location) return false;
    if (statusFilter !== 'all' && sample.status !== statusFilter) return false;
    if (riskFilter !== 'all' && sample.riskLevel !== riskFilter) return false;
    if (siteFilter !== 'all' && sample.site !== siteFilter) return false;
    if (areaFilter !== 'all' && sample.area !== areaFilter) return false;
    if (equipmentFilter !== 'all' && sample.equipment !== equipmentFilter) return false;
    if (dateFrom && sample.collectionDate < dateFrom) return false;
    if (dateTo && sample.collectionDate > dateTo) return false;
    return true;
  });

  const getStatusColor = (status: SampleStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'positive': return 'bg-red-600';
      case 'negative': return 'bg-green-600';
      case 'removed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!canEdit) return;
    if (!placementSampleId || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);
    onUpdateSample(placementSampleId, { location: { x, y } });
    toast.success('Sample marker placed');
    setPlacementSampleId('');
  };

  const getNearestSampleId = (point?: { x: number; y: number }) => {
    if (!point) return null;
    let nearestId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    samples.forEach(sample => {
      if (!sample.location) return;
      const dx = sample.location.x - point.x;
      const dy = sample.location.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDistance) {
        bestDistance = dist;
        nearestId = sample.id;
      }
    });
    return nearestId;
  };

  const handleUploadAction = async (action: 'marker' | 'attach' | 'overlay' | 'cancel') => {
    if (!canEdit && action !== 'cancel') {
      toast.error('You do not have permission');
      return;
    }
    const pending = pendingUploads[0];
    if (!pending) return;
    const { file, dropPoint } = pending;

    if (action === 'overlay') {
      onAddOverlay(file);
    } else if (action === 'marker') {
      const sampleId = await onCreateSampleFromFile(file, dropPoint);
      if (sampleId) setSelectedSample(sampleId);
    } else if (action === 'attach') {
      const nearestId = getNearestSampleId(dropPoint);
      if (nearestId) {
        const fileId = await onAddFile(file);
        if (fileId) await onLinkToSample(fileId, nearestId);
      }
    }
    setPendingUploads(prev => prev.slice(1));
  };

  const handleNewSample = () => {
    if (!canEdit) return;
    const nextIndex = 1000 + samples.length + 1;
    const sampleId = `S-${nextIndex}`;
    const newSample: Omit<Sample, 'id'> = {
      sampleId,
      site: project?.site || 'Unassigned',
      area: 'Unassigned',
      equipment: 'Unassigned',
      sampleType: 'Bulk',
      collectionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      riskLevel: 'medium',
      collector: 'Current User',
      notes: 'Created from Map View',
      linkedFileIds: []
    };
    if (onAddSample) {
      onAddSample(newSample);
      toast.success('New sample created. Assign its location using Sample Markers.');
    }
  };

  return (
    <div className="space-y-4">
      {project && (
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-muted/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Map Overview: {project.name}</h3>
              <p className="text-xs text-muted-foreground">{project.site}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2" onClick={onBackToProject}>
            Back to Project Workspace
            <ArrowUp className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] overflow-hidden">
        {/* Left Panel */}
        <Card className="w-full lg:w-80 flex-shrink-0 flex flex-col h-full overflow-hidden">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Section: Filters */}
              <div className="border-b">
                <button 
                  onClick={() => toggleSection('filters')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <Filter className="h-4 w-4 text-slate-400" />
                    Filters
                  </div>
                  {expandedSections.filters ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSections.filters && (
                  <div className="p-4 space-y-4 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                          <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="positive">Positive</SelectItem><SelectItem value="negative">Negative</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Site / Area</label>
                        <Select value={areaFilter} onValueChange={setAreaFilter}>
                          <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="All Areas" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Areas</SelectItem>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Layers */}
              <div className="border-b">
                <button 
                  onClick={() => toggleSection('layers')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <Layers className="h-4 w-4 text-slate-400" />
                    Map Overlays
                  </div>
                  {expandedSections.layers ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSections.layers && (
                  <div className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {orderedOverlays.map((overlay) => (
                      <div key={overlay.id} className={`p-2.5 border rounded-lg hover:bg-slate-50 transition-all ${selectedOverlay === overlay.id ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`} onClick={() => setSelectedOverlay(overlay.id)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate flex-1">{overlay.name}</span>
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onUpdateOverlay(overlay.id, { visible: !overlay.visible }); }}><Eye className={`h-3 w-3 ${overlay.visible ? 'text-blue-500' : 'text-slate-300'}`} /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onUpdateOverlay(overlay.id, { locked: !overlay.locked }); }}><Lock className={`h-3 w-3 ${overlay.locked ? 'text-amber-500' : 'text-slate-300'}`} /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {overlays.length === 0 && <p className="text-[11px] text-slate-400 italic text-center py-4">No overlays added yet.</p>}
                  </div>
                )}
              </div>

              {/* Section: Sample Markers */}
              <div className="border-b">
                <button 
                  onClick={() => toggleSection('markers')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Sample Markers
                  </div>
                  {expandedSections.markers ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSections.markers && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Place Marker</label>
                      <Select value={placementSampleId} onValueChange={setPlacementSampleId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Choose sample" /></SelectTrigger>
                        <SelectContent>{samples.map(s => <SelectItem key={s.id} value={s.id}>{s.sampleId}</SelectItem>)}</SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">Pick a sample, then click the map.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Add Sample (New) */}
              <div className="border-b">
                <button 
                  onClick={() => toggleSection('addSample')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <Plus className="h-4 w-4 text-slate-400" />
                    New Inspection
                  </div>
                  {expandedSections.addSample ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSections.addSample && (
                  <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                    <Button 
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm border-0"
                      onClick={handleNewSample}
                      disabled={!canEdit}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Sample
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Canvas */}
        <Card className="flex-1 relative overflow-hidden bg-slate-50 border-slate-200">
          <CardContent className="p-0 h-full relative group">
            <div
              ref={mapContainerRef}
              className={`h-full w-full overflow-auto relative transition-all ${isDragging ? 'bg-blue-50 ring-4 ring-blue-500 ring-inset' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleMapClick}
            >
              <div 
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: '0 0',
                  width: '5000px', height: '5000px',
                  backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                  position: 'absolute', top: 0, left: 0
                }}
              >
                {orderedOverlays.filter(o => o.visible).map((overlay) => (
                  <Rnd
                    key={overlay.id}
                    position={{ x: overlay.position.x, y: overlay.position.y }}
                    size={{ width: overlay.size.width, height: overlay.size.height }}
                    style={{ zIndex: overlay.zIndex ?? 1 }}
                    onDragStop={(e, d) => onUpdateOverlay(overlay.id, { position: { x: d.x, y: d.y } })}
                    onResizeStop={(e, direction, ref, delta, pos) => onUpdateOverlay(overlay.id, { size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) }, position: pos })}
                    scale={zoom}
                    disableDragging={overlay.locked}
                    enableResizing={!overlay.locked}
                    onMouseDown={() => setSelectedOverlay(overlay.id)}
                  >
                    <div className={`w-full h-full relative group/overlay ${selectedOverlay === overlay.id ? 'ring-2 ring-blue-500' : ''}`} style={{ transform: `rotate(${overlay.rotation}deg)`, opacity: overlay.opacity }}>
                      <img src={overlay.url} alt={overlay.name} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                    </div>
                  </Rnd>
                ))}

                {filteredSamples.map(sample => (
                  <button
                    key={sample.id}
                    className={`absolute h-4 w-4 rounded-full ring-2 ring-white shadow-lg transition-transform hover:scale-125 ${getStatusColor(sample.status)} ${selectedSample === sample.id ? 'scale-150 ring-blue-500 z-50' : ''}`}
                    style={{ left: sample.locationPoint?.x ?? 0, top: sample.locationPoint?.y ?? 0 }}
                    onClick={(e) => { e.stopPropagation(); setSelectedSample(sample.id); }}
                    title={`${sample.sampleNo || sample.sampleId} • ${sample.assessmentStatus || sample.status}`}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button variant="secondary" size="icon" className="h-9 w-9 bg-white shadow-md border-0" onClick={() => setZoom(Math.min(zoom + 0.1, 2))}><ZoomIn className="h-5 w-5" /></Button>
              <Button variant="secondary" size="icon" className="h-9 w-9 bg-white shadow-md border-0" onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}><ZoomOut className="h-5 w-5" /></Button>
              <Button variant="secondary" size="icon" className="h-9 w-9 bg-white shadow-md border-0" onClick={() => fileInputRef.current?.click()} disabled={!canEdit}><Upload className="h-5 w-5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

      <Dialog open={pendingUploads.length > 0} onOpenChange={(o) => !o && setPendingUploads([])}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Options</DialogTitle></DialogHeader>
          {pendingUploads[0] && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-slate-50">
                <p className="text-sm font-bold text-slate-700">{pendingUploads[0].file.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start h-12" onClick={() => handleUploadAction('marker')}><MapPin className="h-4 w-4 mr-3 text-blue-500" /> Place as New Sample Marker</Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => handleUploadAction('attach')}><Plus className="h-4 w-4 mr-3 text-emerald-500" /> Attach to Nearest Sample</Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => handleUploadAction('overlay')}><Layers className="h-4 w-4 mr-3 text-amber-500" /> Use as Map Overlay (Floor Plan)</Button>
                <Button variant="ghost" className="h-12" onClick={() => handleUploadAction('cancel')}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
