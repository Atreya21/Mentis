import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BookOpen, Plus, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResourceHub = () => {
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('approved');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'notes',
    url: '',
    topic: ''
  });

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API}/resources?status=${filter}`);
      setResources(res.data);
    } catch (err) {
      toast.error('Failed to fetch resources');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit resources');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/resources`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resource submitted for approval!');
      setDialogOpen(false);
      setFormData({ title: '', description: '', content_type: 'notes', url: '', topic: '' });
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit resource');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">
              Resource Hub
            </h1>
            <p className="text-lg text-slate-400">
              Curated mathematical resources from our community
            </p>
          </motion.div>

          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect" data-testid="submit-resource-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl text-white">Submit a Resource</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="mt-2"
                      data-testid="resource-title-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="mt-2"
                      rows={3}
                      data-testid="resource-description-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="content_type">Type</Label>
                      <Select
                        value={formData.content_type}
                        onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                      >
                        <SelectTrigger className="mt-2" data-testid="resource-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="playlist">Playlist</SelectItem>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        required
                        className="mt-2"
                        placeholder="e.g., Calculus"
                        data-testid="resource-topic-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      required
                      className="mt-2"
                      placeholder="https://..."
                      data-testid="resource-url-input"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-full bg-slate-900 hover:bg-slate-800" data-testid="resource-submit-btn">
                    Submit
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList>
            <TabsTrigger value="approved" data-testid="filter-approved">Approved</TabsTrigger>
            {user && <TabsTrigger value="pending" data-testid="filter-pending">Pending</TabsTrigger>}
          </TabsList>
        </Tabs>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white border border-slate-100 p-6 rounded-xl hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
              data-testid="resource-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-600" />
                </div>
                <span className="text-xs font-medium px-3 py-1 bg-orange-100 text-orange-600 rounded-full">
                  {resource.content_type}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-slate-900 mb-2">
                {resource.title}
              </h3>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {resource.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{resource.topic}</span>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                  data-testid="resource-view-link"
                >
                  View →
                </a>
              </div>
            </div>
          ))}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No resources found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceHub;