import { ContentTodo } from "./ContentTodo";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * TODO_CONTENT_NEEDED
 *
 * Five questions, written by the owner, and their answers. Not invented here:
 * the whole value of an FAQ is that it answers what people actually ask, and
 * only the person reading the inbox knows that.
 *
 * Fill this array and the section renders. Leave it empty and the section does
 * not appear on the live site at all - an empty FAQ heading is worse than no
 * FAQ. Plain strings, one or two sentences each; the answer is rendered as
 * text, not HTML.
 *
 * Worth considering, based on what the enquiry form already asks for: how
 * booking and payment actually work, how far ahead to book, what the concierge
 * arranges beyond the stay, whether staff or transfers are included, and what
 * happens if plans change.
 *
 * Once these are real, they are also the natural source for FAQPage
 * structured data in lib/structured-data.tsx. Do not add that schema before
 * the questions are real and visible on the page: marking up questions that
 * are not shown to visitors is exactly what search engines penalise.
 */
export const FAQ_ITEMS: FaqItem[] = [];

export function Faq({
  items = FAQ_ITEMS,
  heading = "Questions",
}: {
  items?: FaqItem[];
  heading?: string;
}) {
  if (items.length === 0) {
    return (
      <ContentTodo>
        FAQ section is built and wired up, waiting on five questions and answers.
        Fill FAQ_ITEMS in app/components/Faq.tsx and this section appears. It is
        hidden on the live site until then.
      </ContentTodo>
    );
  }

  return (
    <section className="bg-white text-black py-24 md:py-32 border-t-2 border-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-16">
          {heading}
        </h2>

        {/*
          <details>/<summary> rather than a JS accordion: it opens with Enter
          and Space, it is announced correctly, it works with JavaScript off,
          and it is findable by the browser's own in-page search even while
          collapsed.
        */}
        <div className="border-t-2 border-black">
          {items.map((item) => (
            <details key={item.question} className="group border-b-2 border-black">
              <summary className="flex items-start justify-between gap-8 cursor-pointer list-none py-8 [&::-webkit-details-marker]:hidden">
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-tight">
                  {item.question}
                </h3>
                {/*
                  A plus that becomes a minus. Drawn with borders, not an icon
                  font and not an emoji, and hidden from screen readers because
                  <details> already announces its own open state.
                */}
                <span
                  aria-hidden="true"
                  className="relative mt-2 w-5 h-5 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-black after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-black after:transition-opacity group-open:after:opacity-0"
                />
              </summary>
              <div className="pb-10 pr-8 md:pr-24 text-base md:text-xl font-medium leading-[1.6] text-black/80">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
