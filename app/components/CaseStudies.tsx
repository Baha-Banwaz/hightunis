import Image from "next/image";
import Link from "next/link";
import { ContentTodo } from "./ContentTodo";

export interface CaseStudy {
  /** Short, specific. The project, not a slogan. */
  title: string;
  /** Who it was for. A real client name needs their written permission first. */
  client: string;
  /** Where, and when. e.g. "Sidi Bou Said, 2025" */
  context: string;
  /** What was asked for and what was actually done. Two or three sentences. */
  summary: string;
  /**
   * The measurable result, if and only if there is one you can evidence.
   * Leave it out rather than reaching for a number. A case study with no
   * figure is credible; one with an invented figure is a liability.
   */
  outcome?: string;
  /** A real photograph of the real project. Not stock, not AI. */
  image?: { src: string; alt: string };
  /** Optional link to a fuller write-up, e.g. a journal post. */
  href?: string;
}

/**
 * TODO_CONTENT_NEEDED
 *
 * Real projects only. No examples are written here, and none should be added
 * as filler: a fabricated case study naming a client is the single most
 * damaging thing this site could publish, and it is not undone by deleting it
 * later.
 *
 * For each entry you need, before it goes in:
 *   - the client's written permission to name them, or an anonymised
 *     description you are confident they would accept ("a coastal hotel group");
 *   - a photograph you own or are licensed to use, of the actual project;
 *   - evidence for any figure in `outcome`. If you cannot point at where the
 *     number came from, omit the field.
 *
 * Fill this array and the section renders. Leave it empty and nothing appears
 * on the live site.
 */
export const CASE_STUDIES: CaseStudy[] = [];

export function CaseStudies({
  items = CASE_STUDIES,
  heading = "Selected Work",
  intro,
}: {
  items?: CaseStudy[];
  heading?: string;
  intro?: string;
}) {
  if (items.length === 0) {
    return (
      <ContentTodo>
        Case studies section is built and wired up, waiting on real projects.
        Fill CASE_STUDIES in app/components/CaseStudies.tsx and this section
        appears. Deliberately left empty: no example projects have been written,
        because an invented client reference is not something a disclaimer
        fixes. Hidden on the live site until then.
      </ContentTodo>
    );
  }

  return (
    <section className="bg-white text-black py-24 md:py-32 border-t-2 border-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
          {heading}
        </h2>
        {intro && (
          <p className="text-lg md:text-2xl font-medium tracking-tight max-w-3xl mb-16 text-black/70">
            {intro}
          </p>
        )}

        <div className="flex flex-col border-t-2 border-black">
          {items.map((study) => {
            const body = (
              <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-12 md:py-16 items-start">
                <div className="lg:col-span-5">
                  {study.image ? (
                    <div className="relative w-full aspect-[4/3] bg-black/5">
                      <Image
                        src={study.image.src}
                        alt={study.image.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] border-2 border-black/10" />
                  )}
                </div>

                <div className="lg:col-span-7 flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-4">
                    {study.client} &middot; {study.context}
                  </p>
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                    {study.title}
                  </h3>
                  <p className="text-base md:text-xl font-medium leading-[1.6] text-black/80">
                    {study.summary}
                  </p>

                  {study.outcome && (
                    <p className="mt-8 border-l-4 border-black pl-6 text-base md:text-xl font-bold uppercase tracking-tight leading-[1.5]">
                      {study.outcome}
                    </p>
                  )}

                  {study.href && (
                    <span className="mt-8 self-start border-b-2 border-black pb-1 text-[10px] font-bold uppercase tracking-[3px] group-hover:opacity-50 transition-opacity">
                      Read the full story
                    </span>
                  )}
                </div>
              </article>
            );

            return (
              <div key={study.title} className="border-b-2 border-black">
                {study.href ? (
                  <Link href={study.href} className="group block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
