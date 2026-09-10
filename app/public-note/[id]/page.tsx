import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicNoteDetailById } from '@/services/public-note';
import type { PublicNoteDetail } from '@/types/public-note';
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  buildPublicNoteUrl,
  getSiteUrl,
  isProductionEnv,
} from '@/lib/site';
import PublicNoteContent from './public-note-content';

interface PublicNotePageProps {
  params: Promise<{ id: string }>;
}

function buildArticleJsonLd(detail: PublicNoteDetail) {
  const url = buildPublicNoteUrl(detail.id);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: detail.title,
    description: detail.summary,
    ...(url ? { mainEntityOfPage: url, url } : {}),
    ...(detail.authorName
      ? { author: { '@type': 'Person', name: detail.authorName } }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      ...(getSiteUrl() ? { url: getSiteUrl() } : {}),
    },
  };
}

export async function generateMetadata({ params }: PublicNotePageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getPublicNoteDetailById(id);

  if (!detail) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const url = buildPublicNoteUrl(detail.id);
  const canIndex = isProductionEnv();

  return {
    title: {
      default: detail.title || SITE_NAME,
      template: SITE_TITLE_TEMPLATE,
    },
    description: detail.summary || SITE_DEFAULT_DESCRIPTION,
    alternates: url ? { canonical: url } : undefined,
    robots: canIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: 'article',
      title: detail.title || SITE_NAME,
      description: detail.summary || SITE_DEFAULT_DESCRIPTION,
      ...(url ? { url } : {}),
    },
    twitter: {
      card: 'summary',
      title: detail.title || SITE_NAME,
      description: detail.summary || SITE_DEFAULT_DESCRIPTION,
    },
  };
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const { id } = await params;
  const detail = await getPublicNoteDetailById(id);

  if (!detail) {
    notFound();
  }

  const articleJsonLd = buildArticleJsonLd(detail);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <PublicNoteContent id={id} initialDetail={detail} />
    </>
  );
}