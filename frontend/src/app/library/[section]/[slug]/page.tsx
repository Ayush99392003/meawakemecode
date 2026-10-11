import { libraryPages } from '@/lib/data';
import { TopicDetailClient } from './topic-client';

export function generateStaticParams() {
  return libraryPages.map((p) => {
    const parts = p.slug.split('/');
    return {
      section: parts.length > 1 ? parts[0] : p.section,
      slug: parts.length > 1 ? parts[1] : p.slug,
    };
  });
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  return <TopicDetailClient section={section || ''} slug={slug || ''} />;
}
