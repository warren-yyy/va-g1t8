import PartPage, { partMetadata } from '@/components/PartPage';

export const metadata = partMetadata(1);

export default function Page() {
  return <PartPage partNumber={1} />;
}
