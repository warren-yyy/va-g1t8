import Link from 'next/link';
import config from '@/site.config';

export default function Footer() {
  const { site, team } = config;
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>
          {site.course}. {site.group}: {team.join(', ')}.
        </p>
        <p>
          Global figures are annual and end in 2024. <Link href="/data-methods">Data &amp; Methods</Link>
        </p>
      </div>
    </footer>
  );
}
