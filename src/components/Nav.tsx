"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Work", href: "#work" },
  { name: "Skills", href: "#skills" },
  { name: "Experience", href: "#experience" },
  { name: "Contact", href: "#contact" },
];

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-transparent px-6 py-6 sm:px-10">
      <Link
        href="/"
        className="text-xs font-semibold tracking-widest text-white/80 transition-colors hover:text-white uppercase"
      >
        DS
      </Link>

      <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-widest text-white/50">
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="transition-colors hover:text-white"
          >
            {link.name}
          </a>
        ))}
      </nav>

      <button
        type="button"
        aria-label="Toggle menu"
        className="md:hidden text-white/60 hover:text-white transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileMenuOpen && (
        <div className="absolute left-0 top-full flex w-full flex-col bg-[#05060a]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="py-3 text-xs uppercase tracking-widest text-white/60 hover:text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
