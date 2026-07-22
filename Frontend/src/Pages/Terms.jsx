import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-offwhite px-[5%] py-16">
      <div className="max-w-[720px] mx-auto bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.08)] p-10">
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        <h1 className="font-syne font-extrabold text-[32px] text-navy mb-2">Terms of Service</h1>
        <p className="font-inter text-[13px] text-slate-400 mb-8">Last updated: July 2026</p>

        <div className="font-inter text-[15px] text-slate-600 leading-relaxed space-y-5">
          <p>
            Welcome to Saarthi. By creating an account or using the app, you agree to these terms.
            Saarthi is a study tool: you upload PDFs you have the right to use, and Saarthi generates
            quizzes, flashcards, summaries, and notes from that content to help you study.
          </p>
          <p>
            <strong className="text-navy">Your content.</strong> You retain ownership of any document
            you upload. You're responsible for making sure you have the right to upload and process it.
          </p>
          <p>
            <strong className="text-navy">Acceptable use.</strong> Don't upload copyrighted material you
            don't have rights to, don't attempt to abuse or overload the service, and don't use Saarthi
            for anything unlawful.
          </p>
          <p>
            <strong className="text-navy">No warranty.</strong> Saarthi is provided "as is." AI-generated
            quizzes, summaries, and answers can be wrong — always verify important facts against your
            original source material.
          </p>
          <p>
            <strong className="text-navy">Changes.</strong> These terms may be updated as the product
            evolves. Continued use of Saarthi after a change means you accept the updated terms.
          </p>
          <p>
            Questions? Reach out at{" "}
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
