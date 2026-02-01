import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen pt-20 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <motion.div 
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-orange-500/20 border-2 border-orange-500 rounded-2xl flex items-center justify-center glow-on-hover">
              <Sparkles className="w-10 h-10 text-orange-400" />
            </div>
          </motion.div>
          <motion.h1 
            className="font-heading text-5xl md:text-7xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Curiofacts
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Fascinating facts and weekly updates from the world of mathematics
          </motion.p>
        </div>

        <div className="space-y-8">
          {facts.map((fact, index) => (
            <motion.article
              key={fact.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700 hover-lift card-hover"
              data-testid="curiofact-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {fact.image_url && (
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent z-10"></div>
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
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                  {fact.title}
                </h2>
                <div className="prose prose-slate max-w-none prose-invert">
                  <p className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {fact.content}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {facts.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-slate-700">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                More Facts Coming Soon!
              </h3>
              <p className="text-slate-400">
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