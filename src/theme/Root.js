import React from "react";
import CursorLight from "../components/dusk/CursorLight";

// Wraps every page once, so the pointer light survives client-side navigation.
export default function Root({ children }) {
  return (
    <>
      {children}
      <CursorLight />
    </>
  );
}
