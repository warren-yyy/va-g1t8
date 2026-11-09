import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data & Methods',
  description: 'Datasets, cleaning, how each headline number was computed, and the limitations.',
};

export default function DataMethodsPage() {
  return (
    <div className="part">
      <header className="part__head">
        <h1 className="part__title">Data &amp; Methods</h1>
      </header>
    </div>
  );
}
