import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Info, Users, BookOpen, Play, ChevronRight, ChevronDown,
  Target, Heart, Lightbulb, GraduationCap, Sparkles,
  ArrowRight, Mail, Globe, Star, HelpCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AboutUs = () => {
  const [aboutContent, setAboutContent] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    fetchAboutContent();
    fetchTutorials();
    fetchFaqs();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const res = await axios.get(`${API}/about-us`);
      setAboutContent(res.data);
    } catch (err) {
      console.error('Failed to fetch about content');
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorials = async () => {
    try {
      const res = await axios.get(`${API}/tutorials`);
      setTutorials(res.data);
    } catch (err) {
      console.error('Failed to fetch tutorials');
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await axios.get(`${API}/faqs`);
      setFaqs(res.data);
    } catch (err) {
      console.error('Failed to fetch FAQs');
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    return url;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const floatingAnimation = {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-slate-950 flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-slate-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-40 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ 
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div 
        className="max-w-7xl mx-auto px-6 md:px-12 py-16 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Header */}
        <motion.div
          className="text-center mb-20"
          variants={itemVariants}
        >
          <motion.div 
            className="inline-block mb-8"
            animate={floatingAnimation}
          >
            {aboutContent?.logo_url ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl blur-xl opacity-50"></div>
                <img 
                  src={aboutContent.logo_url} 
                  alt="Mentis Logo" 
                  className="relative w-24 h-24 rounded-3xl object-cover shadow-2xl border-2 border-orange-500/30"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl blur-xl opacity-50"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.h1 
            className="font-heading text-5xl md:text-7xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            About{' '}
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Mentis
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {aboutContent?.tagline || 'Empowering the mathematics community through collaboration, creativity, and knowledge sharing'}
          </motion.p>

          {/* Decorative Line */}
          <motion.div 
            className="mt-10 flex justify-center items-center gap-2"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-orange-500/50"></div>
            <Star className="w-4 h-4 text-orange-400" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-pink-500/50"></div>
          </motion.div>
        </motion.div>

        {/* Our Community Section */}
        <motion.section className="mb-20" variants={itemVariants}>
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="p-3 bg-orange-500/10 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Users className="w-8 h-8 text-orange-400" />
            </motion.div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Our Community</h2>
          </div>
          
          <motion.div variants={cardVariants}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 md:p-10 relative">
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg md:text-xl text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aboutContent?.community_info || `Mentis is a vibrant community of mathematics enthusiasts, students, educators, and professionals who share a common passion for the beauty and power of mathematics.

Our community spans across institutions and organizations worldwide, united by our love for mathematical exploration and discovery. We believe that mathematics is not just a subject to be studied, but a language that connects us all.

Join us to connect with like-minded individuals, share resources, and grow together in your mathematical journey.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* Foundation Section - Vision, Mission, Values */}
        <motion.section className="mb-20" variants={itemVariants}>
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="p-3 bg-pink-500/10 rounded-xl"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Target className="w-8 h-8 text-pink-400" />
            </motion.div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Our Foundation</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Lightbulb,
                title: 'Our Vision',
                content: aboutContent?.vision || 'To create a world where mathematical knowledge is accessible to everyone and mathematical thinking is celebrated.',
                gradient: 'from-orange-500 to-amber-500',
                bgGradient: 'from-orange-500/10 to-amber-500/10'
              },
              {
                icon: Heart,
                title: 'Our Mission',
                content: aboutContent?.mission || 'To build a supportive platform where mathematics enthusiasts can learn, share, and grow together.',
                gradient: 'from-pink-500 to-rose-500',
                bgGradient: 'from-pink-500/10 to-rose-500/10'
              },
              {
                icon: GraduationCap,
                title: 'Our Values',
                content: aboutContent?.values || 'Collaboration, curiosity, inclusivity, and the pursuit of mathematical excellence.',
                gradient: 'from-purple-500 to-violet-500',
                bgGradient: 'from-purple-500/10 to-violet-500/10'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <Card className="bg-slate-800/50 border-slate-700/50 h-full overflow-hidden group hover:border-slate-600 transition-all duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <CardContent className="p-8 text-center relative">
                    <motion.div 
                      className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <item.icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-heading text-xl font-semibold text-white mb-4">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {aboutContent?.foundation_info && (
            <motion.div variants={cardVariants} className="mt-8">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-8">
                  <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aboutContent.foundation_info}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.section>

        {/* How to Use Section */}
        <motion.section className="mb-20" variants={itemVariants}>
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="p-3 bg-green-500/10 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BookOpen className="w-8 h-8 text-green-400" />
            </motion.div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">How to Use Mentis</h2>
          </div>
          
          <motion.div variants={cardVariants}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8 md:p-10">
                {aboutContent?.instructions ? (
                  <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aboutContent.instructions}
                  </p>
                ) : (
                  <div className="space-y-6">
                    {[
                      { step: 1, title: 'Create Your Account', desc: 'Sign up to access all features including Resource Hub, Funamatics, Reels, and Mathmate.', color: 'orange' },
                      { step: 2, title: 'Explore Resources', desc: 'Browse through curated notes, playlists, and educational content in the Resource Hub.', color: 'pink' },
                      { step: 3, title: 'Connect with Others', desc: 'Use Mathmate to find and connect with fellow mathematics enthusiasts.', color: 'purple' },
                      { step: 4, title: 'Contribute', desc: 'Share your own resources, reels, and curiofacts to help the community grow.', color: 'blue' },
                      { step: 5, title: 'Join the Matrix', desc: 'Register in the Matrix section to become an official community member and join our WhatsApp group.', color: 'green' }
                    ].map((item, index) => (
                      <motion.div 
                        key={item.step}
                        className="flex items-start gap-5 group"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        viewport={{ once: true }}
                      >
                        <motion.div 
                          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center shadow-lg font-bold text-white text-lg`}
                          whileHover={{ scale: 1.1, rotate: -5 }}
                        >
                          {item.step}
                        </motion.div>
                        <div className="pt-1">
                          <h4 className="text-white font-semibold text-lg mb-1 group-hover:text-orange-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-slate-400">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* Tutorial Videos Section */}
        <motion.section className="mb-20" variants={itemVariants}>
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="p-3 bg-red-500/10 rounded-xl"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Play className="w-8 h-8 text-red-400" />
            </motion.div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Tutorial Videos</h2>
          </div>
          
          {tutorials.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {tutorials.map((tutorial, index) => (
                <motion.div
                  key={tutorial.id}
                  variants={cardVariants}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="cursor-pointer"
                >
                  <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden group hover:border-orange-500/50 transition-all duration-300">
                    <div className="aspect-video bg-slate-900 relative overflow-hidden">
                      <iframe
                        src={getYouTubeEmbedUrl(tutorial.video_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={tutorial.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-heading text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
                        {tutorial.title}
                      </h3>
                      {tutorial.description && (
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {tutorial.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div variants={cardVariants}>
              <Card className="bg-slate-800/50 border-slate-700/50 border-dashed">
                <CardContent className="p-16 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                  </motion.div>
                  <p className="text-xl text-slate-400 font-medium">Tutorial videos coming soon!</p>
                  <p className="text-slate-500 mt-2">Stay tuned for helpful guides and walkthroughs.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.section>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <motion.section className="mb-20" variants={itemVariants}>
            <div className="flex items-center gap-4 mb-8">
              <motion.div 
                className="p-3 bg-amber-500/10 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <HelpCircle className="w-8 h-8 text-amber-400" />
              </motion.div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  variants={cardVariants}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    className={`bg-slate-800/50 border-slate-700/50 cursor-pointer transition-all duration-300 ${
                      expandedFaq === faq.id ? 'border-orange-500/50' : 'hover:border-slate-600'
                    }`}
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    data-testid={`faq-item-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-heading text-lg font-semibold text-white">
                          {faq.question}
                        </h3>
                        <motion.div
                          animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0"
                        >
                          <ChevronDown className="w-5 h-5 text-orange-400" />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {expandedFaq === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <p className="text-slate-400 mt-4 pt-4 border-t border-slate-700 whitespace-pre-wrap">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Contact Section */}
        <motion.section variants={itemVariants}>
          <Card className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border-orange-500/30 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              />
            </div>
            <CardContent className="p-10 md:p-12 text-center relative">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <h3 className="font-heading text-3xl font-bold text-white mb-4">
                Have Questions?
              </h3>
              <p className="text-slate-300 mb-6 text-lg">
                Feel free to reach out to us for any queries, suggestions, or support.
              </p>
              <motion.a 
                href="mailto:mentis.mathematics@gmail.com"
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-orange-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="w-5 h-5" />
                mentis.mathematics@gmail.com
                <ArrowRight className="w-5 h-5" />
              </motion.a>
            </CardContent>
          </Card>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default AboutUs;
