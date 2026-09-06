export default function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 px-6 py-16 sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-semibold text-white">Let&apos;s talk.</h2>
          <p className="mt-2 max-w-sm text-white/60">
            Open to AI/ML roles and interesting collaborations.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/60">
          <a href="mailto:deepanshu.drona@gmail.com" className="hover:text-white">
            deepanshu.drona@gmail.com
          </a>
          <a href="https://github.com/dronaop" target="_blank" rel="noreferrer" className="hover:text-white">
            github.com/dronaop
          </a>
          <a href="https://linkedin.com/in/deepanshu-drona" target="_blank" rel="noreferrer" className="hover:text-white">
            linkedin.com/in/deepanshu-drona
          </a>
        </div>
      </div>
    </footer>
  );
}
