import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Gamepad2, ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Funamatics = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: [],
    math_domain: [],
    education_level: []
  });

  useEffect(() => {
    fetchGames();
    fetchFilterOptions();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchGames();
  }, [selectedFilters, searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(`${API}/filter-options`);
      setFilterOptions(res.data);
    } catch (err) {
      console.error('Failed to fetch filter options');
    }
  };

  const fetchGames = async () => {
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedFilters.difficulty?.length) params.append('difficulty', selectedFilters.difficulty.join(','));
      if (selectedFilters.math_domain?.length) params.append('math_domain', selectedFilters.math_domain.join(','));
      if (selectedFilters.education_level?.length) params.append('education_level', selectedFilters.education_level.join(','));
      
      const res = await axios.get(`${API}/games?${params.toString()}`);
      setGames(res.data);
    } catch (err) {
      toast.error('Failed to fetch games');
    }
  };

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

        {/* Search and Filters */}
        <motion.div 
          className="mb-10 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Search Bar */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search games by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="game-search-input"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Difficulty Filter */}
            {filterOptions.game_difficulty && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Difficulty</Label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.game_difficulty.map(opt => (
                    <Badge
                      key={opt.value}
                      className={`cursor-pointer text-xs ${
                        selectedFilters.difficulty?.includes(opt.value)
                          ? opt.value === 'easy' ? 'bg-green-500 text-white hover:bg-green-600'
                            : opt.value === 'medium' ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        const current = selectedFilters.difficulty || [];
                        setSelectedFilters({
                          ...selectedFilters,
                          difficulty: current.includes(opt.value)
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value]
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Math Domain Filter */}
            {filterOptions.math_domain && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Math Domain</Label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.math_domain.slice(0, 10).map(opt => (
                    <Badge
                      key={opt.value}
                      className={`cursor-pointer text-xs ${
                        selectedFilters.math_domain?.includes(opt.value)
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        const current = selectedFilters.math_domain || [];
                        setSelectedFilters({
                          ...selectedFilters,
                          math_domain: current.includes(opt.value)
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value]
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Education Level Filter */}
            {filterOptions.education_level && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Education Level</Label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.education_level.slice(0, 5).map(opt => (
                    <Badge
                      key={opt.value}
                      className={`cursor-pointer text-xs ${
                        selectedFilters.education_level?.includes(opt.value)
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => {
                        const current = selectedFilters.education_level || [];
                        setSelectedFilters({
                          ...selectedFilters,
                          education_level: current.includes(opt.value)
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value]
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(selectedFilters.difficulty?.length > 0 || selectedFilters.math_domain?.length > 0 || selectedFilters.education_level?.length > 0 || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFilters({ difficulty: [], math_domain: [], education_level: [] });
                  setSearchQuery('');
                }}
                className="text-orange-400 hover:text-orange-300 self-end"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        <TooltipProvider>
          {games.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {games.map((game, index) => (
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        game.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        game.difficulty === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {game.difficulty}
                      </span>
                      {game.math_domain && game.math_domain.map((d, i) => (
                        <span key={`domain-${i}`} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 capitalize">
                          {d.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {game.education_level && game.education_level.map((l, i) => (
                        <span key={`level-${i}`} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 capitalize">
                          {l.replace(/_/g, ' ')}
                        </span>
                      ))}
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
          ) : searchQuery || selectedFilters.difficulty?.length > 0 || selectedFilters.math_domain?.length > 0 ? (
            <div className="text-center py-20">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border-2 border-dashed border-slate-700 max-w-lg mx-auto">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                  No Games Found
                </h3>
                <p className="text-slate-400">
                  No games match your filters. Try adjusting your search criteria.
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
