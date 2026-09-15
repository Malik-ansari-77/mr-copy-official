/** Design philosophy: Field Notes Utility — a precise, deliberate account-deletion flow confirms the verified Firebase identity before the server performs a bounded deletion. */

import { useState } from "react";
import { CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { getDeletionAuth, invokeDeleteMyAccount, signInForAccountDeletion, signOutOfDeletionFlow } from "@/lib/firebase";
import { deletionErrorMessage } from "@/lib/deleteAccountErrors";
import { usePageMeta } from "@/hooks/usePageMeta";
import { p5Schemas } from "@/lib/seo";

export default function DeleteAccount() {
  usePageMeta({ title: "Delete Account", description: "Securely delete a Mr. Copy Firebase account after Google authentication, while keeping local clipboard data and Google Play subscriptions separate.", path: "/delete-account", schema: p5Schemas.deleteAccount });
  const [email, setEmail] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<"idle" | "signing-in" | "ready" | "deleting" | "success">("idle");
  const [error, setError] = useState("");

  const signIn = async () => {
    setState("signing-in"); setError("");
    try {
      const result = await signInForAccountDeletion();
      setEmail(result.email); setState("ready");
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      setError(code === "auth/popup-closed-by-user" ? "Google sign-in was cancelled. No account changes were made." : "Unable to sign in with Google. Please try again.");
      setState("idle");
    }
  };

  const deleteAccount = async () => {
    if (!confirmed) { setError("Confirm that you understand this permanent action before continuing."); return; }
    const user = getDeletionAuth().currentUser;
    if (!user) { setError("Please sign in with Google again before continuing."); setState("idle"); return; }
    setState("deleting"); setError("");
    try {
      await invokeDeleteMyAccount();
      await signOutOfDeletionFlow();
      setState("success");
    } catch (cause) {
      setError(deletionErrorMessage(cause));
      setState("ready");
    }
  };

  return <div className="delete-page"><section className="page-hero delete-hero"><div className="shell page-hero-ledger"><aside className="hero-ledger-rail" aria-hidden="true"><span>06</span><i /></aside><div className="page-hero-copy"><p className="eyebrow">Account support</p><h1>Delete your Mr. Copy account.</h1><p>Confirm ownership with the same Google account used for Mr. Copy. The deletion service uses the verified Firebase identity, not an email entered into this page.</p></div></div></section><section className="section"><div className="shell deletion-grid"><div className="deletion-details"><h2>What this deletion covers</h2><ul className="deletion-list"><li><CheckCircle2 size={19} aria-hidden="true" /><span><strong>Firebase account and account record.</strong> The authenticated Firebase account and its matching Firestore account record are deleted only after server-side verification.</span></li><li><CheckCircle2 size={19} aria-hidden="true" /><span><strong>Local content stays on your device.</strong> Clipboard items, saved content, folders, and other local data are not uploaded or removed by this website.</span></li><li><CheckCircle2 size={19} aria-hidden="true" /><span><strong>Google Play subscriptions remain separate.</strong> Deleting a Mr. Copy account does not cancel a Google Play subscription. Manage subscriptions directly through Google Play.</span></li></ul><div className="legal-callout"><Info size={18} aria-hidden="true" /><span>This action is permanent. The website shows completion only after the deletion backend confirms success.</span></div></div><div className="request-form" aria-live="polite"><p className="eyebrow">Secure deletion</p><h2>{state === "success" ? "Account deletion completed" : "Verify your Google account"}</h2>{state === "success" ? <div className="request-ready"><strong>Your Firebase account and matching Mr. Copy account record have been deleted.</strong><p>Local clipboard content remains on your device, and Google Play subscriptions must be managed separately.</p></div> : <><p>Sign in with the Google account used for Mr. Copy. The deletion service derives the account UID from the verified sign-in token.</p>{(state === "ready" || state === "deleting") ? <><p className="form-note">Signed in as <strong>{email || "your Google account"}</strong>.</p><label className="confirm-action"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> <span>I understand that deleting this account is permanent and does not cancel my Google Play subscription.</span></label><button type="button" className="button button-primary" onClick={deleteAccount} disabled={state === "deleting"}>{state === "deleting" ? "Deleting account…" : "Delete my account"}</button></> : <button type="button" className="button button-primary" onClick={signIn} disabled={state === "signing-in"}>{state === "signing-in" ? "Opening Google sign-in…" : "Sign in with Google"}</button>}{error ? <p className="form-error" role="alert">{error}</p> : null}</>}</div></div></section></div>;
}
