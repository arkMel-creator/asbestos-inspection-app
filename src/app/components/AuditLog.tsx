import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AuditLogEntry } from '../types';
import { History } from 'lucide-react';

interface AuditLogProps {
  entries: AuditLogEntry[];
}

export function AuditLog({ entries }: AuditLogProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Track system activity and permission changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{entry.actor}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>{entry.target || '—'}</TableCell>
                  <TableCell>{entry.details || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {entries.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No audit events logged</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
