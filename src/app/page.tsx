import Nav from "@/components/Nav";
import SpaceScene from "@/components/SpaceScene";
import LaptopShowcase from "@/components/LaptopShowcase";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";
import { ChapterLabel } from "@/components/ui/chapter-label";
import { projects } from "@/lib/data";

export default function Page() {
  return (
    <>
      <Nav />
      <SpaceScene />

      <section id="work">
        <header className="px-6 pt-24 text-center sm:px-10">
          <ChapterLabel id="production" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Selected work
          </h2>
        </header>

        {projects.map((project, i) => (
          <LaptopShowcase key={project.slug} project={project} reverse={i % 2 === 1} index={i} />
        ))}
      </section>

      <Experience />
      <Footer />
    </>
  );
}
