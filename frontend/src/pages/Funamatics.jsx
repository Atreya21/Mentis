import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Gamepad2, ExternalLink, Search, Sparkles, X, Play, Compass, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card3D from '@/components/3d/Card3D';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Funamatics = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedGame, setSelectedGame] = useState(null);
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
      console.error('Failed to fetch games');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Math Coordinates Grid */}
      <div className="absolute inset-0 math-grid-pattern opacity-30 pointer-events-none" />

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-96 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 relative z-10">
        {/* Header with Morphing Zoom Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-orange-500/30 text-orange-400 text-xs font-mono uppercase tracking-wider mb-4 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>Interactive Game Labs • Math Playground</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            <span className="text-white">Fun</span>
            <span className="text-gradient">amatics</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Discover mathematical beauty through hands-on gamified simulations, topological puzzles, and real-time interactive challenges.
          </p>
        </motion.div>

        {/* Search & Filter Controls with Morphing Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 space-y-6"
        >
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search mathematical games, simulations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-slate-900/80 border-slate-700/80 rounded-full text-white placeholder:text-slate-500 focus:border-orange-500/70 shadow-sm"
                data-testid="game-search-input"
              />
            </div>
          </div>

          {/* Morphing Filter Badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Difficulty Filter */}
            {filterOptions.game_difficulty && (
              <div className="space-y-1">
                <Label className="text-xs font-mono text-slate-400">Difficulty</Label>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.game_difficulty.map((opt) => {
                    const isSelected = selectedFilters.difficulty?.includes(opt.value);
                    return (
                      <motion.button
                        key={opt.value}
                        layout
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          const current = selectedFilters.difficulty || [];
                          setSelectedFilters({
                            ...selectedFilters,
                            difficulty: current.includes(opt.value)
                              ? current.filter((v) => v !== opt.value)
                              : [...current, opt.value]
                          });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? opt.value === 'easy'
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/30'
                              : opt.value === 'medium'
                              ? 'bg-orange-500 text-white border-orange-400 shadow-sm shadow-orange-500/30'
                              : 'bg-red-500 text-white border-red-400 shadow-sm shadow-red-500/30'
                            : 'bg-slate-900/70 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Math Domain Filter */}
            {filterOptions.math_domain && (
              <div className="space-y-1">
                <Label className="text-xs font-mono text-slate-400">Math Domain</Label>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.math_domain.slice(0, 10).map((opt) => {
                    const isSelected = selectedFilters.math_domain?.includes(opt.value);
                    return (
                      <motion.button
                        key={opt.value}
                        layout
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          const current = selectedFilters.math_domain || [];
                          setSelectedFilters({
                            ...selectedFilters,
                            math_domain: current.includes(opt.value)
                              ? current.filter((v) => v !== opt.value)
                              : [...current, opt.value]
                          });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-orange-400 shadow-sm shadow-orange-500/30 font-semibold'
                            : 'bg-slate-900/70 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Education Level Filter */}
            {filterOptions.education_level && (
              <div className="space-y-1">
                <Label className="text-xs font-mono text-slate-400">Level</Label>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.education_level.slice(0, 5).map((opt) => {
                    const isSelected = selectedFilters.education_level?.includes(opt.value);
                    return (
                      <motion.button
                        key={opt.value}
                        layout
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          const current = selectedFilters.education_level || [];
                          setSelectedFilters({
                            ...selectedFilters,
                            education_level: current.includes(opt.value)
                              ? current.filter((v) => v !== opt.value)
                              : [...current, opt.value]
                          });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-pink-500 text-white border-pink-400 shadow-sm shadow-pink-500/30 font-semibold'
                            : 'bg-slate-900/70 text-slate-300 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(selectedFilters.difficulty?.length > 0 ||
              selectedFilters.math_domain?.length > 0 ||
              selectedFilters.education_level?.length > 0 ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFilters({ difficulty: [], math_domain: [], education_level: [] });
                  setSearchQuery('');
                }}
                className="text-orange-400 hover:text-orange-300 self-end text-xs font-mono"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* Playcards Grid with Dynamic Morphing Zoom Interaction */}
        <TooltipProvider>
          {games.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.92, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                  onClick={() => setSelectedGame(game)}
                >
                  <Card3D
                    tiltMax={10}
                    depth={28}
                    borderColor="from-orange-500/40 via-pink-500/40 to-cyan-500/40"
                    className="h-full"
                    data-testid="game-card"
                  >
                    <div className="flex flex-col h-full rounded-2xl overflow-hidden group">
                      {game.thumbnail && (
                        <div className="h-48 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-[1] pointer-events-none" />
                          <img
                            src={game.thumbnail}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-semibold text-orange-400 flex items-center gap-1 shadow-md">
                            <Gamepad2 className="w-3 h-3" />
                            <span>LAB</span>
                          </div>
                        </div>
                      )}
                      <div className="p-6 flex flex-col justify-between flex-grow relative z-[2]">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                game.difficulty === 'easy'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : game.difficulty === 'medium'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {game.difficulty}
                            </span>
                            {game.math_domain &&
                              game.math_domain.map((d, i) => (
                                <span
                                  key={`domain-${i}`}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 capitalize"
                                >
                                  {d.replace(/_/g, ' ')}
                                </span>
                              ))}
                            {game.education_level &&
                              game.education_level.map((l, i) => (
                                <span
                                  key={`level-${i}`}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 capitalize"
                                >
                                  {l.replace(/_/g, ' ')}
                                </span>
                              ))}
                          </div>
                          <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                            {game.title}
                          </h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-slate-400 text-sm mb-4 line-clamp-3 cursor-help leading-relaxed">
                                {game.description}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm bg-slate-900 border-slate-700 text-slate-200 p-3">
                              <p className="text-sm">{game.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="pt-2">
                          <Button
                            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect shadow-md shadow-orange-500/20 font-semibold group/btn"
                            data-testid="game-play-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGame(game);
                            }}
                          >
                            <span>Launch Game Lab</span>
                            <Play className="w-3.5 h-3.5 ml-2 fill-current group-hover/btn:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          ) : searchQuery ||
            selectedFilters.difficulty?.length > 0 ||
            selectedFilters.math_domain?.length > 0 ? (
            <div className="text-center py-20">
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-12 border border-slate-800 max-w-lg mx-auto">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                  No Games Found
                </h3>
                <p className="text-slate-400">
                  No games match your active filters. Try adjusting your search query.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-12 border border-slate-800 max-w-lg mx-auto">
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

      {/* Interactive Quick Launch Modal with Morphing Zoom-In / Zoom-Out */}
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop with Smooth Blur Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGame(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl"
            />

            {/* Modal Dialog with Spring Morphing Zoom */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 my-8"
            >
              {/* Top Banner Image */}
              {selectedGame.thumbnail && (
                <div className="h-56 sm:h-64 w-full relative overflow-hidden">
                  <img
                    src={selectedGame.thumbnail}
                    alt={selectedGame.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all shadow-md active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold bg-slate-950/80 px-2.5 py-1 rounded-md border border-orange-500/30">
                      SYS//LAB-PREVIEW
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-2">
                      {selectedGame.title}
                    </h2>
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Badges Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={`uppercase text-xs font-bold ${
                      selectedGame.difficulty === 'easy'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedGame.difficulty === 'medium'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    Difficulty: {selectedGame.difficulty}
                  </Badge>

                  {selectedGame.math_domain &&
                    selectedGame.math_domain.map((d, i) => (
                      <Badge
                        key={`modal-domain-${i}`}
                        className="bg-orange-500/15 text-orange-300 border border-orange-500/30 capitalize text-xs"
                      >
                        {d.replace(/_/g, ' ')}
                      </Badge>
                    ))}

                  {selectedGame.education_level &&
                    selectedGame.education_level.map((l, i) => (
                      <Badge
                        key={`modal-level-${i}`}
                        className="bg-pink-500/15 text-pink-300 border border-pink-500/30 capitalize text-xs"
                      >
                        {l.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed">
                  {selectedGame.description}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedGame(null)}
                    className="w-full sm:w-auto rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Close Preview
                  </Button>

                  <a
                    href={selectedGame.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      size="lg"
                      className="w-full sm:w-auto rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-orange-500/25 px-8"
                    >
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      <span>Play in New Tab</span>
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Funamatics;
