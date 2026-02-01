import React from 'react';
import { Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-slate-400 text-sm">
          <Mail className="w-4 h-4" />
          <p>
            For assistance related to any issue, kindly mail us at{' '}
            <a 
              href="mailto:mentis.mathematics@gmail.com" 
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              mentis.mathematics@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
