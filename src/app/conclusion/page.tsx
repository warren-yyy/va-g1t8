import PartPage, { partMetadata } from '@/components/PartPage';

export const metadata = partMetadata(5);

export default function Page() {
  return <PartPage partNumber={5} />;
}
