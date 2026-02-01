import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Gamepad2, ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Funamatics = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get(`${API}/games`);
      setGames(res.data);
    } catch (err) {
      toast.error('Failed to fetch games');
    }
  };

  // Filter games based on search query
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    const query = searchQuery.toLowerCase();
    return games.filter(g => 
      g.title?.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query) ||
      g.difficulty?.toLowerCase().includes(query)
    );
  }, [games, searchQuery]);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <motion.div 
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center glow-on-hover">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.h1 
            className="font-heading text-5xl md:text-7xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Funamatics
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Learn mathematics through engaging games and interactive challenges. Make learning fun!
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          className="mb-10 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search games by name or difficulty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              data-testid="game-search-input"
            />
          </div>
        </motion.div>

        <TooltipProvider>
          {filteredGames.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-800/50 backdrop-blur-sm hover-lift card-hover"
                  data-testid="game-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {game.thumbnail && (
                    <div className="h-48 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent z-[1] pointer-events-none"></div>
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 relative z-[2]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        game.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        game.difficulty === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-white mb-3">
                      {game.title}
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-slate-400 mb-4 line-clamp-3 cursor-help">
                          {game.description}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm bg-slate-900 border-slate-700 text-slate-200 p-3">
                        <p className="text-sm">{game.description}</p>
                      </TooltipContent>
                    </Tooltip>
                    <a
                      href={game.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-[3] block"
                    >
                      <Button className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect" data-testid="game-play-btn">
                        Play Now
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-20">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-slate-700 max-w-lg mx-auto">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                  No Games Found
                </h3>
                <p className="text-slate-400">
                  No games match &quot;{searchQuery}&quot;. Try a different search term.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-slate-700 max-w-lg mx-auto">
                <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                  Games Coming Soon!
                </h3>
                <p className="text-slate-400">
                  We&apos;re preparing exciting mathematical games for you. Check back soon!
                </p>
              </div>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Funamatics;
