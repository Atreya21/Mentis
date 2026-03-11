// ConnectionList Component - Sidebar showing connections, pending/sent requests
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Bell, UserCheck, Clock, Circle, Pin } from 'lucide-react';

const ConnectionList = ({
  connections,
  pendingRequests,
  sentRequests,
  pinnedChats,
  activeChat,
  onlineUsers,
  onOpenChat,
  onAcceptRequest,
  onRejectRequest
}) => {
  return (
    <div className="space-y-4">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-orange-400" />
              Pending Requests
              <Badge className="bg-orange-500 ml-2">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{req.requester?.name}</p>
                  <p className="text-slate-400 text-sm">{req.requester?.college || 'No college'}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                    onClick={() => onAcceptRequest(req.id)}
                    data-testid="accept-request-btn"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => onRejectRequest(req.id)}
                    data-testid="reject-request-btn"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Connections */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <UserCheck className="w-5 h-5 text-green-400" />
            My Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {connections.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No connections yet</p>
            ) : (
              <div className="space-y-2">
                {/* Sort connections - pinned first */}
                {[...connections]
                  .sort((a, b) => {
                    const aPinned = pinnedChats.includes(a.id);
                    const bPinned = pinnedChats.includes(b.id);
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    return 0;
                  })
                  .map((conn) => (
                  <div 
                    key={conn.id} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      activeChat?.id === conn.id ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-slate-900/50 hover:bg-slate-900'
                    } ${pinnedChats.includes(conn.id) ? 'border-l-2 border-l-yellow-400' : ''}`}
                    onClick={() => onOpenChat(conn)}
                    data-testid="connection-item"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {conn.other_user?.name?.charAt(0).toUpperCase()}
                        </div>
                        {onlineUsers?.has(conn.other_user?.id) && (
                          <Circle className="w-3 h-3 text-green-500 fill-green-500 absolute -bottom-0.5 -right-0.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-white font-medium">{conn.other_user?.name}</p>
                          {pinnedChats.includes(conn.id) && (
                            <Pin className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                        {conn.last_message && (
                          <p className="text-slate-400 text-xs truncate max-w-[120px]">
                            {conn.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                    {conn.unread_count > 0 && (
                      <Badge className="bg-orange-500">{conn.unread_count}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
              Sent Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sentRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{req.receiver?.name}</p>
                  <p className="text-slate-400 text-sm">Pending...</p>
                </div>
                <Badge className="bg-yellow-600">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConnectionList;
