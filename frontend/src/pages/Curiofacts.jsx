import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Curiofacts = () => {
  const [facts, setFacts] = useState([]);

  useEffect(() => {
    fetchFacts();
  }, []);

  const fetchFacts = async () => {
    try {
      const res = await axios.get(`${API}/curiofacts`);
      setFacts(res.data);
    } catch (err) {
      toast.error('Failed to fetch curiofacts');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-slate-900 mb-6">
            Curiofacts
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Fascinating facts and weekly updates from the world of mathematics
          </p>
        </div>

        <div className="space-y-8">
          {facts.map((fact, index) => (
            <article
              key={fact.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow duration-300"
              data-testid="curiofact-card"
            >
              {fact.image_url && (
                <div className="h-64 overflow-hidden">
                  <img
                    src={fact.image_url}
                    alt={fact.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <time>{format(new Date(fact.published_at), 'MMMM d, yyyy')}</time>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {fact.title}
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {fact.content}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {facts.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-slate-200">
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-slate-900 mb-2">
                More Facts Coming Soon!
              </h3>
              <p className="text-slate-600">
                We're curating fascinating mathematical facts for you. Check back weekly!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Curiofacts;