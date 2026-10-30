import { useEffect } from "react";

// iOS Safari ignores overflow: hidden on the body, so while the phone menu is open the page
// kept scrolling under it and carried the sheet away. Pin the body in place instead, and
// put the reader back where they were when the menu closes.
export default function MenuLock() {
  useEffect(() => {
    let locked = false;
    let y = 0;
    const lock = () => {
      y = window.scrollY;
      const b = document.body.style;
      b.position = "fixed";
      b.top = `-${y}px`;
      b.left = "0";
      b.right = "0";
      b.width = "100%";
      document.documentElement.classList.add("menu-open");
      locked = true;
    };
    const unlock = () => {
      const b = document.body.style;
      b.position = "";
      b.top = "";
      b.left = "";
      b.right = "";
      b.width = "";
      document.documentElement.classList.remove("menu-open");
      window.scrollTo(0, y);
      locked = false;
    };
    const check = () => {
      const open = Boolean(document.querySelector(".navbar.navbar-sidebar--show"));
      if (open && !locked) lock();
      else if (!open && locked) unlock();
    };
    const mo = new MutationObserver(check);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
    return () => {
      mo.disconnect();
      if (locked) unlock();
    };
  }, []);
  return null;
}
