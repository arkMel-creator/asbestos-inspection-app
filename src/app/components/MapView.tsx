import { useState, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { MapOverlay, Sample, SampleStatus, Project } from '../types/index';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  ZoomIn,
  ZoomOut,
  Layers,
  Upload,
  MapPin,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  Lock,
  ArrowUp,
  RotateCw,
  Trash2,
  ChevronUp
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
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    layers: true,
    markers: true,
    addSample: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
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
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleRotate = (overlayId: string) => {
    if (!canEdit) return;
    const overlay = overlays.find(o => o.id === overlayId);
    if (overlay) {
      onUpdateOverlay(overlayId, { rotation: (overlay.rotation + 15) % 360 });
    }
  };

  const orderedOverlays = [...overlays].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  const uniqueValues = (values: (string | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => !!v)));

  const areas = uniqueValues(samples.map(s => s.area));

  const filteredSamples = samples.filter(sample => {
    // Support both location shapes: {x,y} object or locationPoint
    const hasLocation = sample.location || sample.locationPoint;
    if (!hasLocation) return false;
    const status = sample.assessmentStatus || sample.status;
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (areaFilter !== 'all' && sample.area !== areaFilter) return false;
    return true;
  });

  const getStatusColor = (status: SampleStatus | string | undefined) => {
    switch (status) {
      case 'pending': return '#EAB308';
      case 'positive': return '#DC2626';
      case 'negative': return '#16A34A';
      case 'removed': return '#6B7280';
      case 'presumed': return '#F97316';
      case 'strongly-presumed': return '#E11D48';
      default: return '#6B7280';
    }
  };

  const getSamplePosition = (sample: Sample): { x: number; y: number } | null => {
    // Check locationPoint first (map-placed marker), then location
    if (sample.locationPoint && (sample.locationPoint.x !== 0 || sample.locationPoint.y !== 0)) {
      return sample.locationPoint;
    }
    if (sample.location && typeof sample.location === 'object') {
      const loc = sample.location as { x: number; y: number };
      if (loc.x !== 0 || loc.y !== 0) return loc;
    }
    return null;
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!canEdit || !placementSampleId || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);
    onUpdateSample(placementSampleId, { locationPoint: { x, y } });
    toast.success('Sample marker placed');
    setPlacementSampleId('');
  };

  const getNearestSampleId = (point?: { x: number; y: number }) => {
    if (!point) return null;
    let nearestId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    samples.forEach(sample => {
      const pos = getSamplePosition(sample);
      if (!pos) return;
      const dx = pos.x - point.x;
      const dy = pos.y - point.y;
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
      await onAddOverlay(file);
    } else if (action === 'marker') {
      const sampleId = await onCreateSampleFromFile(file, dropPoint);
      if (sampleId) setSelectedSample(sampleId);
    } else if (action === 'attach') {
      const nearestId = getNearestSampleId(dropPoint);
      if (nearestId) {
        const fileId = await onAddFile(file);
        if (fileId) await onLinkToSample(fileId, nearestId);
      } else {
        toast.error('No nearby sample found to attach to');
      }
    }
    setPendingUploads(prev => prev.slice(1));
  };

  const handleNewSample = () => {
    if (!canEdit) return;
    const nextIndex = 1000 + samples.length + 1;
    const sampleId = `S-${nextIndex}`;
    const newSample: Omit<Sample, 'id'> = {
      sampleNo: sampleId,
      sampleId,
      site: project?.site || 'Unassigned',
      area: 'Unassigned',
      sampleType: 'Bulk',
      collectionDate: new Date().toISOString().split('T')[0],
      location: { x: 0, y: 0 },
      assessmentStatus: 'pending',
      status: 'pending',
      collector: 'Current User',
      notes: 'Created from Map View',
      linkedFileIds: []
    };
    if (onAddSample) {
      onAddSample(newSample);
      toast.success('New sample created. Click the map to place a marker.');
    }
  };

  const getSampleDisplayId = (sample: Sample) =>
    sample.sampleNo || sample.sampleId || sample.id;

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
            <div className="flex-1 overflow-y-auto">
              {/* Filters */}
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
                  <div className="p-4 space-y-3 bg-slate-50/30">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SampleStatus | 'all')}>
                        <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="removed">Removed</SelectItem>
                          <SelectItem value="presumed">Presumed</SelectItem>
                          <SelectItem value="strongly-presumed">Strongly Presumed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Site / Area</label>
                      <Select value={areaFilter} onValueChange={setAreaFilter}>
                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="All Areas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Areas</SelectItem>
                          {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Layers */}
              <div className="border-b">
                <button
                  onClick={() => toggleSection('layers')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <Layers className="h-4 w-4 text-slate-400" />
                    Map Overlays ({overlays.length})
                  </div>
                  {expandedSections.layers ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSections.layers && (
                  <div className="p-4 space-y-3">
                    {orderedOverlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className={`p-2.5 border rounded-lg hover:bg-slate-50 transition-all cursor-pointer ${selectedOverlay === overlay.id ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}
                        onClick={() => setSelectedOverlay(overlay.id)}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold truncate flex-1">{overlay.name}</span>
                            <div className="flex gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); onUpdateOverlay(overlay.id, { visible: !overlay.visible }); }}
                                title={overlay.visible ? 'Hide' : 'Show'}
                              >
                                <Eye className={`h-3 w-3 ${overlay.visible ? 'text-blue-500' : 'text-slate-300'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); onUpdateOverlay(overlay.id, { locked: !overlay.locked }); }}
                                title={overlay.locked ? 'Unlock' : 'Lock'}
                              >
                                <Lock className={`h-3 w-3 ${overlay.locked ? 'text-amber-500' : 'text-slate-300'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this overlay?')) onDeleteOverlay(overlay.id); }}
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); onReorderOverlay(overlay.id, 'down'); }}
                                title="Move Down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); onReorderOverlay(overlay.id, 'up'); }}
                                title="Move Up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); handleRotate(overlay.id); }}
                              title="Rotate 15°"
                            >
                              <RotateCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {overlays.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">
                        No overlays added yet. Drag & drop a floor plan image or use the upload button.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sample Markers */}
              <div className="border-b">
                <button
                  onClick={() => toggleSection('markers')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Place Markers
                  </div>
                  {expandedSections.markers ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSections.markers && (
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Sample</label>
                      <Select value={placementSampleId} onValueChange={setPlacementSampleId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Choose sample to place" />
                        </SelectTrigger>
                        <SelectContent>
                          {samples.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {getSampleDisplayId(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {placementSampleId ? (
                        <p className="text-[10px] text-blue-600 font-medium">Click anywhere on the map to place the marker.</p>
                      ) : (
                        <p className="text-[10px] text-slate-500">Pick a sample, then click the map.</p>
                      )}
                    </div>
                    {placementSampleId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setPlacementSampleId('')}
                      >
                        Cancel Placement
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* New Sample */}
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
                  <div className="p-4">
                    <Button
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm border-0"
                      onClick={handleNewSample}
                      disabled={!canEdit}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Sample
                    </Button>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Creates a sample, then use Place Markers to position it.
                    </p>
                  </div>
                )}
              </div>

              {/* Sample legend */}
              <div className="p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Legend</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: 'Pending', color: '#EAB308' },
                    { label: 'Positive', color: '#DC2626' },
                    { label: 'Negative', color: '#16A34A' },
                    { label: 'Removed', color: '#6B7280' },
                    { label: 'Presumed', color: '#F97316' },
                    { label: 'Strong Presumed', color: '#E11D48' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                      <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Canvas */}
        <Card className="flex-1 relative overflow-hidden bg-slate-50 border-slate-200">
          <CardContent className="p-0 h-full relative">
            <div
              ref={mapContainerRef}
              className={`h-full w-full overflow-auto relative transition-all ${isDragging ? 'bg-blue-50 ring-4 ring-blue-500 ring-inset' : ''} ${placementSampleId ? 'cursor-crosshair' : 'cursor-default'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleMapClick}
            >
              {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl p-8 text-blue-700 font-bold text-lg">
                    Drop to add as overlay
                  </div>
                </div>
              )}
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: '5000px',
                  height: '5000px',
                  backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              >
                {orderedOverlays.filter(o => o.visible).map((overlay) => (
                  <Rnd
                    key={overlay.id}
                    position={{ x: overlay.position.x, y: overlay.position.y }}
                    size={{ width: overlay.size.width, height: overlay.size.height }}
                    style={{ zIndex: overlay.zIndex ?? 1 }}
                    onDragStop={(_e, d) => onUpdateOverlay(overlay.id, { position: { x: d.x, y: d.y } })}
                    onResizeStop={(_e, _direction, ref, _delta, pos) =>
                      onUpdateOverlay(overlay.id, {
                        size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                        position: pos
                      })
                    }
                    scale={zoom}
                    disableDragging={overlay.locked}
                    enableResizing={!overlay.locked}
                    onMouseDown={() => setSelectedOverlay(overlay.id)}
                  >
                    <div
                      className={`w-full h-full relative ${selectedOverlay === overlay.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ transform: `rotate(${overlay.rotation}deg)`, opacity: overlay.opacity }}
                    >
                      <img
                        src={overlay.url}
                        alt={overlay.name}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                      {selectedOverlay === overlay.id && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold pointer-events-none">
                          {overlay.name}
                        </div>
                      )}
                    </div>
                  </Rnd>
                ))}

                {filteredSamples.map(sample => {
                  const pos = getSamplePosition(sample);
                  if (!pos) return null;
                  const status = sample.assessmentStatus || sample.status;
                  const color = getStatusColor(status);
                  const isSelected = selectedSample === sample.id;
                  return (
                    <button
                      key={sample.id}
                      className={`absolute transition-transform hover:scale-125 focus:outline-none ${isSelected ? 'scale-150 z-50' : 'z-10'}`}
                      style={{
                        left: pos.x - 8,
                        top: pos.y - 8,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: isSelected ? '3px solid #3B82F6' : '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedSample(isSelected ? null : sample.id); }}
                      title={`${getSampleDisplayId(sample)} • ${status}`}
                    />
                  );
                })}

                {/* Tooltip for selected sample */}
                {selectedSample && (() => {
                  const sample = samples.find(s => s.id === selectedSample);
                  const pos = sample ? getSamplePosition(sample) : null;
                  if (!sample || !pos) return null;
                  return (
                    <div
                      className="absolute z-[100] bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[160px] pointer-events-none"
                      style={{ left: pos.x + 12, top: pos.y - 10 }}
                    >
                      <div className="font-bold text-slate-900">{getSampleDisplayId(sample)}</div>
                      {sample.materialType && <div className="text-slate-600 mt-0.5">{sample.materialType}</div>}
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(sample.assessmentStatus || sample.status) }} />
                        <span className="capitalize">{sample.assessmentStatus || sample.status || 'pending'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button variant="secondary" size="icon" className="h-9 w-9 bg-white shadow-md border border-slate-200" onClick={() => setZoom(z => Math.min(z + 0.1, 3))} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="h-9 w-9 bg-white shadow-md border border-slate-200" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 bg-white shadow-md border border-slate-200"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canEdit}
                title="Upload overlay"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600 font-mono">
              {Math.round(zoom * 100)}%
            </div>

            {/* Placement mode indicator */}
            {placementSampleId && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg pointer-events-none">
                Click map to place marker for: {getSampleDisplayId(samples.find(s => s.id === placementSampleId) || {} as Sample) || 'sample'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />

      <Dialog open={pendingUploads.length > 0} onOpenChange={(o) => !o && setPendingUploads([])}>
        <DialogContent>
          <DialogHeader><DialogTitle>How would you like to use this file?</DialogTitle></DialogHeader>
          {pendingUploads[0] && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-slate-50">
                <p className="text-sm font-bold text-slate-700">{pendingUploads[0].file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(pendingUploads[0].file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start h-12" onClick={() => handleUploadAction('overlay')}>
                  <Layers className="h-4 w-4 mr-3 text-amber-500" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Use as Map Overlay</div>
                    <div className="text-xs text-muted-foreground">Floor plan, site map, or image layer</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => handleUploadAction('marker')}>
                  <MapPin className="h-4 w-4 mr-3 text-blue-500" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Create New Sample Marker</div>
                    <div className="text-xs text-muted-foreground">Link photo to a new inspection record</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => handleUploadAction('attach')}>
                  <Plus className="h-4 w-4 mr-3 text-emerald-500" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Attach to Nearest Sample</div>
                    <div className="text-xs text-muted-foreground">Link to the closest existing inspection</div>
                  </div>
                </Button>
                <Button variant="ghost" className="h-10 text-slate-500" onClick={() => handleUploadAction('cancel')}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
