import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, Gamepad2, Sparkles, Network } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Resource Hub',
      description: 'Access curated notes, playlists, and resources on diverse mathematical topics.',
      link: '/resources'
    },
    {
      icon: Gamepad2,
      title: 'Funamatics',
      description: 'Learn mathematics through engaging games and interactive challenges.',
      link: '/funamatics'
    },
    {
      icon: Sparkles,
      title: 'Curiofacts',
      description: 'Discover fascinating facts and weekly updates from the world of mathematics.',
      link: '/curiofacts'
    },
    {
      icon: Network,
      title: 'Matrix',
      description: 'Join our growing community of mathematics enthusiasts and professionals.',
      link: '/matrix'
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 to-slate-100 noise-texture overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight leading-none text-slate-900 mb-6">
              Where Mathematics
              <span className="block text-orange-500">Minds Connect</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-slate-600 mb-8">
              Join Mentis, the premier platform for mathematics enthusiasts. Learn, share, and grow with a community that speaks your language.
            </p>
            <div className="flex gap-4">
              <Link to="/signup">
                <Button size="lg" className="rounded-full h-12 px-8 bg-slate-900 hover:bg-slate-800" data-testid="hero-get-started-btn">
                  Get Started
                </Button>
              </Link>
              <Link to="/matrix">
                <Button size="lg" variant="outline" className="rounded-full h-12 px-8" data-testid="hero-join-community-btn">
                  Join Community
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85"
              alt="Abstract mathematics geometry"
              className="rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Four powerful sections designed to enhance your mathematical journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={feature.link}>
                    <div className="bg-white border border-slate-100 p-8 rounded-xl hover:-translate-y-1 transition-all duration-300 hover:shadow-lg group">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                        <Icon className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-heading text-2xl md:text-3xl font-medium text-slate-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-base leading-relaxed text-slate-600">
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

      <section className="py-20 md:py-32 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6">
            Ready to Begin?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of mathematics enthusiasts already learning and growing together
          </p>
          <Link to="/signup">
            <Button size="lg" className="rounded-full h-12 px-8 bg-orange-500 hover:bg-orange-600" data-testid="cta-signup-btn">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;