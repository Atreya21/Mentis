import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Gamepad2, Sparkles, Network, Users, Video, Info, Smartphone, Download, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DownloadAppModal from '@/components/DownloadAppModal';
import { useIsApp } from '@/utils/appDetector';
import axios from 'axios';
import { AuthContext } from '@/App';
import MathCanvas3D from '@/components/3d/MathCanvas3D';
import Card3D from '@/components/3d/Card3D';
import MathGeometryStudio from '@/components/3d/MathGeometryStudio';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const isApp = useIsApp();
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
    <div className="min-h-screen pt-16 sm:pt-20 bg-slate-950 overflow-hidden">
      {/* 3D Interactive Hero Section */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 noise-texture overflow-hidden">
        {/* Live Interactive 3D Math Geometry Canvas */}
        <MathCanvas3D className="opacity-75 z-0" interactive={true} />

        {/* Ambient Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 sm:w-96 h-72 sm:h-96 bg-orange-500/15 rounded-full blur-3xl animate-orb-1" />
          <div className="absolute -bottom-32 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-pink-500/15 rounded-full blur-3xl animate-orb-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px]" />
          <div className="absolute inset-0 math-grid-pattern opacity-40" />
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Holographic Header Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-medium backdrop-blur-md shadow-lg shadow-orange-500/10 mb-4 sm:mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span>Mentis Mathematics Foundation</span>
              <span className="hidden sm:inline text-slate-500">•</span>
              <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">Where Minds Meet Mathematics</span>
            </motion.div>

            <motion.h1 
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.12] text-white mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Where Curious Minds Meet
              <span className="block text-gradient mt-2 font-extrabold">Mathematical Wonder</span>
            </motion.h1>

            <motion.p 
              className="text-base sm:text-lg md:text-xl leading-relaxed text-slate-300 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
            >
              Explore curated libraries, interactive game labs, live community forums, and creative mathematical media — crafted to illuminate the elegance of numbers.
            </motion.p>

            {!user && (
              <motion.div
                className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 sm:p-4 my-5 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45 }}
              >
                <p className="text-orange-400 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                  Sign up to unlock the full Resource Hub, Funamatics, VEX, and Mathmate live chat!
                </p>
              </motion.div>
            )}

            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-7 sm:px-9 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect glow-on-hover text-sm sm:text-base font-semibold shadow-lg shadow-orange-500/25 transition-all hover:scale-105" data-testid="hero-get-started-btn">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/matrix" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-6 sm:px-8 border-slate-700 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800 hover:border-orange-500 transition-all hover:scale-105 text-sm sm:text-base" data-testid="hero-join-community-btn">
                  Join Community
                </Button>
              </Link>
              {!isApp && (
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
              )}
            </motion.div>
          </motion.div>

          {/* Right Column: Interactive 3D Math Geometry Studio & Default Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-6 md:mt-0 w-full"
          >
            <MathGeometryStudio heroImage={heroImage} />
          </motion.div>
        </div>
      </section>

      {/* "Everything You Need" Feature Section with 3D Tilt Cards */}
      <section className="py-16 sm:py-24 md:py-32 bg-slate-900/90 relative overflow-hidden">
        <div className="absolute inset-0 math-grid-pattern opacity-30 pointer-events-none" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="text-center mb-10 sm:mb-14 md:mb-18">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono uppercase tracking-wider mb-3">
              Explore Our Ecosystem
            </div>
            <motion.h2 
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3 sm:mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Seven Mathematical Realms
            </motion.h2>
            <motion.p 
              className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Engineered from first principles to turn complex mathematical concepts into intuition and mastery
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className={index === 6 ? 'sm:col-span-2 lg:col-span-1 lg:col-start-2' : ''}
                >
                  <Link to={feature.link} className="block h-full group">
                    <Card3D
                      tiltMax={12}
                      depth={28}
                      borderColor={`from-slate-700/60 via-slate-600/40 to-slate-700/60 group-hover:from-orange-500/60 group-hover:via-pink-500/60 group-hover:to-cyan-500/60`}
                      className="h-full"
                    >
                      <div className="p-6 sm:p-7 md:p-8 flex flex-col justify-between h-full min-h-[220px]">
                        <div>
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                          <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-sm sm:text-base leading-relaxed text-slate-400">
                            {feature.description}
                          </p>
                        </div>
                        <div className="pt-4 flex items-center text-xs font-semibold text-orange-400 group-hover:text-pink-400 transition-colors">
                          <span>Enter {feature.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </div>
                    </Card3D>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophical Mathematical Manifesto Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden border-y border-slate-800/80">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
            Universal Architecture
          </div>
          <blockquote className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-relaxed tracking-tight">
            &ldquo;Mathematics is not just a collection of formulas; it is the universal poetry of reason and the architecture of the cosmos.&rdquo;
          </blockquote>
          <p className="mt-4 text-xs sm:text-sm text-slate-400 font-mono">
            — Mentis Mathematics Foundation Mission Principle
          </p>
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
      {!isApp && (
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
      )}

      {/* Download App Modal */}
      {!isApp && (
        <DownloadAppModal 
          isOpen={showDownloadModal} 
          onClose={() => setShowDownloadModal(false)} 
        />
      )}
    </div>
  );
};

export default LandingPage;