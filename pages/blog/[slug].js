import Link from "next/link";
import Image from "next/image";
import { Calendar03Icon, Clock01Icon, UserIcon } from "@hugeicons/core-free-icons";
import SEOMeta from "../../components/SEOMeta";
import AdSlot from "../../components/AdSlot";
import { buildArticleSchema } from "../../lib/seo";
import { getAllArticles, getArticleBySlug, getRelatedArticles } from "../../lib/blog";
import AppIcon from "../../components/AppIcon";

function ArticleSection({ section, index }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-2xl font-bold">{index + 1}. {section.heading}</h2>
      {section.paragraphs.map((paragraph, pIndex) => (
        <p key={pIndex} className="mb-4 text-base leading-8 text-neutral-300">
          {paragraph}
        </p>
      ))}
    </section>
  );
}

export default function BlogArticlePage({ article, relatedArticles }) {
  return (
    <main className="min-h-screen bg-black px-4 pb-20 pt-28 text-white md:px-8">
      <SEOMeta
        title={article.title}
        description={article.description}
        url={`/blog/${article.slug}`}
        image={article.featuredImage}
        type="article"
        keywords={article.tags}
        jsonLd={buildArticleSchema(article)}
      />

      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_320px]">
        <article className="max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-red-400">{article.category}</p>
          <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">{article.title}</h1>
          <p className="mb-6 text-lg leading-8 text-neutral-300">{article.description}</p>

          <div className="mb-8 flex flex-wrap gap-4 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1"><AppIcon icon={Calendar03Icon} size={15} />{new Date(article.publishedAt).toLocaleDateString()}</span>
            <span className="inline-flex items-center gap-1"><AppIcon icon={Clock01Icon} size={15} />{article.readTime}</span>
            <span className="inline-flex items-center gap-1"><AppIcon icon={UserIcon} size={15} />{article.author.name}</span>
          </div>

          <div className="relative mb-8 h-[320px] overflow-hidden rounded-3xl border border-white/10 md:h-[430px]">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 800px"
            />
          </div>

          <AdSlot slot="2020202020" className="mb-10" label="Sponsored" />

          {article.sections.map((section, index) => (
            <div key={section.heading}>
              <ArticleSection section={section} index={index} />
              {(index + 1) % 2 === 0 && index !== article.sections.length - 1 ? (
                <AdSlot slot="3030303030" className="mb-10" label="Sponsored" />
              ) : null}
            </div>
          ))}

          <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-3 text-xl font-semibold">Author</h3>
            <p className="mb-1 text-sm font-medium">{article.author.name}</p>
            <p className="text-sm leading-7 text-neutral-400">{article.author.bio}</p>
          </section>

          <section className="mt-12">
            <h3 className="mb-4 text-2xl font-bold">Related reading</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20">
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-red-400">{related.category}</p>
                  <h4 className="mb-2 text-base font-semibold">{related.title}</h4>
                  <p className="text-sm leading-6 text-neutral-400">{related.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <AdSlot slot="4040404040" label="Sponsored" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-3 text-lg font-semibold">More from Rushes</h3>
            <div className="space-y-3">
              <Link href="/movies" className="block text-sm text-neutral-300 transition hover:text-white">Browse top movies</Link>
              <Link href="/series" className="block text-sm text-neutral-300 transition hover:text-white">Browse top series</Link>
              <Link href="/search" className="block text-sm text-neutral-300 transition hover:text-white">Search titles and providers</Link>
              <Link href="/profile" className="block text-sm text-neutral-300 transition hover:text-white">Update recommendations</Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export async function getStaticPaths() {
  const paths = getAllArticles().map((article) => ({ params: { slug: article.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return { notFound: true };
  const relatedArticles = getRelatedArticles(article, 4);

  return {
    props: {
      article,
      relatedArticles,
    },
  };
}
