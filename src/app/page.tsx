import config from '@/site.config';

export default function HomePage() {
  return (
    <div className="part">
      <header className="part__head">
        <h1 className="part__title">{config.site.mainQuestion}</h1>
      </header>
    </div>
  );
}
