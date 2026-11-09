import PartPage, { partMetadata } from '@/components/PartPage';

export const metadata = partMetadata(4);

export default function Page() {
  return <PartPage partNumber={4} />;
}
