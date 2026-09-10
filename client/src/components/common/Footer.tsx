import React from 'react';
import { Code2, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from './PageContainer';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-border bg-surface-300 mt-20" role="contentinfo">
      <PageContainer className="py-12">
        <nav aria-label="Footer navigation">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Column 1: Brand & Mission */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center text-white font-bold">
                  <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-white">DevConnect</span>
              </div>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                Connect with developers, showcase your work, and share technical knowledge across the global engineering community.
              </p>
              <div className="flex items-center gap-3 text-slate-400 pt-1">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors focus:outline-none focus-visible:text-white"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors focus:outline-none focus-visible:text-white"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors focus:outline-none focus-visible:text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Column 2: Explore */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3.5">
                Explore
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    to="/discover"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Discover
                  </Link>
                </li>
                <li>
                  <Link
                    to="/developers"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Developers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/projects"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Projects
                  </Link>
                </li>
                <li>
                  <Link
                    to="/publications"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Publications
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3.5">
                Platform
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    to="/network"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Network
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blogs/new"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Write Publication
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Developer Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings"
                    className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:text-brand-300"
                  >
                    Account Settings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: System Status */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3.5">
                System Status
              </h4>
              <div className="p-3.5 rounded-lg border border-surface-border bg-surface-200/70 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-slate-200">All systems operational</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  DevConnect API, Database & Authentication operational.
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom Footer Bar */}
        <div className="mt-10 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <p>© {new Date().getFullYear()} DevConnect. Built for developers.</p>
          <div className="flex items-center gap-3">
            <span>TypeScript + React</span>
            <span aria-hidden="true">•</span>
            <span>PostgreSQL + Prisma</span>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};
