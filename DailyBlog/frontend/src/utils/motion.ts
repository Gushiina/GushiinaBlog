import type { Directive } from "vue";
let observer: IntersectionObserver | undefined;
const observed = new WeakSet<Element>();
export const reveal: Directive<HTMLElement> = {
  mounted(element) {
    if (
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    observer ||= new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        }),
      { threshold: 0.06, rootMargin: "0px 0px 30px 0px" },
    );
    element.classList.add("reveal-ready");
    observed.add(element);
    observer.observe(element);
  },
  unmounted(element) {
    if (observed.has(element)) observer?.unobserve(element);
  },
};

export function transitionAppearance(update: () => void) {
  const documentWithTransition = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };
  if (
    !documentWithTransition.startViewTransition ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  documentWithTransition.startViewTransition(update).finished.catch(() => {});
}
