import { useEffect, useMemo, useState } from 'react';
import { Sample, FileItem, User, ShareLink } from '../types';
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
      (sample.sampleId?.toLowerCase().includes(q) || false) ||
      (sample.site?.toLowerCase().includes(q) || false) ||
      (sample.area?.toLowerCase().includes(q) || false) ||
      (sample.equipment?.toLowerCase().includes(q) || false) ||
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

    const result = {
      samples: sampleMatches,
      files: fileMatches,
      users: userMatches,
      shareLinks: shareMatches
    };
    return result;
  }, [query, samples, files, users, shareLinks]);

  useEffect(() => {
    if (!results) {
      setPreview(null);
      return;
    }
    if (results.samples.length) {
      setPreview({ type: 'sample', item: results.samples[0] });
      return;
    }
    if (results.files.length) {
      setPreview({ type: 'file', item: results.files[0] });
      return;
    }
    if (results.users.length) {
      setPreview({ type: 'user', item: results.users[0] });
      return;
    }
    if (results.shareLinks.length) {
      setPreview({ type: 'share', item: results.shareLinks[0] });
    } else {
      setPreview(null);
    }
  }, [results]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Global Search</h2>
        <p className="text-sm text-muted-foreground">
          Search across samples, files, users, and sharing links.
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        Start typing in the top search bar to see results.
      </div>

      {!results && (
        <div className="text-sm text-muted-foreground">Start typing to see results.</div>
      )}

      {results && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Samples ({results.samples.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.samples.map(sample => (
                <button
                  key={sample.id}
                  className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30"
                  onClick={() => setPreview({ type: 'sample', item: sample })}
                >
                  <div className="flex items-center justify-between">
                    <span>{sample.sampleId} • {sample.site}</span>
                    <Badge className="bg-slate-100 text-slate-800">{sample.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{sample.area} • {sample.equipment}</div>
                </button>
              ))}
              {results.samples.length === 0 && (
                <div className="text-xs text-muted-foreground">No matches</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Files ({results.files.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.files.map(file => (
                <button
                  key={file.id}
                  className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30"
                  onClick={() => setPreview({ type: 'file', item: file })}
                >
                  <div className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <Badge className="bg-slate-100 text-slate-800">{file.type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{file.folderPath || '/Projects'}</div>
                </button>
              ))}
              {results.files.length === 0 && (
                <div className="text-xs text-muted-foreground">No matches</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users ({results.users.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.users.map(user => (
                <button
                  key={user.id}
                  className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30"
                  onClick={() => setPreview({ type: 'user', item: user })}
                >
                  <div className="flex items-center justify-between">
                    <span>{user.name}</span>
                    <Badge className="bg-slate-100 text-slate-800">{user.role}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </button>
              ))}
              {results.users.length === 0 && (
                <div className="text-xs text-muted-foreground">No matches</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share Links ({results.shareLinks.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.shareLinks.map(link => (
                <button
                  key={link.id}
                  className="w-full text-left border rounded p-2 text-sm hover:bg-muted/30"
                  onClick={() => setPreview({ type: 'share', item: link })}
                >
                  <div className="flex items-center justify-between">
                    <span>{link.name}</span>
                    <Badge className="bg-slate-100 text-slate-800">{link.accessType}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{link.accessScope || 'public'}</div>
                </button>
              ))}
              {results.shareLinks.length === 0 && (
                <div className="text-xs text-muted-foreground">No matches</div>
              )}
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
                  <div className="text-base font-medium">{preview.item.sampleId}</div>
                  <div className="text-xs text-muted-foreground">{preview.item.site} • {preview.item.area}</div>
                  <div>Status: {preview.item.status}</div>
                  <div>Risk: {preview.item.riskLevel}</div>
                  <div>Collector: {preview.item.collector}</div>
                  <div>Collected: {preview.item.collectionDate}</div>
                </div>
              )}
              {preview?.type === 'file' && (
                <div className="space-y-2">
                  <div className="text-base font-medium">{preview.item.name}</div>
                  <div className="text-xs text-muted-foreground">{preview.item.folderPath || '/Projects'}</div>
                  {preview.item.type === 'image' && (
                    <img src={preview.item.url} alt={preview.item.name} className="w-full max-h-48 object-contain rounded" />
                  )}
                  {preview.item.type === 'pdf' && (
                    <iframe title={preview.item.name} src={preview.item.url} className="w-full h-48 rounded border" />
                  )}
                  {preview.item.type === 'video' && (
                    <video src={preview.item.url} controls className="w-full h-48 rounded" />
                  )}
                </div>
              )}
              {preview?.type === 'user' && (
                <div className="space-y-2">
                  <div className="text-base font-medium">{preview.item.name}</div>
                  <div className="text-xs text-muted-foreground">{preview.item.email}</div>
                  <div>Role: {preview.item.role}</div>
                </div>
              )}
              {preview?.type === 'share' && (
                <div className="space-y-2">
                  <div className="text-base font-medium">{preview.item.name}</div>
                  <div>Access: {preview.item.accessType}</div>
                  <div>Scope: {preview.item.accessScope || 'public'}</div>
                  <div>Expires: {preview.item.expiresAt ? new Date(preview.item.expiresAt).toLocaleDateString() : 'Never'}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
