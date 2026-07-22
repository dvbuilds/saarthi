import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-offwhite px-[5%] py-16">
      <div className="max-w-[720px] mx-auto bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.08)] p-10">
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        <h1 className="font-syne font-extrabold text-[32px] text-navy mb-2">Privacy Policy</h1>
        <p className="font-inter text-[13px] text-slate-400 mb-8">Last updated: July 2026</p>

        <div className="font-inter text-[15px] text-slate-600 leading-relaxed space-y-5">
          <p>
            This page explains what Saarthi collects and how it's used. We collect only what's needed
            to run the app well.
          </p>
          <p>
            <strong className="text-navy">Account data.</strong> Your name, email, and a securely hashed
            password are stored to identify your account and keep it secure.
          </p>
          <p>
            <strong className="text-navy">Uploaded documents.</strong> PDFs you upload are stored with
            our storage provider (Cloudinary) and processed to extract text for the AI features you use
            (chat, quiz, flashcards, summary, notes). Your documents are not shared with other users.
          </p>
          <p>
            <strong className="text-navy">AI processing.</strong> Extracted document text is sent to our
            AI provider to generate responses. We don't use your documents to train third-party models.
          </p>
          <p>
            <strong className="text-navy">Cookies.</strong> Saarthi uses secure, HTTP-only session cookies
            solely to keep you signed in. We don't use tracking or advertising cookies.
          </p>
          <p>
            <strong className="text-navy">Deleting your data.</strong> Deleting a document from your
            dashboard removes it and its associated data. To delete your account entirely, contact us.
          </p>
          <p>
            Questions or requests? Reach out at{" "}
            <a href="mailto:support@saarthi.app" className="text-blue hover:underline">support@saarthi.app</a>.
          </p>
        </div>

        <Link to="/register" className="inline-block mt-10 font-inter text-[14px] text-blue font-semibold no-underline hover:underline">
          ← Back to sign up
        </Link>
      </div>
    </div>
  );
}
