"use client";

import { useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

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
              <p>Explore TeachMatchs</p>
              <button type="button" onClick={closeMenu} aria-label="Close menu">×</button>
            </div>
            <nav aria-label="Site menu links">
              <div className="site-menu-group">
                <p>TeachMatchs</p>
                <Link href="/" onClick={closeMenu}>Home page <span>→</span></Link>
                <Link href="/company-reviews" onClick={closeMenu}>Company reviews <span>→</span></Link>
                <Link href="/#about" onClick={closeMenu}>About <span>→</span></Link>
              </div>
              <div className="site-menu-group">
                <p>For job seekers</p>
                <Link href="/register?type=teacher" onClick={closeMenu}>Create a CV <span>→</span></Link>
                <Link href="/dashboard/profile" onClick={closeMenu}>Profile and CV <span>→</span></Link>
                <Link href="/jobs" onClick={closeMenu}>Browse jobs <span>→</span></Link>
                <Link href="/dashboard/saved-jobs" onClick={closeMenu}>Saved jobs <span>→</span></Link>
                <Link href="/dashboard/alerts" onClick={closeMenu}>Job alerts <span>→</span></Link>
                <Link href="/dashboard/applications" onClick={closeMenu}>Applications <span>→</span></Link>
                <div className="site-menu-disabled"><span>Language</span><small>English · more languages soon</small></div>
              </div>
              <div className="site-menu-group">
                <p>My TeachMatchs</p>
                <Link href="/dashboard/messages" onClick={closeMenu}>Messages <span>→</span></Link>
                <Link href="/dashboard/interviews" onClick={closeMenu}>Interviews <span>→</span></Link>
                <Link href="/dashboard/notifications" onClick={closeMenu}>Notifications <span>→</span></Link>
                <Link href="/dashboard/reviews" onClick={closeMenu}>Review a school <span>→</span></Link>
              </div>
              <div className="site-menu-group">
                <p>For employers</p>
                <Link href="/register?type=school" onClick={closeMenu}>Employers <span>→</span></Link>
                <Link href="/register?type=school" onClick={closeMenu}>Post a job <span>→</span></Link>
                <Link href="/help" onClick={closeMenu}>Help center <span>→</span></Link>
              </div>
              <div className="site-menu-group">
                <p>Support &amp; policies</p>
                <Link href="/terms" onClick={closeMenu}>Terms <span>→</span></Link>
                <Link href="/help" onClick={closeMenu}>Help <span>→</span></Link>
                <Link href="/privacy-center" onClick={closeMenu}>Privacy center <span>→</span></Link>
              </div>
            </nav>
          </aside>
        </>,
        document.body,
      )}
    </div>
  );
}
