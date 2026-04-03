export default function ComingSoon() {
  return (
    /* Transparent backdrop with blur — blocks all clicks */
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 select-none">

      {/* Modal box */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-10 flex flex-col items-center text-center">

        {/* School icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        </div>

        {/* School name */}
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
          Database Technology College
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Coming Soon</h1>
        <div className="w-10 h-0.5 bg-emerald-400 rounded-full mx-auto mb-4" />

        {/* Message */}
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Our enrollment system is being finalized. We'll be ready for you shortly.
        </p>

        {/* 3-dot loading animation */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
