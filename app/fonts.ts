import { Archivo_Black } from "next/font/google";

/**
 * The HIGHTUNIS wordmark face, used by the homepage hero and the footer.
 *
 * Both used to ask for 'Arial Black', Impact. That only works where the
 * visitor's device happens to have one of those installed: Mac and Windows
 * do, Android and Linux do not, so there the wordmark fell back to a thin
 * default sans and looked like a different brand. Archivo Black is the
 * closest freely licensed match to Arial Black, and next/font self-hosts it,
 * so every device now draws the same letters.
 *
 * It has a single weight. Do not pair it with font-bold or font-black: the
 * browser would fake a heavier weight by smearing the outlines.
 */
export const wordmarkFont = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
