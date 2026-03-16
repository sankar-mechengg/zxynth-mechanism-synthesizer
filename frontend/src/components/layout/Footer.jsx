import { Heart, Linkedin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] py-6 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex flex-col items-center gap-3">
          {/* Made with love */}
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>by</span>
            <span className="font-semibold text-[var(--color-text-primary)]">Sankar Balasubramanian</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/sankar4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-blueprint-400 transition-colors"
            >
              <Linkedin size={14} />
              <span>LinkedIn</span>
            </a>
            <span className="text-[var(--color-text-muted)] text-xs">·</span>
            <a
              href="https://sankar.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-blueprint-400 transition-colors"
            >
              <Globe size={14} />
              <span>sankar.studio</span>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-2xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Zxynth. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
