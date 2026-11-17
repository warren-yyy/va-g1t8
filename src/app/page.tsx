import type { Metadata } from 'next';
import config from '@/site.config';
import DataMethodsSection from '@/components/DataMethodsSection';
import Hero from '@/components/Hero';
import PartSection from '@/components/PartSection';
import ProblemSection from '@/components/ProblemSection';

export const metadata: Metadata = {
  title: { absolute: `${config.site.mainQuestion} | ${config.site.name}` },
  description: config.site.scope,
};

/** The whole site is this one page. Each section's id is a nav anchor. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      {config.parts.map((part) => (
        <PartSection key={part.number} partNumber={part.number} />
      ))}
      <DataMethodsSection />
    </>
  );
}
