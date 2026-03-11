// User Reports Tab Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const UserReportsTab = ({ userReports, handleReportStatus }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">User Reports</CardTitle>
        <CardDescription className="text-slate-400">Review misconduct reports from users</CardDescription>
      </CardHeader>
      <CardContent>
        {userReports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No reports to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userReports.map((report) => (
              <div key={report.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <Badge className={
                        report.status === 'pending' ? 'bg-yellow-600' :
                        report.status === 'reviewed' ? 'bg-blue-600' :
                        'bg-green-600'
                      }>
                        {report.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Reported User</p>
                        <p className="text-white">{report.reported_user?.name || 'Unknown'}</p>
                        <p className="text-slate-400 text-sm">{report.reported_user?.email || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Reporter</p>
                        <p className="text-white">{report.reporter?.name || 'Unknown'}</p>
                        <p className="text-slate-400 text-sm">{report.reporter?.email || 'Unknown'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Reason</p>
                      <Badge variant="outline" className="border-red-500 text-red-400">
                        {report.reason?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Description</p>
                      <p className="text-slate-300">{report.description}</p>
                    </div>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleReportStatus(report.id, 'reviewed')}
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleReportStatus(report.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserReportsTab;
