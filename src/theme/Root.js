import React from "react";
import CursorLight from "../components/dusk/CursorLight";
import NavTabs from "../components/dusk/NavTabs";
import MenuLock from "../components/dusk/MenuLock";
import { Analytics } from "@vercel/analytics/react";

// Wraps every page once, so the pointer light survives client-side navigation.
// Analytics loads Vercel Web Analytics (cookieless); it counts client-side route changes too.
export default function Root({ children }) {
  return (
    <>
      {children}
      <CursorLight />
      <NavTabs />
      <MenuLock />
      <Analytics />
    </>
  );
}
