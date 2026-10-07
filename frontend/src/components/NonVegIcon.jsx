import React from "react";

/**
 * Checks if a medication or supplement name contains animal/marine/non-veg keywords
 * such as MuscleBlaze Omega-3, Tata 1mg Salmon tablets, fish oil, cod liver, etc.
 */
export function isNonVegMedicine(name = "") {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return (
    n.includes("muscleblaze") ||
    n.includes("salmon") ||
    n.includes("omega-3") ||
    n.includes("omega 3") ||
    n.includes("fish oil") ||
    n.includes("cod liver") ||
    n.includes("shark liver") ||
    n.includes("krill oil") ||
    n.includes("marine collagen") ||
    n.includes("glucosamine")
  );
}

/**
 * Standard Indian Red/Brown Non-Veg Symbol
 * Bordered square with a centered filled red circle/triangle
 */
export default function NonVegIcon({
  name = "",
  showBadge = true,
  size = "md",
  className = ""
}) {
  if (name && !isNonVegMedicine(name)) {
    return null;
  }

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-red-50 border border-red-300 text-red-700 shadow-2xs select-none ${className}`}
      title="Non-Vegetarian Formulation (Contains Marine / Salmon Fish Oil Extracts)"
    >
      {/* Standard Indian Non-Veg Square with Centered Red Dot */}
      <span
        className={`${
          isSmall ? "w-3 h-3 border" : "w-3.5 h-3.5 border-[1.5px]"
        } border-red-700 rounded-[3px] flex items-center justify-center bg-white shrink-0 p-[1.5px]`}
      >
        <span
          className={`${
            isSmall ? "w-1.5 h-1.5" : "w-2 h-2"
          } rounded-full bg-red-700`}
        />
      </span>
      {showBadge && (
        <span
          className={`font-black uppercase tracking-wider text-red-800 ${
            isSmall ? "text-[8px]" : "text-[9px]"
          }`}
        >
          Non-Veg
        </span>
      )}
    </span>
  );
}
