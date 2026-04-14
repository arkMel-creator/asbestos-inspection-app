export interface Project {
  id: string;
  jobNumber?: string;
  name: string;
  client: string;
  site: string;
  status: 'active' | 'completed' | 'on-hold';
  category?: string;
  template?: string;
  pricingModel?: 'fixed' | 'time-materials';
  estimatedCost?: number;
  startDate: string;
  dueDate?: string;
  description?: string;
  manager: string;
  assignedStaff?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MapOverlay {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'video';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  uploadedBy: string;
  uploadedAt: string;
  zIndex?: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: 'admin' | 'inspector' | 'viewer' | 'external';
  createdAt: string;
  lastActive: string;
  avatar?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target?: string;
  details?: string;
}

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  payload?: Record<string, any>;
}

export interface ShareLink {
  id: string;
  name: string;
  url: string;
  accessType: 'view-only' | 'edit';
  accessScope?: 'public' | 'password' | 'restricted';
  password?: string;
  allowedEmails?: string[];
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  views: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video' | 'other';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  thumbnail?: string;
  isOverlay: boolean;
  overlayId?: string | null;
  linkedSampleIds?: string[];
  folderPath?: string;
}

export type SampleStatus = 'pending' | 'positive' | 'negative' | 'removed' | 'presumed' | 'strongly-presumed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface Sample {
  id: string;
  sampleNo: string;
  location: { x: number; y: number };
  surfaceType?: string;
  itemDescription?: string;
  materialType?: string;
  sampleType: string;
  collectionDate: string;
  assessmentStatus: SampleStatus;
  friability?: string;
  materialCondition?: string;
  deteriorationPotential?: string;
  activityLevel?: string;
  accessibility?: string;
  priorityLevel?: string;
  reinspectionSchedule?: string;
  approxQuantity?: string;
  controlRecommendation?: string;
  collector: string;
  asbestosType?: string;
  concentration?: number;
  labName?: string;
  labReference?: string;
  notes?: string;
  locationPoint?: { x: number; y: number };
  linkedFileIds?: string[];
  customFields?: Record<string, string | number | boolean | string[]>;
  
  // Legacy fields for compatibility
  sampleId?: string;
  site?: string;
  area?: string;
  riskLevel?: RiskLevel;
  status?: SampleStatus;
  equipment?: string;
  level?: string;
  condition?: string;
  amount?: string;
  materialDescription?: string;
}

export type SampleFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'multi-select' | 'checkbox';

export interface SampleFieldDefinition {
  key: string;
  label: string;
  type: SampleFieldType;
  required: boolean;
  options?: string[];
}
