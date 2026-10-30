import { useEffect } from "react";

// Slides one pill under the desktop nav link being hovered or focused, and rests it on the
// active page's link. The navbar re-renders between pages, so the pill is re-attached and
// re-placed whenever the bar's links or their active state change.
export default function NavTabs() {
  useEffect(() => {
    let bar = null;
    let pill = null;
    const links = () => (bar ? [...bar.querySelectorAll(":scope > .navbar__link, :scope > .navbar__item.navbar__link")] : []);
    const place = (el) => {
      if (!pill) return;
      if (!el || el.offsetWidth === 0) {
        pill.style.opacity = "0";
        return;
      }
      pill.style.opacity = "1";
      pill.style.width = `${el.offsetWidth}px`;
      pill.style.height = `${el.offsetHeight}px`;
      pill.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
    };
    const active = () => bar?.querySelector(".navbar__link--active");
    const onOver = (e) => {
      const l = e.target.closest?.(".navbar__link");
      if (l && bar.contains(l)) place(l);
    };
    const onLeave = () => place(active());
    // the active class changes on navigation without the bar being replaced
    const barWatch = new MutationObserver(() => place(active()));
    const attach = () => {
      const next = document.querySelector(".navbar__inner .navbar__items:not(.navbar__items--right)");
      if (next !== bar) {
        barWatch.disconnect();
        bar?.removeEventListener("pointerover", onOver);
        bar?.removeEventListener("focusin", onOver);
        bar?.removeEventListener("pointerleave", onLeave);
        bar?.removeEventListener("focusout", onLeave);
        bar = next;
        if (!bar) return;
        bar.addEventListener("pointerover", onOver);
        bar.addEventListener("focusin", onOver);
        bar.addEventListener("pointerleave", onLeave);
        bar.addEventListener("focusout", onLeave);
        barWatch.observe(bar, { subtree: true, attributes: true, attributeFilter: ["class"] });
      }
      if (bar && (!pill || !bar.contains(pill))) {
        pill = document.createElement("span");
        pill.className = "nav-tab-ind";
        pill.setAttribute("aria-hidden", "true");
        bar.prepend(pill);
      }
      if (links().length) place(active());
    };
    attach();
    const mo = new MutationObserver(() => attach());
    mo.observe(document.body, { subtree: true, childList: true });
    window.addEventListener("resize", attach);
    return () => {
      mo.disconnect();
      barWatch.disconnect();
      window.removeEventListener("resize", attach);
    };
  }, []);
  return null;
}
