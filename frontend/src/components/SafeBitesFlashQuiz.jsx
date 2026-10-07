import { useState, useEffect } from "react";
import {
  HelpCircle, CheckCircle2, XCircle, Sparkles, ArrowRight,
  ArrowLeft, Lightbulb, ShieldAlert, Award, Zap, Compass, RefreshCw
} from "lucide-react";

export default function SafeBitesFlashQuiz({ quizList, onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [animState, setAnimState] = useState("idle"); // 'idle' | 'sliding-out' | 'sliding-in'
  const [animDirection, setAnimDirection] = useState("left"); // 'left' | 'right'
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!quizList || quizList.length === 0) return null;

  const currentCard = quizList[currentIndex] || quizList[0];
  const isLast = currentIndex === quizList.length - 1;
  const isCorrectChoice = selectedOption === currentCard.correct_index;

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === currentCard.correct_index) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLast) {
      // Final card completion transition
      setIsUnlocking(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 700);
      return;
    }

    // Trigger Mac-style slide out to the left
    setAnimDirection("left");
    setAnimState("sliding-out");

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setAnimState("sliding-in");

      setTimeout(() => {
        setAnimState("idle");
      }, 40);
    }, 320);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;

    // Trigger Mac-style slide out to the right
    setAnimDirection("right");
    setAnimState("sliding-out");

    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setAnimState("sliding-in");

      setTimeout(() => {
        setAnimState("idle");
      }, 40);
    }, 320);
  };

  // Determine Mac transform classes based on animation state
  let transformClasses = "transform transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]";
  if (animState === "sliding-out") {
    transformClasses += animDirection === "left"
      ? " -translate-x-[120%] scale-90 -rotate-3 opacity-0 filter blur-[3px]"
      : " translate-x-[120%] scale-90 rotate-3 opacity-0 filter blur-[3px]";
  } else if (animState === "sliding-in") {
    transformClasses += animDirection === "left"
      ? " translate-x-[100%] scale-95 rotate-2 opacity-0"
      : " -translate-x-[100%] scale-95 -rotate-2 opacity-0";
  } else {
    transformClasses += " translate-x-0 scale-100 rotate-0 opacity-100 filter-none";
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950/95 border-2 border-teal-500/40 shadow-2xl backdrop-blur-xl text-white">
      {/* Dynamic Ambient Glow Behind Card */}
      <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
        isAnswered
          ? isCorrectChoice
            ? "bg-emerald-500/25"
            : "bg-rose-500/25"
          : "bg-teal-500/20"
      }`} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Mac Application Window Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-teal-800/50 backdrop-blur-md">
        {/* Mac Window Control Dots */}
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-sm shadow-red-500/40 border border-red-600/60" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-sm shadow-amber-500/40 border border-amber-600/60" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] shadow-sm shadow-emerald-500/40 border border-emerald-600/60" />
          <span className="ml-3 text-[11px] font-mono tracking-wider text-teal-300/80 font-bold uppercase hidden sm:inline">
            SafeBites Forensics • Myth Buster.app
          </span>
        </div>

        {/* Progress Pill & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-700/60 text-[11px] font-bold text-teal-200">
            <Sparkles size={13} className="text-teal-400 animate-pulse" />
            <span>Card {currentIndex + 1} of {quizList.length}</span>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="text-[11px] font-bold text-teal-300/90 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
            >
              Skip Deck →
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-900 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 transition-all duration-500"
          style={{ width: `${((currentIndex + (isAnswered ? 1 : 0.5)) / quizList.length) * 100}%` }}
        />
      </div>

      {/* Main Flashcard Body (Animates with Mac-style horizontal sliding) */}
      <div className="relative p-6 sm:p-8">
        <div className={transformClasses}>
          {/* Badge & Topic Header */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-200 text-xs font-black uppercase tracking-wider border border-teal-400/30 shadow-inner flex items-center gap-1.5">
                <Lightbulb size={13} className="text-teal-300" />
                <span>{currentCard.badge || "Food Forensic Secret"}</span>
              </span>
              <span className="text-[11px] text-teal-400/80 font-mono hidden sm:inline">
                • Interactive Label Audit
              </span>
            </div>

            {/* Score Tracker */}
            <div className="text-[11px] font-bold text-gray-400">
              Score: <span className="text-emerald-400 font-extrabold">{score}</span> / {quizList.length}
            </div>
          </div>

          {/* Flashy Question Heading */}
          <div className="mb-6">
            <h3 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
              {currentCard.question}
            </h3>
          </div>

          {/* Options Grid (Glassmorphic Buttons with Dynamic Flashy Feedback) */}
          <div className="space-y-3 mb-6">
            {currentCard.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentCard.correct_index;

              let cardStyle = "bg-white/5 hover:bg-white/10 border-white/10 text-gray-100 hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-950/50";
              let badgeStyle = "bg-white/10 text-teal-200 group-hover:bg-teal-500 group-hover:text-slate-950";

              if (isAnswered) {
                if (isCorrect) {
                  cardStyle = "bg-emerald-500/25 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 shadow-xl shadow-emerald-950/60 scale-[1.01]";
                  badgeStyle = "bg-emerald-500 text-slate-950 font-black";
                } else if (isSelected && !isCorrect) {
                  cardStyle = "bg-rose-500/25 border-rose-400 text-rose-100 shadow-xl shadow-rose-950/60";
                  badgeStyle = "bg-rose-500 text-white font-black";
                } else {
                  cardStyle = "bg-white/5 border-white/5 text-gray-500 opacity-40";
                  badgeStyle = "bg-white/5 text-gray-600";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border text-sm sm:text-base font-semibold transition-all duration-200 flex items-start gap-3.5 group relative overflow-hidden active:scale-[0.99] ${cardStyle}`}
                >
                  {/* Option letter pill */}
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-sm ${badgeStyle}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>

                  {/* Option text */}
                  <span className="flex-1 pt-1 leading-snug">{option}</span>

                  {/* Outcome Icons */}
                  {isAnswered && isCorrect && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5 animate-in zoom-in-50 duration-300">
                      <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider hidden sm:inline">
                        Correct Answer
                      </span>
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    </div>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5 animate-in zoom-in-50 duration-300">
                      <span className="text-[10px] font-black uppercase text-rose-300 tracking-wider hidden sm:inline">
                        Marketing Trap
                      </span>
                      <XCircle size={22} className="text-rose-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Flashy Answer Explanation Reveal Banner */}
          {isAnswered && (
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-500 space-y-3 animate-in fade-in slide-in-from-bottom-3 ${
              isCorrectChoice
                ? "bg-gradient-to-br from-emerald-950/70 via-teal-950/60 to-slate-900 border-emerald-500/50 shadow-2xl shadow-emerald-950/60"
                : "bg-gradient-to-br from-rose-950/60 via-slate-900 to-amber-950/40 border-rose-500/50 shadow-2xl shadow-rose-950/60"
            }`}>
              {/* Header with celebration / warning */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                  <Sparkles size={16} className={isCorrectChoice ? "text-emerald-400 animate-spin" : "text-amber-400"} />
                  <span className={isCorrectChoice ? "text-emerald-300" : "text-amber-300"}>
                    {isCorrectChoice ? "🎉 Spot On! Myth Successfully Busted" : "💡 The Food Science Secret Revealed"}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-teal-200">
                  Forensic Truth
                </span>
              </div>

              {/* Busted Myth Alert Callout */}
              {currentCard.busted_myth && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs sm:text-sm font-bold flex items-start gap-2.5">
                  <span className="text-base shrink-0">⚠️</span>
                  <p className="leading-snug">{currentCard.busted_myth}</p>
                </div>
              )}

              {/* Deep Scientific Explanation */}
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed pt-1">
                {currentCard.explanation}
              </p>

              {/* Next Navigation Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-teal-300/80">
                  {currentIndex > 0 && (
                    <button
                      onClick={handlePrev}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all text-xs"
                    >
                      <ArrowLeft size={13} />
                      <span>Previous Card</span>
                    </button>
                  )}
                  <span className="text-[11px] font-mono">
                    {isLast ? "Final Card • Ready to reveal lab analysis" : `Next: Card ${currentIndex + 2}`}
                  </span>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-950/60 transition-all hover:scale-105 active:scale-95 group"
                >
                  <span>{isLast ? "🔓 Reveal Ingredients Pie Chart & Forensic Audit" : "Next Flash Card"}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unlocking Full Forensics Transition Overlay */}
      {isUnlocking && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-emerald-500/40 mb-4 animate-bounce">
            <Sparkles size={32} />
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-white">
            Forensics Deck Completed!
          </h4>
          <p className="text-xs sm:text-sm text-teal-300 mt-2 max-w-md">
            Unlocking chemical decomposition, ingredient pie chart proportions, and international formulation comparison...
          </p>
        </div>
      )}
    </div>
  );
}
