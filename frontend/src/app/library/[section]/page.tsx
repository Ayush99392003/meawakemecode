import { SectionTopicsClient } from './section-client';

export function generateStaticParams() {
  return [
    { section: 'dsa' },
    { section: 'os' },
    { section: 'dbms' },
    { section: 'cn' },
    { section: 'oop' },
    { section: 'system_design' },
  ];
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <SectionTopicsClient sectionId={section || 'os'} />;
}
