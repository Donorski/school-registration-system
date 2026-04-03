export default function ComingSoon() {
  return (
    /* Transparent backdrop with blur — blocks all clicks */
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 select-none">

      {/* Modal box */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-10 flex flex-col items-center text-center">

        {/* School logo */}
        <img src="/images/logo.png" alt="School Logo" className="w-20 h-20 object-contain mb-5" />

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
