// Pending Approvals Tab Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const PendingApprovalsTab = ({ pendingResources, handleApproval }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Pending Resource Approvals</CardTitle>
        <CardDescription className="text-slate-400">Review and approve community submissions</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingResources.length > 0 ? (
          <div className="space-y-4">
            {pendingResources.map((resource) => (
              <div
                key={resource.id}
                className="border border-slate-700 rounded-lg p-6 bg-slate-900/50"
                data-testid="pending-resource-card"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-semibold text-white mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-slate-400 mb-3">{resource.description}</p>
                    <div className="flex gap-4 text-sm text-slate-500 mb-2">
                      <span>Type: <span className="text-orange-400">{resource.content_type}</span></span>
                      <span>Topic: <span className="text-orange-400">{resource.topic}</span></span>
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-400 hover:text-orange-300 inline-block"
                    >
                      View Resource →
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproval(resource.id, 'approved')}
                      data-testid="approve-resource-btn"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproval(resource.id, 'rejected')}
                      data-testid="reject-resource-btn"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No pending resources</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovalsTab;
