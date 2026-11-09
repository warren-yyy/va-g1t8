import PartPage, { partMetadata } from '@/components/PartPage';

export const metadata = partMetadata(3);

export default function Page() {
  return <PartPage partNumber={3} />;
}
