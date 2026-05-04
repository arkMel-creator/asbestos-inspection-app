import { useEffect, useMemo, useState } from 'react';
import { Sample, FileItem, User, ShareLink } from '../types/index';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface GlobalSearchProps {
  samples: Sample[];
  files: FileItem[];
  users: User[];
  shareLinks: ShareLink[];
  query?: string;
}

type PreviewItem =
  | { type: 'sample'; item: Sample }
  | { type: 'file'; item: FileItem }
  | { type: 'user'; item: User }
  | { type: 'share'; item: ShareLink }
  | null;

export function GlobalSearch({ samples, files, users, shareLinks, query: controlledQuery }: GlobalSearchProps) {
  const query = controlledQuery ?? '';
  const [preview, setPreview] = useState<PreviewItem>(null);

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const sampleMatches = samples.filter(sample =>
      (sample.sampleNo?.toLowerCase().includes(q) || false) ||
      (sample.sampleId?.toLowerCase().includes(q) || false) ||
      (sample.site?.toLowerCase().includes(q) || false) ||
      (sample.area?.toLowerCase().includes(q) || false) ||
      (sample.materialType?.toLowerCase().includes(q) || false) ||
      (sample.itemDescription?.toLowerCase().includes(q) || false) ||
      sample.collector.toLowerCase().includes(q) ||
      (sample.notes || '').toLowerCase().includes(q) ||
      (sample.labName || '').toLowerCase().includes(q)
    );

    const fileMatches = files.filter(file =>
      file.name.toLowerCase().includes(q) ||
      file.uploadedBy.toLowerCase().includes(q) ||
      (file.folderPath || '').toLowerCase().includes(q)
    );

    const userMatches = users.filter(user =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );

    const shareMatches = shareLinks.filter(link =>
      link.name.toLowerCase().includes(q) ||
      link.accessType.toLowerCase().includes(q) ||
      (link.accessScope || '').toLowerCase().includes(q)
    );

    return { samples: sampleMatches, files: fileMatches, users: userMatches, shareLinks: shareMatches };
  }, [query, samples, files, users, shareLinks]);

  useEffect(() => {
    if (!results) { setPreview(null); return; }
    if (results.samples.length) { setPreview({ type: 'sample', item: results.samples[0] }); return; }
    if (results.files.length) { setPreview({ type: 'file', item: results.files[0] }); return; }
    if (results.users.length) { setPreview({ type: 'user', item: results.users[0] }); return; }
    if (results.shareLinks.length) { setPreview({ type: 'share', item: results.shareLinks[0] }); }
    else { setPreview(null); }
  }, [results]);

  const getSampleDisplayId = (sample: Sample) => sample.sampleNo || sample.sampleId || sample.id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Global Search</h2>
        <p className="text-sm text-muted-foreground">Search across samples, files, users, and sharing links.</p>
      </div>

      {!query.trim() && (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Start typing in the top search bar to see results.
        </div>
      )}

      {query.trim() && !results && (
        <div className="text-sm text-muted-foreground">Searching...</div>
      )}

      {results && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Samples ({results.samples.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {results.samples.map(sample => (
                  <button
                    key={sample.id}
                    className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30 transition-colors"
                    onClick={() => setPreview({ type: 'sample', item: sample })}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getSampleDisplayId(sample)}</span>
                      <Badge className="bg-slate-100 text-slate-800 text-xs">{sample.assessmentStatus || sample.status || 'pending'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sample.materialType || sample.area || 'Unknown material'}</div>
                  </button>
                ))}
                {results.samples.length === 0 && <div className="text-xs text-muted-foreground py-2">No matches</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Files ({results.files.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {results.files.map(file => (
                  <button
                    key={file.id}
                    className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30 transition-colors"
                    onClick={() => setPreview({ type: 'file', item: file })}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate max-w-[150px]">{file.name}</span>
                      <Badge className="bg-slate-100 text-slate-800 text-xs">{file.type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{file.folderPath || '/Projects'}</div>
                  </button>
                ))}
                {results.files.length === 0 && <div className="text-xs text-muted-foreground py-2">No matches</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users ({results.users.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {results.users.map(user => (
                  <button
                    key={user.id}
                    className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30 transition-colors"
                    onClick={() => setPreview({ type: 'user', item: user })}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{user.name}</span>
                      <Badge className="bg-slate-100 text-slate-800 text-xs">{user.role}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                  </button>
                ))}
                {results.users.length === 0 && <div className="text-xs text-muted-foreground py-2">No matches</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share Links ({results.shareLinks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {results.shareLinks.map(link => (
                  <button
                    key={link.id}
                    className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30 transition-colors"
                    onClick={() => setPreview({ type: 'share', item: link })}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{link.name}</span>
                      <Badge className="bg-slate-100 text-slate-800 text-xs">{link.accessType}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{link.accessScope || 'public'}</div>
                  </button>
                ))}
                {results.shareLinks.length === 0 && <div className="text-xs text-muted-foreground py-2">No matches</div>}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!preview && <div className="text-xs text-muted-foreground">Select a result to preview.</div>}
              {preview?.type === 'sample' && (
                <div className="space-y-2">
                  <div className="text-base font-semibold">{getSampleDisplayId(preview.item)}</div>
                  <div className="text-xs text-muted-foreground">{preview.item.site} {preview.item.area ? `• ${preview.item.area}` : ''}</div>
                  {preview.item.materialType && <div><span className="text-muted-foreground">Material:</span> {preview.item.materialType}</div>}
                  <div><span className="text-muted-foreground">Status:</span> {preview.item.assessmentStatus || preview.item.status || 'pending'}</div>
                  {preview.item.priorityLevel && <div><span className="text-muted-foreground">Priority:</span> {preview.item.priorityLevel}</div>}
                  <div><span className="text-muted-foreground">Collector:</span> {preview.item.collector}</div>
                  <div><span className="text-muted-foreground">Date:</span> {preview.item.collectionDate}</div>
                  {preview.item.notes && <div className="text-xs text-muted-foreground italic mt-1">{preview.item.notes}</div>}
                </div>
              )}
              {preview?.type === 'file' && (
                <div className="space-y-2">
                  <div className="text-base font-semibold truncate">{preview.item.name}</div>
                  <div className="text-xs text-muted-foreground">{preview.item.folderPath || '/Projects'}</div>
                  {preview.item.type === 'image' && preview.item.url && (
                    <img src={preview.item.url} alt={preview.item.name} className="w-full max-h-48 object-contain rounded border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  {preview.item.type === 'pdf' && preview.item.url && (
                    <a href={preview.item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Open PDF</a>
                  )}
                  <div><span className="text-muted-foreground">Uploaded by:</span> {preview.item.uploadedBy}</div>
                  <div><span className="text-muted-foreground">Size:</span> {preview.item.size}</div>
                </div>
              )}
              {preview?.type === 'user' && (
                <div className="space-y-2">
                  <div className="text-base font-semibold">{preview.item.name}</div>
                  <div className="text-xs text-muted-foreground">{preview.item.email}</div>
                  <div><span className="text-muted-foreground">Role:</span> {preview.item.role}</div>
                  <div><span className="text-muted-foreground">Last active:</span> {preview.item.lastActive ? new Date(preview.item.lastActive).toLocaleDateString() : 'Never'}</div>
                </div>
              )}
              {preview?.type === 'share' && (
                <div className="space-y-2">
                  <div className="text-base font-semibold">{preview.item.name}</div>
                  <div><span className="text-muted-foreground">Access:</span> {preview.item.accessType}</div>
                  <div><span className="text-muted-foreground">Scope:</span> {preview.item.accessScope || 'public'}</div>
                  <div><span className="text-muted-foreground">Views:</span> {preview.item.views}</div>
                  <div><span className="text-muted-foreground">Expires:</span> {preview.item.expiresAt ? new Date(preview.item.expiresAt).toLocaleDateString() : 'Never'}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
