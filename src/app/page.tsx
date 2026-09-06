import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import LaptopShowcase from "@/components/LaptopShowcase";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";
import { projects } from "@/lib/data";

export default function Page() {
  return (
    <>
      <Nav />
      <Hero />

      <section id="work">
        {projects.map((project, i) => (
          <LaptopShowcase key={project.slug} project={project} reverse={i % 2 === 1} />
        ))}
      </section>

      <Experience />
      <Footer />
    </>
  );
}
