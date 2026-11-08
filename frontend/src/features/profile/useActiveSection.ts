import { useCallback, useEffect, useState, type FocusEvent } from "react";
import { SECTIONS, sectionIdOfField } from "./profileForm";

/** Fraction of the viewport height a section's top must pass to count as "being read". */
const READING_LINE_RATIO = 0.4;

/**
 * Tracks which form section the user is on, for the sidebar highlight.
 *
 * Focus wins over scroll position: while an input has focus its section is
 * active, so smooth-scrolling to a field never flips the highlight to a
 * neighbour. Attach `onFormFocus` to the form's `onFocus`.
 */
export function useActiveSection() {
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const focused = document.activeElement;
      if (focused instanceof HTMLInputElement && sectionIdOfField(focused.name)) return;

      const readingLine = window.innerHeight * READING_LINE_RATIO;
      const atPageBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      let current = SECTIONS[0].id;
      for (const section of SECTIONS) {
        const top = document.getElementById(section.id)?.getBoundingClientRect().top;
        if (top !== undefined && (top <= readingLine || atPageBottom)) current = section.id;
      }
      setActiveSectionId(current);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("focusout", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("focusout", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  const onFormFocus = useCallback((event: FocusEvent<HTMLFormElement>) => {
    const target: EventTarget = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const sectionId = sectionIdOfField(target.name);
    if (sectionId) setActiveSectionId(sectionId);
  }, []);

  return { activeSectionId, onFormFocus };
}
