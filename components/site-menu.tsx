"use client";

import { useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

const comingSoon = ["Settings", "Notifications", "Messages", "Privacy policy", "Reviews", "Help"];

export function SiteMenu() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="site-menu">
      <button
        className="site-menu-trigger"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span></span><span></span><span></span>
      </button>
      {open && createPortal(
        <>
          <button className="site-menu-backdrop" type="button" aria-label="Close menu" onClick={closeMenu}></button>
          <aside className="site-menu-panel" id="site-menu-panel" aria-label="Site menu">
            <div className="site-menu-heading">
              <p>Explore TeachMatch</p>
              <button type="button" onClick={closeMenu} aria-label="Close menu">×</button>
            </div>
            <nav aria-label="Site menu links">
              <div className="site-menu-group">
                <Link href="/register" onClick={closeMenu}>Sign up <span>→</span></Link>
                <Link href="/login" onClick={closeMenu}>Log in <span>→</span></Link>
              </div>
              <div className="site-menu-group">
                <Link href="/jobs" onClick={closeMenu}>Find jobs <span>→</span></Link>
                <Link href="/#how-it-works" onClick={closeMenu}>How it works <span>→</span></Link>
                <Link href="/#for-schools" onClick={closeMenu}>For schools <span>→</span></Link>
              </div>
              <div className="site-menu-group site-menu-coming-soon" aria-label="Coming soon">
                {comingSoon.map((item) => (
                  <div className="site-menu-disabled" key={item} aria-disabled="true">
                    <span>{item}</span><small>Coming soon</small>
                  </div>
                ))}
              </div>
            </nav>
          </aside>
        </>,
        document.body,
      )}
    </div>
  );
}
