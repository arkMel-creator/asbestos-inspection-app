import { useEffect, useMemo, useState } from 'react';
import { Sample, SampleFieldDefinition, SampleFieldType, SampleStatus, RiskLevel } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Search, ClipboardList, Settings, Edit2, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface SamplesProps {
  samples: Sample[];
  onAddSample: (sample: Omit<Sample, 'id'>) => void;
  onUpdateSample: (id: string, updates: Partial<Sample>) => void;
  canEdit: boolean;
  canManageSchema: boolean;
  defaultSite?: string;
}

const statusOptions: SampleStatus[] = ['pending', 'positive', 'negative', 'removed', 'presumed', 'strongly-presumed'];
const fieldTypes: SampleFieldType[] = ['text', 'number', 'date', 'dropdown', 'multi-select', 'checkbox'];

const statusBadge = (status: SampleStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'positive': return 'bg-red-100 text-red-800';
    case 'negative': return 'bg-green-100 text-green-800';
    case 'removed': return 'bg-gray-100 text-gray-800';
    case 'presumed': return 'bg-orange-100 text-orange-800';
    case 'strongly-presumed': return 'bg-rose-100 text-rose-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const defaultSchema: SampleFieldDefinition[] = [
  { key: 'location', label: 'Location', type: 'text', required: true },
  { key: 'surfaceType', label: 'Surface or Plant/Equipment type', type: 'text', required: true },
  { key: 'itemDescription', label: 'Source or Item Description', type: 'text', required: true },
  { key: 'materialType', label: 'Hazardous Material Type', type: 'text', required: true },
  { key: 'sampleNo', label: 'Sample No', type: 'text', required: true },
  { key: 'assessmentStatus', label: 'Assessment status*', type: 'dropdown', required: true, options: statusOptions },
  { key: 'friability', label: 'Friability*', type: 'dropdown', required: true, options: ['Friable', 'Non-Friable'] },
  { key: 'materialCondition', label: 'Material Condition*', type: 'dropdown', required: true, options: ['Good', 'Fair', 'Poor', 'Very Poor'] },
  { key: 'deteriorationPotential', label: 'Damage or Deterioration Potential*', type: 'dropdown', required: true, options: ['Low', 'Medium', 'High'] },
  { key: 'activityLevel', label: 'Activity Level*', type: 'dropdown', required: true, options: ['Low', 'Medium', 'High'] },
  { key: 'accessibility', label: 'Accessibility*', type: 'dropdown', required: true, options: ['Easy', 'Moderate', 'Difficult', 'Inaccessible'] },
  { key: 'priorityLevel', label: 'Priority Level*', type: 'dropdown', required: true, options: ['Low', 'Medium', 'High', 'Very High'] },
  { key: 'reinspectionSchedule', label: 'Recommended Re-inspection Schedule* (Years)', type: 'number', required: true },
  { key: 'approxQuantity', label: 'Approx. Quantity (m2/linear m)', type: 'text', required: true },
  { key: 'controlRecommendation', label: 'Control Recommendation', type: 'text', required: false },
  { key: 'notes', label: 'Comments', type: 'text', required: false },
  { key: 'collectionDate', label: 'Date Inspected', type: 'date', required: true },
  { key: 'collector', label: 'Inspector', type: 'text', required: true }
];

const protectedKeys = new Set([
  'location',
  'surfaceType',
  'itemDescription',
  'materialType',
  'sampleNo',
  'assessmentStatus',
  'friability',
  'materialCondition',
  'collectionDate',
  'collector'
]);

export function Samples({ samples, onAddSample, onUpdateSample, canEdit, canManageSchema, defaultSite }: SamplesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [schema, setSchema] = useState<SampleFieldDefinition[]>(defaultSchema);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);

  const [newSample, setNewSample] = useState<Omit<Sample, 'id'>>({
    sampleNo: `S-${1000 + samples.length + 1}`,
    location: defaultSite || '',
    surfaceType: '',
    itemDescription: '',
    materialType: '',
    sampleType: 'Bulk',
    collectionDate: new Date().toISOString().split('T')[0],
    assessmentStatus: 'pending',
    friability: 'Non-Friable',
    materialCondition: 'Good',
    deteriorationPotential: 'Low',
    activityLevel: 'Low',
    accessibility: 'Easy',
    priorityLevel: 'Low',
    reinspectionSchedule: '1',
    approxQuantity: '',
    controlRecommendation: '',
    collector: '',
    notes: '',
    customFields: {}
  });

  useEffect(() => {
    if (defaultSite) {
      setNewSample(prev => ({ ...prev, location: defaultSite }));
    }
  }, [defaultSite]);

  const filteredSamples = samples.filter(sample =>
    Object.values(sample).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAddSample = () => {
    if (newSample.sampleNo && newSample.location && newSample.materialType) {
      onAddSample(newSample);
      setIsAddOpen(false);
      setNewSample({
        ...newSample,
        sampleNo: `S-${1000 + samples.length + 2}`,
        itemDescription: '',
        approxQuantity: '',
        notes: ''
      });
    } else {
      toast.error('Please fill in required fields');
    }
  };

  const handleUpdateSampleSubmit = () => {
    if (editingSample) {
      onUpdateSample(editingSample.id, editingSample);
      setEditingSample(null);
      toast.success('Record updated');
    }
  };

  const handleAddField = () => {
    const key = `field_${Date.now()}`;
    setSchema([...schema, { key, label: 'New Field', type: 'text', required: false }]);
  };

  const updateField = (index: number, updates: Partial<SampleFieldDefinition>) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...updates };
    setSchema(newSchema);
  };

  const removeField = (index: number) => {
    const field = schema[index];
    if (protectedKeys.has(field.key)) {
      toast.error('Cannot remove system field');
      return;
    }
    setSchema(schema.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Inspection Data</h3>
          <p className="text-sm text-slate-500 font-medium text-slate-500">Hazardous Materials Register & Assessment</p>
        </div>
        <div className="flex gap-2">
          {canManageSchema && (
            <Button variant="outline" size="sm" onClick={() => setIsSchemaOpen(true)} className="border-slate-200 font-bold">
              <Settings className="h-4 w-4 mr-2" />
              Configure Form
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              <Plus className="h-4 w-4 mr-2" />
              New Inspection
            </Button>
          )}
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Sample No, Location or Material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="w-[120px] font-bold text-slate-600 uppercase text-[10px] tracking-wider">Sample No</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Location / Surface</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Material Type</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Condition</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample) => (
                  <TableRow key={sample.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                    <TableCell className="font-mono font-bold text-emerald-700">{sample.sampleNo || sample.sampleId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{sample.location || sample.site}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{sample.surfaceType || sample.area}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 font-medium">{sample.materialType}</span>
                        <span className="text-[10px] text-slate-400 italic line-clamp-1">{sample.itemDescription}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                        sample.materialCondition === 'Very Poor' ? 'bg-red-50 text-red-700 border-red-100' :
                        sample.materialCondition === 'Poor' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        sample.materialCondition === 'Fair' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {sample.materialCondition || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${statusBadge(sample.assessmentStatus || sample.status as any)} border-0 shadow-none text-[10px] font-bold uppercase`}>
                        {(sample.assessmentStatus || sample.status || 'pending').replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={() => setEditingSample(sample)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSamples.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center text-slate-400 italic font-medium">
                      No matching records found in this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Sample Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold">New Inspection Entry</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2">
               <div className="px-3 py-1 bg-emerald-500 rounded text-[10px] font-black uppercase">Div 6</div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {schema.map((field) => (
                <div key={field.key} className={field.key === 'notes' || field.key === 'itemDescription' || field.key === 'controlRecommendation' ? 'col-span-full space-y-2' : 'space-y-2'}>
                  <Label htmlFor={field.key} className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === 'dropdown' ? (
                    <Select 
                      value={(newSample as any)[field.key] || ''} 
                      onValueChange={(val) => setNewSample({ ...newSample, [field.key]: val })}
                    >
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt.replace('-', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={(newSample as any)[field.key] || ''}
                      onChange={(e) => setNewSample({ ...newSample, [field.key]: e.target.value })}
                      className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 font-medium"
                      placeholder={`Enter ${field.label.split('*')[0]}...`}
                    />
                  )}
                </div>
              ))}
              
              <div className="col-span-full pt-4">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 block">Site Photo</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <Camera className="h-8 w-8 text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600">Click to upload photo or drag & drop</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="h-12 px-8 font-bold text-slate-500">Cancel</Button>
              <Button onClick={handleAddSample} className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 shadow-lg shadow-emerald-100">Save Inspection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sample Dialog */}
      <Dialog open={!!editingSample} onOpenChange={(o) => !o && setEditingSample(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-0">
          <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold">Edit Record: {editingSample?.sampleNo || editingSample?.sampleId}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6">
            {editingSample && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {schema.map((field) => (
                  <div key={field.key} className={field.key === 'notes' || field.key === 'itemDescription' || field.key === 'controlRecommendation' ? 'col-span-full space-y-2' : 'space-y-2'}>
                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{field.label}</Label>
                    {field.type === 'dropdown' ? (
                      <Select 
                        value={(editingSample as any)[field.key] || ''} 
                        onValueChange={(val) => setEditingSample({ ...editingSample, [field.key]: val })}
                      >
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt.replace('-', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={(editingSample as any)[field.key] || ''}
                        onChange={(e) => setEditingSample({ ...editingSample, [field.key]: e.target.value })}
                        className="h-11 bg-slate-50 border-slate-200 font-medium"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setEditingSample(null)} className="h-12 px-8 font-bold text-slate-500">Cancel</Button>
              <Button onClick={handleUpdateSampleSubmit} className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 shadow-lg shadow-blue-100">Update Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schema Management */}
      <Dialog open={isSchemaOpen} onOpenChange={setIsSchemaOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="font-bold">Form Configuration</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
              {schema.map((field, index) => (
                <div key={field.key} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50/50">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} className="h-9 font-bold text-xs" disabled={protectedKeys.has(field.key)} />
                    <Select value={field.type} onValueChange={(val: any) => updateField(index, { type: val })} disabled={protectedKeys.has(field.key)}>
                      <SelectTrigger className="h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>{fieldTypes.map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 px-2">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, { required: e.target.checked })} disabled={protectedKeys.has(field.key)} />
                      <span className="text-[10px] font-black uppercase text-slate-400">Required</span>
                    </div>
                  </div>
                  {!protectedKeys.has(field.key) && <Button variant="ghost" size="icon" onClick={() => removeField(index)}><Settings className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full border-dashed h-11 font-bold text-slate-500" onClick={handleAddField}><Plus className="h-4 w-4 mr-2" />Add Custom Inspection Column</Button>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4"><Button onClick={() => setIsSchemaOpen(false)} className="h-11 px-8 font-bold">Close & Save</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
