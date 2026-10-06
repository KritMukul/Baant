import { credsFor } from "./session";
import { buildView, resolveViewer, type BillView, type Viewer } from "./service";
import { store } from "./store";

export interface Loaded {
  view: BillView;
  viewer: Viewer;
}

/** What this browser may see of a bill. null = it does not exist (or is a draft and this is not the host). */
export async function loadForViewer(code: string): Promise<Loaded | null> {
  const s = store();
  const d = await s.getBillData(code);
  if (!d) return null;
  const viewer = await resolveViewer(s, d, await credsFor(code));
  const view = buildView(d, viewer);
  return view ? { view, viewer } : null;
}
