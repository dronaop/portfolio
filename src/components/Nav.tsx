export default function Nav() {
  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-5 sm:px-10">
      <span className="text-sm font-semibold tracking-wide text-white">
        DS
      </span>
      <nav className="flex items-center gap-6 text-xs uppercase tracking-widest text-white/60">
        <a href="#work" className="transition-colors hover:text-white">Work</a>
        <a href="#experience" className="transition-colors hover:text-white">Experience</a>
        <a href="#contact" className="transition-colors hover:text-white">Contact</a>
      </nav>
    </header>
  );
}
