import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SyncQueueItem } from '../types';
import { CloudOff, CloudUpload, Trash2 } from 'lucide-react';

interface OfflineQueueProps {
  queue: SyncQueueItem[];
  isOnline: boolean;
  onSync: () => void;
  onClear: () => void;
}

export function OfflineQueue({ queue, isOnline, onSync, onClear }: OfflineQueueProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Offline Queue</h2>
        <p className="text-sm text-muted-foreground">
          Actions queued while offline will sync when you reconnect.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? <CloudUpload className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
            <span>{isOnline ? 'Online' : 'Offline'} • {queue.length} queued</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={onSync} disabled={!isOnline || queue.length === 0}>
              Sync Now
            </Button>
            <Button variant="outline" onClick={onClear} disabled={queue.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queued Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{item.action}</TableCell>
                  <TableCell>{item.entity}</TableCell>
                  <TableCell className="max-w-[320px] truncate">
                    {item.payload ? JSON.stringify(item.payload) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {queue.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <CloudOff className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No queued actions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
