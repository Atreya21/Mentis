// Admin Stats Overview Component
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Gamepad2, Sparkles } from 'lucide-react';

const AdminStatsOverview = ({ stats }) => {
  const statCards = [
    { icon: Users, color: 'text-blue-400', value: stats.users, label: 'Users' },
    { icon: BookOpen, color: 'text-green-400', value: stats.resources, label: 'Resources' },
    { icon: Gamepad2, color: 'text-purple-400', value: stats.games, label: 'Games' },
    { icon: Sparkles, color: 'text-yellow-400', value: stats.facts, label: 'Curiofacts' },
    { icon: Users, color: 'text-orange-400', value: stats.matrixMembers, label: 'Matrix' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatsOverview;
