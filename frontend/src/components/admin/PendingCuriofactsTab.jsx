// Pending Curiofacts Tab Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const PendingCuriofactsTab = ({ pendingCuriofacts, handleCuriofactApproval }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Pending Curiofacts</CardTitle>
        <CardDescription className="text-slate-400">Review user-submitted math facts</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingCuriofacts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No pending curiofacts to review</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {pendingCuriofacts.map((submission) => (
              <div key={submission.id} className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
                {submission.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={submission.image_url} 
                      alt={submission.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Submitted by: <span className="text-white">{submission.user_name}</span></p>
                    <span className="text-xs text-slate-500">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-white font-medium text-lg">{submission.title}</h3>
                  <p className="text-slate-300 text-sm line-clamp-4">{submission.content}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleCuriofactApproval(submission.id, 'approved')}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleCuriofactApproval(submission.id, 'rejected')}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingCuriofactsTab;
