import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Gamepad2, Sparkles, Network, Users, Video, Info, Smartphone, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DownloadAppModal from '@/components/DownloadAppModal';
import axios from 'axios';
import { AuthContext } from '@/App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const [heroImage, setHeroImage] = React.useState('https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85');
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  React.useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const res = await axios.get(`${API}/site-settings`);
        setHeroImage(res.data.hero_image_url);
      } catch (err) {
        console.error('Failed to fetch site settings');
      }
    };
    fetchSiteSettings();
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Resource Hub',
      description: 'Access curated notes, playlists, and resources on diverse mathematical topics.',
      link: '/resources',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Gamepad2,
      title: 'Funamatics',
      description: 'Learn mathematics through engaging games and interactive challenges.',
      link: '/funamatics',
      color: 'from-orange-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'Curiofacts',
      description: 'Discover fascinating facts and weekly updates from the world of mathematics.',
      link: '/curiofacts',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Network,
      title: 'Matrix',
      description: 'Join our growing community of mathematics enthusiasts and professionals.',
      link: '/matrix',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Mathmate',
      description: 'Connect with fellow math enthusiasts, find study partners, and chat in real-time.',
      link: '/connect',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Video,
      title: 'VEX',
      description: 'Watch and share short educational videos on mathematical concepts.',
      link: '/reels',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: Info,
      title: 'About Us',
      description: 'Learn about our mission, vision, and the team behind Mentis.',
      link: '/about',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  return (
    <div className="min-h-screen pt-16 sm:pt-20 bg-slate-950">
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 noise-texture overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-white mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Welcome to
              <span className="block text-gradient mt-2">Mentis Mathematics Foundation</span>
            </motion.h1>
            <motion.p 
              className="text-base sm:text-lg md:text-xl leading-relaxed text-slate-300 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Join Mentis, the premier platform for mathematics enthusiasts. Learn, share, and grow with a community that speaks your language.
            </motion.p>
            <motion.p 
              className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-400 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Be a part of the world where minds meet mathematics.
            </motion.p>
            {!user && (
              <motion.div
                className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.55 }}
              >
                <p className="text-orange-400 text-xs sm:text-sm font-medium">
                  Sign up to unlock all features including Resource Hub, Funamatics, VEX, and Mathmate!
                </p>
              </motion.div>
            )}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect glow-on-hover text-sm sm:text-base" data-testid="hero-get-started-btn">
                  Get Started
                </Button>
              </Link>
              <Link to="/matrix" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-6 sm:px-8 border-slate-700 hover:bg-slate-800 hover:border-orange-500 transition-all hover:scale-105 text-sm sm:text-base" data-testid="hero-join-community-btn">
                  Join Community
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => setShowDownloadModal(true)}
                className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-6 sm:px-8 border-orange-500/50 bg-slate-900/80 hover:bg-orange-500/10 hover:border-orange-400 text-white font-medium transition-all hover:scale-105 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 group" 
                data-testid="hero-download-app-btn"
              >
                <Smartphone className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                <span>Download App</span>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative animate-float hidden md:block"
          >
            <div className="gradient-border glow-on-hover">
              <div className="gradient-border-inner p-2">
                <img
                  src={heroImage}
                  alt="Mentis Hero"
                  className="rounded-2xl w-full h-auto"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85';
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-20 md:py-32 bg-slate-900">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <motion.h2 
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3 sm:mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Everything You Need
            </motion.h2>
            <motion.p 
              className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Seven powerful sections designed to enhance your mathematical journey
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className={index === 6 ? 'sm:col-span-2 lg:col-span-1 lg:col-start-2' : ''}
                >
                  <Link to={feature.link}>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl hover-lift card-hover shine-effect group relative overflow-hidden h-full">
                      <div className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br ${feature.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform relative z-10`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <h3 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium text-white mb-2 sm:mb-3 relative z-10">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed text-slate-400 relative z-10">
                        {feature.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ready to Begin Section - Only show for non-logged-in users */}
      {!user && (
      <section className="py-12 sm:py-20 md:py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10">
          <motion.h2 
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Begin?
          </motion.h2>
          <motion.p 
            className="text-sm sm:text-base lg:text-lg text-slate-400 mb-6 sm:mb-8 px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Join thousands of mathematics enthusiasts already learning and growing together
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link to="/signup">
              <Button size="lg" className="rounded-full h-12 sm:h-14 px-6 sm:px-10 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect glow-on-hover text-sm sm:text-base" data-testid="cta-signup-btn">
                Create Your Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      )}

      {/* Mobile App Download Showcase Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="bg-gradient-to-r from-slate-900/90 via-slate-850/90 to-slate-900/90 border border-slate-700/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-medium">
                  <Smartphone className="w-4 h-4" />
                  <span>Now Available on Mobile</span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  Take Mentis Wherever You Go
                </h2>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  Download the official Mentis Mobile App. Study mathematics, challenge your friends on Funamatics, watch VEX shorts, and chat in real-time on Mathmate right from your phone.
                </p>

                {/* Features List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 flex-shrink-0 mt-0.5">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Live Cloud Sync</h4>
                      <p className="text-xs text-slate-400">All website updates and new features sync to the app automatically.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Native Notifications</h4>
                      <p className="text-xs text-slate-400">Get instant pop-up alerts on your device even when the app is closed.</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    size="lg"
                    onClick={() => setShowDownloadModal(true)}
                    className="rounded-full h-12 sm:h-14 px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 group"
                    data-testid="showcase-download-apk-btn"
                  >
                    <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Download Mentis.apk</span>
                  </Button>

                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => setShowDownloadModal(true)}
                    className="rounded-full h-12 sm:h-14 px-8 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <span>Install on iOS / Web</span>
                  </Button>
                </div>
              </div>

              {/* Phone Preview Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-64 sm:w-72 rounded-[38px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl glow-on-hover">
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-20" />
                  <div className="rounded-[28px] overflow-hidden bg-slate-900 border border-slate-800 p-4 space-y-4">
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <img src="/app-logo.png" alt="Mentis Logo" className="w-7 h-7 rounded-lg object-cover shadow-sm border border-slate-700/60" />
                        <span className="font-heading font-bold text-white text-sm">Mentis</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Mathmate Live</div>
                      <div className="text-xs text-white font-medium mt-1">Real-time chat & discussion</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">"Push notifications active on this device."</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40 text-center">
                        <div className="text-[10px] text-cyan-400 font-medium">Resources</div>
                        <div className="text-xs text-white font-semibold">100+ Topics</div>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/40 text-center">
                        <div className="text-[10px] text-pink-400 font-medium">Funamatics</div>
                        <div className="text-xs text-white font-semibold">Play & Learn</div>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <span className="text-[10px] text-slate-500">Live Webview Shell • Auto-Updated</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Download App Modal */}
      <DownloadAppModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </div>
  );
};

export default LandingPage;