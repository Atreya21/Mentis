import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, Gamepad2, Sparkles, Network } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const [heroImage, setHeroImage] = React.useState('https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85');

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
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-slate-950">
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 noise-texture overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="font-heading text-5xl md:text-7xl font-bold tracking-tight leading-none text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Mathematics is the
              <span className="block text-gradient mt-2">Language of Logic</span>
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl leading-relaxed text-slate-300 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Join Mentis, the premier platform for mathematics enthusiasts. Learn, share, and grow with a community that speaks your language.
            </motion.p>
            <motion.p 
              className="text-base md:text-lg leading-relaxed text-slate-400 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Be a part of the world where minds meet mathematics.
            </motion.p>
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to="/signup">
                <Button size="lg" className="rounded-full h-14 px-10 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect glow-on-hover" data-testid="hero-get-started-btn">
                  Get Started
                </Button>
              </Link>
              <Link to="/matrix">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-10 border-slate-700 hover:bg-slate-800 hover:border-orange-500 transition-all hover:scale-105" data-testid="hero-join-community-btn">
                  Join Community
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative animate-float"
          >
            <div className="gradient-border glow-on-hover">
              <div className="gradient-border-inner p-2">
                <img
                  src={heroImage}
                  alt="Mentis Hero"
                  className="rounded-2xl"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85';
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <motion.h2 
              className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Everything You Need
            </motion.h2>
            <motion.p 
              className="text-lg text-slate-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Four powerful sections designed to enhance your mathematical journey
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
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
                >
                  <Link to={feature.link}>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover-lift card-hover shine-effect group relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                      <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-heading text-2xl md:text-3xl font-medium text-white mb-3 relative z-10">
                        {feature.title}
                      </h3>
                      <p className="text-base leading-relaxed text-slate-400 relative z-10">
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

      <section className="py-20 md:py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
          <motion.h2 
            className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Begin?
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-400 mb-8"
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
              <Button size="lg" className="rounded-full h-14 px-10 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shine-effect glow-on-hover" data-testid="cta-signup-btn">
                Create Your Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;