import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "../glossary.js";

const TIP_WIDTH = 300;
const GAP = 8;

export default function Term({ id, children }) {
  const entry = GLOSSARY[id];
  const tipId = useId();
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const anchor = triggerRef.current.getBoundingClientRect();
    const tipHeight = tipRef.current.offsetHeight;
    const left = Math.min(Math.max(GAP, anchor.left), window.innerWidth - TIP_WIDTH - GAP);
    const fitsBelow = anchor.bottom + GAP + tipHeight < window.innerHeight;
    const top = fitsBelow ? anchor.bottom + GAP : anchor.top - GAP - tipHeight;
    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setPinned(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!entry) return children;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="term"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => !pinned && setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setPinned(false);
        }}
        onClick={() => {
          setPinned(!pinned);
          setOpen(!pinned);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setPinned(false);
          }
        }}
      >
        {children ?? entry.term}
      </button>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className="term-tip"
            style={{ top: position.top, left: position.left, width: TIP_WIDTH }}
          >
            <strong>{entry.term}</strong>
            <p>{entry.definition}</p>
            <p className="term-meaning">{entry.meaning}</p>
          </div>,
          document.body
        )}
    </>
  );
}
