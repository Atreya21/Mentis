// Pending VEX Tab Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const PendingVEXTab = ({ pendingReels, handleReelApproval }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Pending VEX</CardTitle>
        <CardDescription className="text-slate-400">Review and approve user-submitted educational videos</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingReels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No pending VEX to review</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingReels.map((reel) => (
              <div key={reel.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
                  {reel.video_type === 'youtube' ? (
                    <iframe
                      src={reel.video_url}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={reel.caption}
                    />
                  ) : (
                    <a 
                      href={reel.original_url || reel.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300"
                    >
                      View Video
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">{reel.user_name}</p>
                  <p className="text-slate-400 text-sm line-clamp-3">{reel.caption}</p>
                  <p className="text-xs text-slate-500">
                    Platform: {reel.video_type} | 
                    Submitted: {new Date(reel.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleReelApproval(reel.id, 'approved')}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReelApproval(reel.id, 'rejected')}
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

export default PendingVEXTab;
