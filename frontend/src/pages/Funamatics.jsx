import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Gamepad2, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Funamatics = () => {
  const [games, setGames] = useState([]);

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

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-orange-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-slate-900 mb-6">
            Funamatics
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Learn mathematics through engaging games and interactive challenges. Make learning fun!
          </p>
        </div>

        {games.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <div
                key={game.id}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white hover:shadow-2xl transition-all duration-300"
                data-testid="game-card"
              >
                {game.thumbnail && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full uppercase tracking-wider">
                      {game.difficulty}
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mb-3">
                    {game.title}
                  </h3>
                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {game.description}
                  </p>
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" data-testid="game-play-btn">
                      Play Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-slate-200 max-w-lg mx-auto">
              <Gamepad2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-semibold text-slate-900 mb-2">
                Games Coming Soon!
              </h3>
              <p className="text-slate-600">
                We're preparing exciting mathematical games for you. Check back soon!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Funamatics;