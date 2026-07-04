import { Component } from "react";


export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Swap this for a logging service later if you add one (Sentry, etc.)
    console.error("Uncaught render error:", error, info);
  }

  handleGoToDashboard = () => {
    // Full reload clears any broken state that caused the crash,
    // safer than client-side navigate() here.
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-offwhite dot-bg flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(10,22,40,0.10)] p-10 w-full max-w-[440px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mx-auto mb-6">
              ⚠️
            </div>
            <h2 className="font-syne font-extrabold text-[22px] text-navy mb-2">
              Something went wrong
            </h2>
            <p className="font-inter text-[14px] text-slate-500 mb-8 leading-relaxed">
              An unexpected error occurred while loading this page. Your data is safe —
              let's get you back to the dashboard.
            </p>
            <button
              onClick={this.handleGoToDashboard}
              className="w-full py-4 rounded-[12px] bg-gradient-to-br from-blue to-blue-dark font-syne font-bold text-[15px] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 transition-all duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}