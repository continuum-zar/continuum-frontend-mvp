"use client";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

/**
 * Large semicircle hero gauge (89 / “Project on track”) — shared by welcome demo
 * and new-project empty overview. Figma playground 35:10702–35:10707.
 */
const imgHeroArcFilled =
  mcpAsset("1c54c7ec-1cc0-4107-8c3d-ea141fcb2f4e");

export function WelcomeProjectHeroGauge() {
  return (
    <div className="relative h-[191px] w-full max-w-[815px] shrink-0" data-node-id="35:10702">
      <div className="absolute top-0 left-1/2 h-[175.151px] w-[350.302px] -translate-x-1/2">
        <div className="absolute inset-[-4.85%_-2.43%]">
          <img alt="" className="block size-full max-w-none" src={imgHeroArcFilled} />
        </div>
      </div>
      <p className="absolute top-[49px] left-1/2 -translate-x-1/2 font-['Satoshi',sans-serif] text-[70.704px] font-normal leading-normal text-[#0b191f]">
        89
      </p>
      <p className="absolute top-[159px] left-1/2 -translate-x-1/2 whitespace-nowrap font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal text-[#727d83]">
        Project on track
      </p>
    </div>
  );
}
