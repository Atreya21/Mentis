// User Management Tab Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldOff, Trash2, Crown } from 'lucide-react';

const UserManagementTab = ({ 
  allUsers, 
  currentUser, 
  handleExportUsers, 
  handlePromoteToAdmin, 
  handleDemoteAdmin, 
  handleDeleteUser 
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Registered Users</CardTitle>
            <CardDescription className="text-slate-400">View all users and promote to admin</CardDescription>
          </div>
          <Button
            onClick={handleExportUsers}
            className="bg-green-600 hover:bg-green-700"
            data-testid="export-users-btn"
          >
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Name</TableHead>
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Joined</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-700" data-testid="user-row">
                  <TableCell className="text-white font-medium">{user.name}</TableCell>
                  <TableCell className="text-slate-400">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={
                      user.role === 'master_admin' ? 'bg-purple-500' :
                      user.role === 'admin' ? 'bg-orange-500' : 'bg-slate-600'
                    }>
                      {(user.role === 'admin' || user.role === 'master_admin') && <Crown className="w-3 h-3 mr-1" />}
                      {user.role === 'master_admin' ? 'Master Admin' : user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.role === 'user' && (
                        <Button
                          size="sm"
                          onClick={() => handlePromoteToAdmin(user.id)}
                          className="bg-orange-600 hover:bg-orange-700"
                          data-testid="promote-admin-btn"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Promote
                        </Button>
                      )}
                      {currentUser?.role === 'master_admin' && user.role === 'admin' && (
                        <Button
                          size="sm"
                          onClick={() => handleDemoteAdmin(user.id, user.email)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          data-testid="demote-admin-btn"
                        >
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Demote
                        </Button>
                      )}
                      {user.role !== 'admin' && user.role !== 'master_admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="delete-user-btn"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagementTab;
