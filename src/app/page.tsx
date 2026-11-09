import type { Metadata } from 'next';
import config from '@/site.config';
import ClusterMap from '@/components/ClusterMap';
import Hero from '@/components/Hero';
import PartCards from '@/components/PartCards';
import StatTiles from '@/components/StatTiles';

export const metadata: Metadata = {
  title: { absolute: `${config.site.mainQuestion} | ${config.site.name}` },
  description: config.site.scope,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatTiles />
      <PartCards />
      <ClusterMap />
    </>
  );
}
