// UserProfileDialog Component - Shows user profile in a modal
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Calendar, Link2, Award, UserPlus, MessageCircle, Flag } from 'lucide-react';

const UserProfileDialog = ({
  open,
  onOpenChange,
  profile,
  loading,
  connections,
  onSendConnectionRequest,
  onAcceptRequest,
  onRejectRequest,
  onOpenChat,
  onRequestEmail,
  onOpenReport
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">User Profile</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                {profile.can_see_email ? (
                  <p className="text-slate-400">{profile.email}</p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRequestEmail(profile.id)}
                    className="text-orange-400 hover:text-orange-300 p-0 h-auto"
                  >
                    Request Email
                  </Button>
                )}
                {profile.college && (
                  <Badge variant="outline" className="mt-2 border-slate-600 text-slate-300">
                    {profile.college}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 text-center border border-yellow-500/30">
                <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gradient">{profile.mentis_score || 0}</p>
                <p className="text-xs text-slate-300">Mentis Score</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <Link2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{profile.connections_count || 0}</p>
                <p className="text-xs text-slate-400">Connections</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <BookOpen className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{profile.resources_count || 0}</p>
                <p className="text-xs text-slate-400">Approved Resources</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-400">Member Since</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {profile.connection_status === 'accepted' ? (
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const conn = connections.find(c => c.id === profile.connection_id);
                    if (conn) {
                      onOpenChange(false);
                      onOpenChat(conn);
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              ) : profile.connection_status === 'pending' ? (
                profile.is_requester ? (
                  <Button className="flex-1 bg-yellow-600" disabled>
                    Request Sent
                  </Button>
                ) : (
                  <div className="flex gap-2 flex-1">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => onAcceptRequest(profile.connection_id)}
                    >
                      Accept
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => onRejectRequest(profile.connection_id)}
                    >
                      Reject
                    </Button>
                  </div>
                )
              ) : (
                <Button 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  onClick={() => onSendConnectionRequest(profile.id)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              )}
              <Button
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600/20"
                onClick={() => {
                  onOpenChange(false);
                  onOpenReport(profile.id);
                }}
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
