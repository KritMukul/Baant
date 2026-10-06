import Link from "next/link";

export const metadata = { title: "Privacy and terms" };

/** Placeholder. The real privacy policy and terms must be written before a public launch. */
export default function Privacy() {
  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <Link className="icon-btn" href="/settings" aria-label="Back"><span aria-hidden="true">‹</span></Link>
          <span className="ttl">Privacy and terms</span>
          <span style={{ width: 44 }} />
        </div>
        <div className="body">
          <div className="note2">
            <div>
              <b>This is a test build.</b> The privacy policy and terms have not been written yet. In short: Dibs keeps the bill, the names friends type, what they claimed and what they say they paid, and nothing else. It never holds money. Bill photos are read and not kept; only a small thumbnail is stored with the bill.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
