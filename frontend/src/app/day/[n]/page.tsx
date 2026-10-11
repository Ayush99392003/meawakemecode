import { TOTAL_DAYS } from '@/lib/data';
import { DayDetailClient } from './day-detail-client';

export function generateStaticParams() {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => ({
    n: String(i + 1),
  }));
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const dayNumber = Number(n) || 1;
  return <DayDetailClient dayNumber={dayNumber} />;
}
