import type { ReactNode } from 'react'

/**
 * A realistic smartphone built purely from CSS: thin bezel, metallic frame
 * edge, dynamic island, hardware buttons and a natural soft shadow.
 * Children render inside the display area.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative" aria-hidden="true">
      {/* Hardware buttons */}
      <div className="absolute -left-[2.5px] top-28 h-8 w-[3px] rounded-l-md bg-neutral-500" />
      <div className="absolute -left-[2.5px] top-[11.5rem] h-14 w-[3px] rounded-l-md bg-neutral-500" />
      <div className="absolute -left-[2.5px] top-64 h-14 w-[3px] rounded-l-md bg-neutral-500" />
      <div className="absolute -right-[2.5px] top-44 h-20 w-[3px] rounded-r-md bg-neutral-500" />

      {/* Metallic frame + bezel */}
      <div className="relative w-[300px] rounded-[3.1rem] bg-gradient-to-b from-neutral-400 via-neutral-600 to-neutral-800 p-[3px] shadow-[0_60px_90px_-32px_rgba(23,23,23,0.45),0_24px_36px_-20px_rgba(23,23,23,0.35)]">
        <div className="rounded-[3rem] bg-black p-[9px]">
          {/* Display */}
          <div className="relative h-[600px] overflow-hidden rounded-[2.5rem] bg-white">
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2.5 z-20 flex h-[22px] w-[86px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5">
              <span className="h-[7px] w-[7px] rounded-full bg-neutral-700 ring-1 ring-neutral-600" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
