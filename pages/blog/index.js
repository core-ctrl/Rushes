import Link from "next/link";
import Image from "next/image";
import { Calendar03Icon, Clock01Icon, Tag01Icon } from "@hugeicons/core-free-icons";
import SEOMeta from "../../components/SEOMeta";
import AdSlot from "../../components/AdSlot";
import { getAllArticles } from "../../lib/blog";
import AppIcon from "../../components/AppIcon";

export default function BlogIndexPage({ articles }) {
  const [featured, ...rest] = articles;

  return (
    <main className="min-h-screen bg-black px-4 pb-20 pt-28 text-white md:px-8">
      <SEOMeta
        title="Blog: Streaming Guides, Recommendation Strategy, and Media UX"
        description="Read detailed guides on streaming decisions, movie discovery workflows, personalization, security, and performance for modern media products."
        url="/blog"
        keywords={["movie blog", "streaming guides", "recommendation strategy", "media ux", "adsense readiness"]}
      />

      <section className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-400">Editorial</p>
          <h1 className="text-3xl font-bold md:text-5xl">Rushes Blog</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-400">
            Deep practical guides for discovery quality, streaming choices, consent-safe analytics, and performance engineering.
          </p>
        </header>

        <AdSlot slot="1010101010" className="mb-10" label="Sponsored" />

        {featured ? (
          <article className="mb-12 grid gap-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] md:grid-cols-2">
            <div className="relative min-h-[280px]">
              <Image
                src={featured.featuredImage}
                alt={featured.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="p-6 md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">{featured.category}</p>
              <h2 className="mb-4 text-2xl font-bold leading-tight md:text-3xl">{featured.title}</h2>
              <p className="mb-6 text-sm leading-7 text-neutral-300">{featured.description}</p>
              <div className="mb-6 flex flex-wrap gap-4 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <AppIcon icon={Calendar03Icon} size={14} />
                  {new Date(featured.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                  <span className="inline-flex items-center gap-1">
                    <AppIcon icon={Clock01Icon} size={14} />
                    {featured.readTime}
                  </span>
              </div>
              <Link href={`/blog/${featured.slug}`} className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500">
                Read article
              </Link>
            </div>
          </article>
        ) : null}

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <article key={article.slug} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
              <Link href={`/blog/${article.slug}`} className="block">
                <div className="relative h-48">
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
              </Link>
              <div className="p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-400">{article.category}</p>
                <Link href={`/blog/${article.slug}`}>
                  <h3 className="mb-3 line-clamp-2 text-lg font-semibold transition hover:text-red-400">{article.title}</h3>
                </Link>
                <p className="mb-4 line-clamp-3 text-sm leading-6 text-neutral-400">{article.description}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {article.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-400">
                      <AppIcon icon={Tag01Icon} size={10} className="mr-1 inline-block" />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export async function getStaticProps() {
  const articles = getAllArticles();
  return { props: { articles } };
}
