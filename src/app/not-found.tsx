import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page does not exist.',
};

export default function NotFound() {
  return (
    <div className="part">
      <header className="part__head">
        <h1 className="part__title">Page not found</h1>
        <p className="part__intro">
          This page does not exist. <Link href="/">Go to the homepage</Link>.
        </p>
      </header>
    </div>
  );
}
