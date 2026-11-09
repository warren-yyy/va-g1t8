import PartPage, { partMetadata } from '@/components/PartPage';

export const metadata = partMetadata(2);

export default function Page() {
  return <PartPage partNumber={2} />;
}
