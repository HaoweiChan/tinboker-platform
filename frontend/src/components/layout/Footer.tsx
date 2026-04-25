import React from 'react';
import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/logo/AppLogo';
import { Mail, MessageCircle, AtSign } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 mt-auto py-8 md:py-12">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <AppLogo size={32} />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            聽見市場聲音，看見財富趨勢
          </span>
        </div>

        {/* Contact Icons */}
        <div className="flex items-center gap-4 mb-8">
          <a 
            href="mailto:contact@tinboker.com"
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
            aria-label="Email"
          >
            <Mail size={18} />
          </a>
          <a 
            href="https://www.threads.net/@tinboker"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
            aria-label="Threads"
          >
            <AtSign size={18} />
          </a>
          <a 
            href="#"
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
            aria-label="Line"
          >
            <MessageCircle size={18} />
          </a>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 mb-8">
          <Link 
            to="/about" 
            className="text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-sm font-medium"
          >
            關於我們
          </Link>
          <Link 
            to="/disclaimer" 
            className="text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-sm font-medium"
          >
            免責聲明
          </Link>
        </div>

        {/* Divider */}
        <div className="w-full max-w-2xl h-px bg-slate-200 dark:bg-slate-800 mb-8"></div>

        {/* Copyright */}
        <div className="text-slate-500 dark:text-slate-600 text-xs">
          © {new Date().getFullYear()} TinBoker. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
