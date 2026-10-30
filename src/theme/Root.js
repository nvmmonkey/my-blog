import React from "react";
import CursorLight from "../components/dusk/CursorLight";
import NavTabs from "../components/dusk/NavTabs";
import MenuLock from "../components/dusk/MenuLock";

// Wraps every page once, so the pointer light survives client-side navigation.
export default function Root({ children }) {
  return (
    <>
      {children}
      <CursorLight />
      <NavTabs />
      <MenuLock />
    </>
  );
}
