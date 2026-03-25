import React from "react";
import PieMenu from "./PieMenu/PieMenu";

function Overlay(): React.ReactElement {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <PieMenu />
    </div>
  );
}

export default Overlay;
