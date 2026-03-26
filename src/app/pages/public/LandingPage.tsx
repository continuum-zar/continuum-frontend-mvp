import React from "react";
import clsx from "clsx";
import { Link } from "react-router";
import svgPaths from "./landing-svg";

/** Hero panel images under `public/landing/`. */
const imgWip = "/landing/83a55141b039a44613c6c93d2b20289d9128f6c1.png";
const imgWip1 = "/landing/4c18501708f09ce453837dc0d00f9f3592d6896b.png";
const imgWip2 = "/landing/d50090486565d73083f0d763cbc6c9cf009a03fe.png";
type BackgroundImage12Props = {
  additionalClassNames?: string;
};

function BackgroundImage12({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage12Props>) {
  return (
    <div className={clsx("absolute bg-white rounded-[7.936px] top-0 w-[116.56px]", additionalClassNames)}>
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">{children}</div>
      <div aria-hidden="true" className="absolute border-[#ebedee] border-[0.496px] border-solid inset-0 pointer-events-none rounded-[7.936px] shadow-[0px_9px_2px_0px_rgba(26,59,84,0),0px_6px_2px_0px_rgba(26,59,84,0.01),0px_3px_2px_0px_rgba(26,59,84,0.04),0px_1px_1px_0px_rgba(26,59,84,0.06),0px_0px_1px_0px_rgba(26,59,84,0.07)]" />
    </div>
  );
}

function BackgroundImage11({ children }: React.PropsWithChildren) {
  return (
    <div style={{ backgroundImage: "linear-gradient(90deg, rgb(242, 245, 247) 0%, rgb(242, 245, 247) 100%), linear-gradient(90deg, rgb(252, 249, 243) 0%, rgb(252, 249, 243) 100%)" }} className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[11.904px] items-start pb-[7.936px] pl-[11.904px] pr-[7.936px] pt-[11.904px] relative w-full">{children}</div>
    </div>
  );
}

function BackgroundImage10({ children }: React.PropsWithChildren) {
  return (
    <div className="relative shrink-0 size-[9.273px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.27288 9.27288">
        {children}
      </svg>
    </div>
  );
}

function BackgroundImage9({ children }: React.PropsWithChildren) {
  return (
    <div className="h-[8.608px] relative shrink-0 w-[7.936px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.936 8.608">
        {children}
      </svg>
    </div>
  );
}

function BackgroundImage8({ children }: React.PropsWithChildren) {
  return (
    <div className="relative shrink-0 size-[11.904px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.904 11.904">
        {children}
      </svg>
    </div>
  );
}

function BackgroundImage7({ children }: React.PropsWithChildren) {
  return (
    <div className="relative shrink-0 size-[7.936px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.936 7.936">
        {children}
      </svg>
    </div>
  );
}

function BackgroundImage6({ children }: React.PropsWithChildren) {
  return (
    <div className="absolute inset-[-5.97%_-5.96px_-79.38%_-5.96px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.912 46.336">
        {children}
      </svg>
    </div>
  );
}

function BackgroundImage5({ children }: React.PropsWithChildren) {
  return (
    <div className="bg-white relative rounded-[4.636px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e9e9e9] border-[0.58px] border-solid inset-0 pointer-events-none rounded-[4.636px]" />
      <div className="flex flex-row items-center size-full">{children}</div>
    </div>
  );
}

function BackgroundImage4({ children }: React.PropsWithChildren) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[9.92px] items-end pb-[11.904px] pt-[9.92px] px-[11.904px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function ComponentBackgroundImage({ children }: React.PropsWithChildren) {
  return (
    <BackgroundImage5>
      <div className="content-stretch flex items-center justify-between px-[9.273px] py-[6.955px] relative w-full">{children}</div>
    </BackgroundImage5>
  );
}

function BackgroundImage3({ children }: React.PropsWithChildren) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[9.749px] items-center pl-[9.749px] relative w-full">{children}</div>
      </div>
    </div>
  );
}

function LucideChevronDownBackgroundImage({ children }: React.PropsWithChildren) {
  return (
    <div className="relative shrink-0 size-[19.498px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.4978 19.4978">
        <g id="lucide/chevron-down">{children}</g>
      </svg>
    </div>
  );
}
type ComponentBackgroundImageAndText1Props = {
  text: string;
};

function ComponentBackgroundImageAndText1({ text }: ComponentBackgroundImageAndText1Props) {
  return (
    <Link
      to="/register"
      className="content-stretch flex gap-[6px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0 no-underline bg-[#24b5f8] hover:bg-[#297ccb] transition-colors"
    >
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_12px_3px_0px_rgba(45,154,249,0),0px_8px_3px_0px_rgba(45,154,249,0.03),0px_4px_3px_0px_rgba(45,154,249,0.11),0px_2px_2px_0px_rgba(45,154,249,0.19),0px_0px_1px_0px_rgba(45,154,249,0.21)]" />
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">{text}</p>
    </Link>
  );
}
type Frame379BackgroundImageProps = {
  additionalClassNames?: string;
};

function Frame379BackgroundImage({ additionalClassNames = "" }: Frame379BackgroundImageProps) {
  return (
    <div className={clsx("absolute h-[25px] top-[164px] w-0", additionalClassNames)}>
      <BackgroundImage6>
        <g filter="url(#filter0_dddd_1_653)" id="Vector 14">
          <path d="M5.956 1.492V26.492" stroke="var(--stroke-0, #E4EAEC)" strokeDasharray="9 9" strokeLinecap="round" />
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="46.336" id="filter0_dddd_1_653" width="11.912" x="0" y="5.96046e-08">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="0.992" />
            <feGaussianBlur stdDeviation="0.992" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.0588235 0 0 0 0 0.121569 0 0 0 0.04 0" />
            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_653" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="3.472" />
            <feGaussianBlur stdDeviation="1.736" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.03 0" />
            <feBlend in2="effect1_dropShadow_1_653" mode="normal" result="effect2_dropShadow_1_653" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="7.936" />
            <feGaussianBlur stdDeviation="2.48" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.02 0" />
            <feBlend in2="effect2_dropShadow_1_653" mode="normal" result="effect3_dropShadow_1_653" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="13.888" />
            <feGaussianBlur stdDeviation="2.728" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.01 0" />
            <feBlend in2="effect3_dropShadow_1_653" mode="normal" result="effect4_dropShadow_1_653" />
            <feBlend in="SourceGraphic" in2="effect4_dropShadow_1_653" mode="normal" result="shape" />
          </filter>
        </defs>
      </BackgroundImage6>
    </div>
  );
}

function LucideDownloadBackgroundImage() {
  return (
    <BackgroundImage7>
      <g clipPath="url(#clip0_1_765)" id="lucide/download">
        <path d={svgPaths.p1aa12300} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.744" />
      </g>
      <defs>
        <clipPath id="clip0_1_765">
          <rect fill="white" height="7.936" width="7.936" />
        </clipPath>
      </defs>
    </BackgroundImage7>
  );
}

function LucideScrollTextBackgroundImage() {
  return (
    <BackgroundImage8>
      <g clipPath="url(#clip0_1_659)" id="lucide/scroll-text">
        <path d={svgPaths.p7a68180} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.496" />
      </g>
      <defs>
        <clipPath id="clip0_1_659">
          <rect fill="white" height="11.904" width="11.904" />
        </clipPath>
      </defs>
    </BackgroundImage8>
  );
}

function LucideEllipsisBackgroundImage1() {
  return (
    <BackgroundImage9>
      <g clipPath="url(#clip0_1_679)" id="lucide/ellipsis">
        <g id="Vector">
          <path d={svgPaths.p376c1b80} stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p889f200} stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p12ec3e00} stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_1_679">
          <rect fill="white" height="8.608" width="7.936" />
        </clipPath>
      </defs>
    </BackgroundImage9>
  );
}

function BackgroundImage2() {
  return (
    <div className="h-0 relative shrink-0 w-full">
      <div className="absolute inset-[-0.28px_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 92.752 0.56544">
          <path d="M0 0.28272H92.752" id="Vector 4" stroke="var(--stroke-0, #EBEDEE)" strokeWidth="0.56544" />
        </svg>
      </div>
    </div>
  );
}
type BackgroundImage1Props = {
  text: string;
  text1: string;
};

function BackgroundImage1({ text, text1 }: BackgroundImage1Props) {
  return (
    <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis whitespace-nowrap">
      <p className="overflow-hidden relative shrink-0 text-[#727d83] text-[5.952px]">{text}</p>
      <p className="overflow-hidden relative shrink-0 text-[#0b191f] text-[6.944px]">{text1}</p>
    </div>
  );
}
type BackgroundImageProps = {
  text: string;
  text1: string;
};

function BackgroundImage({ text, text1 }: BackgroundImageProps) {
  return (
    <div className="content-stretch flex flex-col gap-[3.968px] items-start leading-[normal] not-italic relative shrink-0 w-full">
      <p className="font-['Satoshi:Medium',sans-serif] relative shrink-0 text-[#0b191f] text-[9.92px] w-full">{text}</p>
      <p className="font-['Satoshi:Regular',sans-serif] relative shrink-0 text-[#606d76] text-[6.944px] w-full">{text1}</p>
    </div>
  );
}

function LucideEllipsisBackgroundImage() {
  return (
    <BackgroundImage9>
      <g clipPath="url(#clip0_1_667)" id="lucide/ellipsis">
        <g id="Vector">
          <path d={svgPaths.p376c1b80} stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p889f200} stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p12ec3e00} stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_1_667">
          <rect fill="white" height="8.608" width="7.936" />
        </clipPath>
      </defs>
    </BackgroundImage9>
  );
}
type BackgroundImageAndTextProps = {
  text: string;
};

function BackgroundImageAndText({ text }: BackgroundImageAndTextProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.2)] content-stretch flex gap-[12px] items-center px-[16px] py-[8px] relative rounded-[99px] shrink-0">
      <div className="relative flex items-center justify-center shrink-0 size-[16px] bg-white rounded-full border border-[#e4eaec]">
        <div className="bg-[#eb4335] rounded-[1px] size-[6px]" />
      </div>
      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type ComponentBackgroundImageAndTextProps = {
  text: string;
  additionalClassNames?: string;
  /** When false, render a non-interactive div (e.g. decorative hidden elements). */
  asLink?: boolean;
};

function ComponentBackgroundImageAndText({ text, additionalClassNames = "", asLink = true }: ComponentBackgroundImageAndTextProps) {
  const className = clsx(
    "bg-white content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0",
    asLink && "no-underline",
    additionalClassNames
  );
  const inner = (
    <>
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-[-1px] pointer-events-none rounded-[9px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]" />
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[14px] whitespace-nowrap">{text}</p>
    </>
  );
  if (!asLink) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <Link to="/register" className={className}>
      {inner}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden bg-[#f9fafb]"
      data-name="Landing page"
    >
      <div className="-translate-x-1/2 absolute h-[627.236px] left-[calc(50%-0.27px)] top-[471px] w-[1679.176px]">
        <div className="-translate-x-1/2 absolute h-[686.179px] left-[calc(50%+0.42px)] top-[-9.65px] w-[1230.295px]">
          <div className="absolute inset-[-91.26%_-50.9%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2482.66 1938.54">
              <g id="Frame 351" opacity="0.99" style={{ mixBlendMode: "normal" }}>
                <g filter="url(#filter0_f_1_711)" id="Vector 9">
                  <path d={svgPaths.p225fa580} fill="url(#paint0_linear_1_711)" />
                </g>
                <g filter="url(#filter1_f_1_711)" id="Vector 10">
                  <path d={svgPaths.p2e9ec080} fill="#B2E6F7" />
                </g>
                <g filter="url(#filter2_f_1_711)" id="Vector 11">
                  <path d={svgPaths.p20cd9a00} fill="#B2E6F7" />
                </g>
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="1857.86" id="filter0_f_1_711" width="1724.76" x="408.949" y="69.6523">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feGaussianBlur result="effect1_foregroundBlur_1_711" stdDeviation="313.091" />
                </filter>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="1898.54" id="filter1_f_1_711" width="1930.27" x="-2.27338e-05" y="-2.62836e-05">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feGaussianBlur result="effect1_foregroundBlur_1_711" stdDeviation="313.091" />
                </filter>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="1813.03" id="filter2_f_1_711" width="1768.2" x="714.454" y="125.512">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feGaussianBlur result="effect1_foregroundBlur_1_711" stdDeviation="313.091" />
                </filter>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_711" x1="1220.43" x2="6236.81" y1="-825.467" y2="4126.34">
                  <stop stopColor="#B2E6F7" />
                  <stop offset="1" stopColor="#B2E6F7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="absolute flex h-[446.294px] items-center justify-center left-[130.86px] top-[103px] w-[463.259px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="flex-none rotate-[-5.98deg]">
            <div className="h-[404.386px] pointer-events-none relative rounded-[9.829px] w-[423.44px]" data-name="WIP">
              <div aria-hidden="true" className="absolute inset-0 rounded-[9.829px]">
                <div className="absolute inset-0 rounded-[9.829px]" style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }} />
                <img alt="" className="absolute max-w-none object-cover rounded-[9.829px] size-full" src={imgWip} />
              </div>
              <div aria-hidden="true" className="absolute border-[#ededed] border-[1.081px] border-solid inset-0 rounded-[9.829px] shadow-[0px_124.343px_34.6px_0px_rgba(26,58,84,0),0px_80.012px_31.356px_0px_rgba(26,58,84,0.01),0px_44.331px_27.031px_0px_rgba(26,58,84,0.05),0px_19.462px_19.462px_0px_rgba(26,58,84,0.09),0px_5.406px_10.812px_0px_rgba(26,58,84,0.1)]" />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[446.305px] items-center justify-center left-[1094.04px] top-[113.35px] w-[463.268px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="flex-none rotate-[5.98deg]">
            <div className="h-[404.39px] pointer-events-none relative rounded-[5.54px] w-[423.442px]" data-name="WIP">
              <div aria-hidden="true" className="absolute inset-0 rounded-[5.54px]">
                <div className="absolute inset-0 rounded-[5.54px]" style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }} />
                <img alt="" className="absolute max-w-none object-cover rounded-[5.54px] size-full" src={imgWip1} />
              </div>
              <div aria-hidden="true" className="absolute border-[#ededed] border-[1.081px] border-solid inset-0 rounded-[5.54px] shadow-[0px_124.345px_34.6px_0px_rgba(26,58,84,0),0px_80.013px_31.356px_0px_rgba(26,58,84,0.01),0px_44.332px_27.031px_0px_rgba(26,58,84,0.05),0px_19.463px_19.463px_0px_rgba(26,58,84,0.09),0px_5.406px_10.813px_0px_rgba(26,58,84,0.1)]" />
            </div>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[515.841px] left-[calc(50%+0.4px)] pointer-events-none rounded-[7.54px] top-[25px] w-[794.248px]" data-name="WIP">
          <div aria-hidden="true" className="absolute inset-0 rounded-[7.54px]">
            <div className="absolute inset-0 rounded-[7.54px]" style={{ backgroundImage: "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)" }} />
            <img alt="" className="absolute max-w-none object-cover rounded-[7.54px] size-full" src={imgWip2} />
          </div>
          <div aria-hidden="true" className="absolute border-[#ededed] border-[1.379px] border-solid inset-0 rounded-[7.54px] shadow-[0px_300px_84px_0px_rgba(26,58,84,0),0px_192px_77px_0px_rgba(26,58,84,0.01),0px_108px_65px_0px_rgba(26,58,84,0.04),0px_48px_48px_0px_rgba(26,58,84,0.07),0px_12px_26px_0px_rgba(26,58,84,0.08)]" />
        </div>
      </div>
      <div
        id="landing-hero"
        className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[24px] items-center left-1/2 top-[190px] w-[776px] scroll-mt-28"
      >
        <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[16px] items-center not-italic relative shrink-0 text-center w-full">
          <p className="bg-clip-text leading-[0] min-w-full relative shrink-0 text-[62px] text-[transparent] w-[min-content]" style={{ backgroundImage: "linear-gradient(135.275deg, rgb(36, 181, 248) 4.6217%, rgb(85, 33, 254) 148.53%)" }}>
            <span className="bg-clip-text font-['Sarina',sans-serif] font-normal leading-[1.04]" style={{ backgroundImage: "linear-gradient(135.275deg, rgb(36, 181, 248) 4.6217%, rgb(85, 33, 254) 148.53%)" }}>
              Continuum
            </span>
            <span className="leading-[1.04]">{` connects delivery with profitability.`}</span>
          </p>
          <p className="leading-[normal] relative shrink-0 text-[#606d76] text-[16px] w-[580px]">The operating system for modern software teams. Seamlessly bridge the gap between agile sprint planning, precise time tracking, and client invoicing.</p>
          <p className="-translate-x-1/2 absolute leading-[0] left-[388px] text-[#0b191f] text-[62px] top-0 w-[776px]">
            <span className="font-['Sarina',sans-serif] font-normal leading-[1.04] text-[rgba(11,25,31,0)]">Continuum</span>
            <span className="leading-[1.04] text-[rgba(11,25,31,0)]">{` `}</span>
            <span className="leading-[1.04]">connects delivery with profitability.</span>
          </p>
        </div>
        <ComponentBackgroundImageAndText text="Join Waitlist" />
      </div>
      <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0)] h-[453px] left-0 to-[#f9fafb] top-[1001px] w-[1512px]" />
      <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0)] h-[253px] left-0 to-[#f9fafb] top-[5384px] w-[1512px]" />
      <div className="absolute flex h-[453px] items-center justify-center left-0 top-[1359px] w-[1512px]">
        <div className="flex-none rotate-180">
          <div className="bg-gradient-to-b from-[rgba(255,255,255,0)] h-[453px] to-[#f9fafb] w-[1512px]" />
        </div>
      </div>
      <div className="absolute flex h-[985px] items-center justify-center left-0 top-[5637px] w-[1512px]">
        <div className="flex-none rotate-180">
          <div className="bg-gradient-to-b from-[rgba(255,255,255,0)] h-[985px] to-[#f9fafb] w-[1512px]" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#f9fafb] h-[1378px] left-1/2 top-[1458px] w-[1512px]" />
      <div className="absolute h-[378.896px] left-[-123.73px] top-[2248px] w-[1823.234px]">
        <div className="absolute inset-[-3.17%_0_-3.17%_-0.66%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1835.7 402.904">
            <path d={svgPaths.p296fcf40} id="Vector 12" stroke="var(--stroke-0, #E4EAEC)" strokeWidth="24" />
          </svg>
        </div>
      </div>
      <div
        id="landing-waitlist"
        className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[16px] items-center left-1/2 top-[1148px] w-[776px] scroll-mt-28"
      >
        <p className="font-['Satoshi:Medium',sans-serif] leading-[1.04] min-w-full not-italic relative shrink-0 text-[#0b191f] text-[62px] text-center w-[min-content]">Join the Waitlist</p>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#606d76] text-[16px] text-center w-[580px]">We’re building a unified space for sprint planning, frictionless time tracking, and instant invoicing-but we need your help to perfect it. Join our exclusive Beta program to get early access, test our core features, and tell us exactly what your team needs to do its best deep work.</p>
        <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-[476px]">
          <div className="bg-white flex-[1_0_0] h-[40px] min-h-px min-w-px relative rounded-[8px]" data-name="Component 27">
            <div aria-hidden="true" className="absolute border border-[#e9e9e9] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_7.928px_17.177px_0px_rgba(26,59,84,0.1)]" />
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center px-[16px] py-[8px] relative size-full">
                <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#252014] text-[14px] whitespace-nowrap">Email address</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[8px] h-[40px] items-center relative shrink-0">
            <Link
              to="/register"
              className="h-full relative rounded-[8px] shrink-0 no-underline bg-[#24b5f8] hover:bg-[#297ccb] transition-colors"
              data-name="Component 7"
            >
              <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_12px_3px_0px_rgba(45,154,249,0),0px_8px_3px_0px_rgba(45,154,249,0.03),0px_4px_3px_0px_rgba(45,154,249,0.11),0px_2px_2px_0px_rgba(45,154,249,0.19),0px_0px_1px_0px_rgba(45,154,249,0.21)]" />
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex gap-[6px] h-full items-center justify-center px-[16px] py-[8px] relative">
                  <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">Join Waitlist</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div
        id="landing-features"
        className="-translate-x-1/2 absolute content-start flex flex-wrap gap-[12px] items-start left-[calc(50%+12.5px)] shadow-[209px_356px_116px_0px_rgba(26,59,84,0),134px_228px_106px_0px_rgba(26,59,84,0.01),75px_128px_89px_0px_rgba(26,59,84,0.02),33px_57px_66px_0px_rgba(26,59,84,0.04),8px_14px_36px_0px_rgba(26,59,84,0.05)] top-[1518px] w-[1187px] scroll-mt-28"
      >
        <div className="content-stretch flex flex-col gap-[10px] h-[564px] items-center overflow-clip p-[48px] relative rounded-[36px] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] shrink-0 w-[700px]" style={{ backgroundImage: "linear-gradient(rgba(178, 230, 247, 0.48) 0%, rgba(253, 251, 247, 0.48) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
          <div className="-translate-x-1/2 absolute left-1/2 size-[700px] top-[40px]">
            <div className="absolute inset-[-52%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1428 1428">
                <g filter="url(#filter0_f_1_729)" id="Ellipse 13">
                  <circle cx="714" cy="714" fill="var(--fill-0, white)" r="350" />
                </g>
                <defs>
                  <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="1428" id="filter0_f_1_729" width="1428" x="0" y="0">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                    <feGaussianBlur result="effect1_foregroundBlur_1_729" stdDeviation="182" />
                  </filter>
                </defs>
              </svg>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[36px] items-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[24px] items-center not-italic relative shrink-0 text-center">
              <p className="leading-[0] relative shrink-0 text-[#0b191f] text-[38.319px] tracking-[-0.48px] tracking-[-1.1496px] whitespace-nowrap">
                <span className="leading-[1.04]">{`Frictionless `}</span>
                <span className="font-['Satoshi:Bold',sans-serif] leading-[1.04]">Time Logging</span>
              </p>
              <p className="leading-[26px] relative shrink-0 text-[#606d76] text-[16px] w-[440px]">Log hours without leaving your workflow. Track time directly on tasks or retroactively fill your week in seconds, not hours.</p>
            </div>
          </div>
          <div className="absolute h-[268.501px] left-1/2 -translate-x-1/2 top-[262px] w-[750px]">
            <div className="absolute flex flex-wrap justify-center gap-[8px] items-center left-1/2 -translate-x-1/2 top-[94px] w-[750px]">
              <BackgroundImageAndText text="Create interactive prototypes" />
              <BackgroundImageAndText text="Conduct usability testing" />
              <BackgroundImageAndText text="Build user flow diagrams" />
              <BackgroundImageAndText text="Implement accessibility standards" />
              <BackgroundImageAndText text="Create style guide documentation" />
              <BackgroundImageAndText text="Ticket admin" />
            </div>
            <div className="-translate-x-1/2 absolute h-[21px] left-[calc(50%-0.5px)] top-[71px] w-0">
              <div className="absolute inset-[-4.76%_-1px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 23">
                  <path d="M1 1V22" id="Vector 21" stroke="var(--stroke-0, #EB4335)" strokeDasharray="9 9" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <div className="-translate-x-1/2 absolute h-[17px] left-[calc(50%-0.5px)] top-[170px] w-0">
              <div className="absolute inset-[-5.88%_-5.33px_-31.37%_-5.33px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 23.3333">
                  <path d={svgPaths.p163b5400} fill="url(#paint0_linear_1_736)" id="Vector 22" />
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_736" x1="5.83333" x2="5.83333" y1="1" y2="18">
                      <stop stopColor="#EB4335" />
                      <stop offset="1" stopColor="#FC5244" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="-translate-x-1/2 absolute bg-white left-1/2 rounded-[69.461px] top-0 w-[530px]" data-name="Component 154">
              <div className="content-stretch flex flex-col gap-[9.749px] items-start overflow-clip pl-[25.871px] pr-[8.628px] py-[8.628px] relative rounded-[inherit] w-full">
                <div className="content-stretch flex flex-col gap-[14.623px] items-center justify-center relative rounded-[1217.391px] shrink-0 w-full">
                  <BackgroundImage3>
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative">
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[17.061px] whitespace-nowrap">00:00:00</p>
                      <div className="content-stretch flex gap-[2.437px] items-start relative shrink-0 w-full">
                        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14.623px] whitespace-nowrap">Select ticket</p>
                        <LucideChevronDownBackgroundImage>
                          <path d={svgPaths.p139eb600} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.62481" />
                        </LucideChevronDownBackgroundImage>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[10.78px] items-center justify-center p-[12.936px] relative rounded-[1076.932px] shrink-0 size-[51.744px]" data-name="Component 139">
                      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[rgba(235,67,53,0)] left-[calc(50%+0.41px)] rounded-[25.872px] size-[51.744px] top-[calc(50%+0.41px)]">
                        <div aria-hidden="true" className="absolute border-[#8a8f91] border-[1.219px] border-solid inset-0 pointer-events-none rounded-[25.872px]" />
                      </div>
                      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.15px)] size-[46px] top-[calc(50%+0.5px)]" data-name="lucide/square">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 46 46">
                          <g id="lucide/square">
                            <rect fill="var(--fill-0, #EB4335)" height="46" rx="23" width="46" />
                            <path d={svgPaths.p1a3980} fill="var(--fill-0, #EB4335)" id="Vector" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </BackgroundImage3>
                </div>
              </div>
              <div aria-hidden="true" className="absolute border-[#ebedee] border-[1.078px] border-solid inset-0 pointer-events-none rounded-[69.461px] shadow-[0px_69.369px_41.622px_0px_rgba(26,59,84,0.05),0px_31.051px_31.051px_0px_rgba(26,59,84,0.09),0px_7.928px_17.177px_0px_rgba(26,59,84,0.1)]" />
            </div>
            <div className="-translate-x-1/2 absolute bg-white left-1/2 rounded-[69.461px] top-[200px] w-[530px]" data-name="Component 144">
              <div className="content-stretch flex flex-col gap-[9.749px] items-start overflow-clip pl-[25.871px] pr-[8.628px] py-[8.628px] relative rounded-[inherit] w-full">
                <div className="content-stretch flex flex-col gap-[14.623px] items-center justify-center relative rounded-[1217.391px] shrink-0 w-full">
                  <BackgroundImage3>
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative">
                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[17.061px] whitespace-nowrap">32:10:12</p>
                      <div className="content-stretch flex gap-[2.437px] items-start relative shrink-0 w-full">
                        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic overflow-hidden relative shrink-0 text-[#606d76] text-[14.623px] text-ellipsis whitespace-nowrap">Implement accessibility standards</p>
                        <LucideChevronDownBackgroundImage>
                          <path d={svgPaths.p1d7696a0} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.62481" />
                        </LucideChevronDownBackgroundImage>
                      </div>
                    </div>
                    <button className="cursor-pointer relative rounded-[883.738px] shrink-0 size-[51.744px]" data-name="Component 139">
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex gap-[10.78px] items-center justify-center p-[12.936px] relative size-full">
                          <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[rgba(235,67,53,0.1)] left-1/2 rounded-[21.231px] size-[51.744px] top-1/2" />
                          <div className="relative shrink-0 size-[21.56px]" data-name="lucide/square">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5602 21.5602">
                              <g id="lucide/square">
                                <path d={svgPaths.p3d7cf080} fill="var(--fill-0, #EB4335)" id="Vector" stroke="var(--stroke-0, #EB4335)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.79668" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  </BackgroundImage3>
                </div>
              </div>
              <div aria-hidden="true" className="absolute border-[#ebedee] border-[1.078px] border-solid inset-0 pointer-events-none rounded-[69.461px] shadow-[0px_69.37px_41.622px_0px_rgba(26,59,84,0.05),0px_31.051px_31.051px_0px_rgba(26,59,84,0.09),0px_7.928px_17.177px_0px_rgba(26,59,84,0.1)]" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[24px] h-[564px] items-center overflow-clip p-[48px] relative rounded-[36px] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] shrink-0" style={{ backgroundImage: "linear-gradient(-17.8066deg, rgba(178, 230, 247, 0.39) 177.11%, rgba(253, 251, 247, 0.39) 89.39%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
          <div className="-translate-x-1/2 absolute left-[calc(50%-38.5px)] size-[230px] top-[255px]">
            <div className="absolute inset-[-65.22%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 530 530">
                <g filter="url(#filter0_f_1_655)" id="Ellipse 13">
                  <circle cx="265" cy="265" fill="var(--fill-0, white)" r="115" />
                </g>
                <defs>
                  <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="530" id="filter0_f_1_655" width="530" x="0" y="0">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                    <feGaussianBlur result="effect1_foregroundBlur_1_655" stdDeviation="75" />
                  </filter>
                </defs>
              </svg>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0">
            <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[24px] items-center not-italic relative shrink-0 text-center">
              <p className="leading-[1.04] relative shrink-0 text-[#0b191f] text-[38.319px] w-[377px]">Integrated Invoicing</p>
              <p className="leading-[26px] relative shrink-0 text-[#606d76] text-[16px] w-[332px]">Turn billable hours into professional invoices with one click.</p>
            </div>
          </div>
          <div className="-translate-x-1/2 absolute flex h-[513.342px] items-center justify-center left-[calc(50%+71.4px)] top-[157px] w-[957.794px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "1492" } as React.CSSProperties}>
            <div className="flex-none rotate-[-17.13deg] scale-y-92 skew-x-[22.42deg]">
              <div className="h-[379.522px] relative w-[749.361px]">
                <div className="absolute flex h-[580.094px] items-center justify-center left-[-16.23px] top-[-162.57px] w-[721.685px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
                  <div className="flex-none rotate-[20.91deg] scale-x-89 scale-y-121 skew-x-[-12.77deg]">
                    <div className="h-[395px] relative w-[539px]">
                      <div className="absolute inset-[-0.17%_0_-0.13%_0]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 540.061 396.173">
                          <path d={svgPaths.p3341a900} fill="url(#paint0_linear_1_688)" id="Vector 20" stroke="var(--stroke-0, white)" strokeDasharray="9 9" strokeLinecap="round" />
                          <defs>
                            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_688" x1="226.526" x2="483.026" y1="89.1665" y2="377.166">
                              <stop stopColor="#F9FAFB" />
                              <stop offset="1" stopColor="#F9FAFB" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute content-stretch flex flex-col items-center left-[215.92px] shadow-[0px_218.822px_61.24px_0px_rgba(26,59,84,0),0px_139.658px_56.012px_0px_rgba(26,59,84,0.01),0px_78.417px_47.05px_0px_rgba(26,59,84,0.05),0px_35.101px_35.101px_0px_rgba(26,59,84,0.09),0px_8.962px_19.418px_0px_rgba(26,59,84,0.1)] top-[225.47px] w-[318.15px]" data-name="Create Task">
                  <div className="relative rounded-bl-[9.273px] rounded-br-[9.27px] rounded-tl-[9.276px] rounded-tr-[9.273px] shrink-0 w-full">
                    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
                      <div className="relative shrink-0 w-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)" }}>
                        <div className="content-stretch flex flex-col gap-[13.909px] items-start px-[20.864px] py-[13.909px] relative w-full">
                          <div className="content-stretch flex flex-col gap-[13.909px] items-start relative shrink-0 w-full">
                            <div className="content-stretch flex flex-col gap-[9.273px] items-center justify-end relative shrink-0 w-full">
                              <div className="content-stretch flex flex-col gap-[2.318px] items-start relative shrink-0 w-full" data-name="Time Range">
                                <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[8.114px] whitespace-nowrap">Project</p>
                                <ComponentBackgroundImage>
                                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[9.273px] whitespace-nowrap">Set up high-fidelity prototypes with conditional logic</p>
                                  <BackgroundImage10>
                                    <g id="lucide/chevron-down">
                                      <path d={svgPaths.p2c0a3380} id="Vector" stroke="var(--stroke-0, #252014)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.77274" />
                                    </g>
                                  </BackgroundImage10>
                                </ComponentBackgroundImage>
                              </div>
                              <div className="content-stretch flex gap-[9.273px] items-start relative shrink-0 w-full">
                                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2.318px] items-start min-h-px min-w-px relative" data-name="Date Range">
                                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[8.114px] whitespace-nowrap">Date Range</p>
                                  <ComponentBackgroundImage>
                                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[9.273px] whitespace-nowrap">10/10/2025-10/10/2025</p>
                                    <BackgroundImage10>
                                      <g id="lucide/calendar">
                                        <path d={svgPaths.p19165f00} id="Vector" stroke="var(--stroke-0, #252014)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.77274" />
                                      </g>
                                    </BackgroundImage10>
                                  </ComponentBackgroundImage>
                                </div>
                                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2.318px] items-start min-h-px min-w-px relative" data-name="Date Range">
                                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[8.114px] whitespace-nowrap">Time Range</p>
                                  <BackgroundImage5>
                                    <div className="content-stretch flex items-center px-[9.273px] py-[6.955px] relative w-full">
                                      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#0b191f] text-[9.273px] whitespace-nowrap">09:00 AM - 10:00 AM</p>
                                    </div>
                                  </BackgroundImage5>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex h-[22.591px] items-center justify-end relative shrink-0 w-full">
                              <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
                                <button className="cursor-pointer flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[4.636px]" data-name="Component 4" style={{ backgroundImage: "linear-gradient(176.304deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)" }}>
                                  <div className="flex flex-row items-center justify-center size-full">
                                    <div className="content-stretch flex gap-[4.636px] items-center justify-center px-[9.273px] py-[5.796px] relative size-full">
                                      <BackgroundImage10>
                                        <g id="lucide/plus">
                                          <path d={svgPaths.pf86f000} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.823347" />
                                        </g>
                                      </BackgroundImage10>
                                      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[8.114px] text-left text-white whitespace-nowrap">Log Time</p>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div aria-hidden="true" className="absolute border-[#f5f5f5] border-[0.58px] border-solid inset-0 pointer-events-none rounded-bl-[9.273px] rounded-br-[9.27px] rounded-tl-[9.276px] rounded-tr-[9.273px]" />
                  </div>
                </div>
                <div className="absolute bg-white left-0 rounded-[7.936px] top-0 w-[116.56px]">
                  <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
                    <div className="bg-[#1a3b54] relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col gap-[11.904px] items-start pb-[7.936px] pl-[11.904px] pr-[7.936px] pt-[11.904px] relative w-full">
                        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                          <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                            <div className="content-stretch flex items-center opacity-0 relative shrink-0">
                              <BackgroundImage8>
                                <g clipPath="url(#clip0_1_673)" id="lucide/scroll-text">
                                  <path d={svgPaths.p93a6900} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.496" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_673">
                                    <rect fill="white" height="11.904" width="11.904" />
                                  </clipPath>
                                </defs>
                              </BackgroundImage8>
                            </div>
                          </div>
                          <div className="content-stretch flex items-start relative shrink-0">
                            <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                              <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                                <LucideEllipsisBackgroundImage />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col gap-[7.936px] items-start relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis w-full">
                            <p className="overflow-hidden relative shrink-0 text-[5.952px] text-white whitespace-nowrap">Period</p>
                            <p className="overflow-hidden relative shrink-0 text-[6.944px] text-[rgba(255,255,255,0.62)] whitespace-pre">{`01 Feb  - 28 Feb 2026`}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <BackgroundImage4>
                      <BackgroundImage text="Data Analytics Platform Launch" text1="Data Insights Co." />
                      <BackgroundImage2 />
                      <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                        <BackgroundImage1 text="Invoice ID" text1="INV-2026-03" />
                        <div className="content-stretch flex items-start relative shrink-0">
                          <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                              <BackgroundImage7>
                                <g clipPath="url(#clip0_1_702)" id="lucide/download">
                                  <path d={svgPaths.p36f37500} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.744" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_702">
                                    <rect fill="white" height="7.936" width="7.936" />
                                  </clipPath>
                                </defs>
                              </BackgroundImage7>
                            </div>
                          </div>
                        </div>
                      </div>
                    </BackgroundImage4>
                  </div>
                  <div aria-hidden="true" className="absolute border-[#ebedee] border-[0.496px] border-solid inset-0 pointer-events-none rounded-[7.936px] shadow-[0px_21.824px_5.952px_0px_rgba(15,27,31,0),0px_13.888px_5.456px_0px_rgba(15,27,31,0.01),0px_7.936px_4.96px_0px_rgba(15,27,31,0.02),0px_3.472px_3.472px_0px_rgba(15,27,31,0.03),0px_0.992px_1.984px_0px_rgba(15,15,31,0.04)]" />
                </div>
                <BackgroundImage12 additionalClassNames="left-[126.56px]">
                  <BackgroundImage11>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                        <div className="content-stretch flex items-center opacity-0 relative shrink-0">
                          <BackgroundImage8>
                            <g clipPath="url(#clip0_1_759)" id="lucide/scroll-text">
                              <path d={svgPaths.p2639f400} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.496" />
                            </g>
                            <defs>
                              <clipPath id="clip0_1_759">
                                <rect fill="white" height="11.904" width="11.904" />
                              </clipPath>
                            </defs>
                          </BackgroundImage8>
                        </div>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideEllipsisBackgroundImage1 />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[7.936px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis w-full">
                        <p className="overflow-hidden relative shrink-0 text-[#606d76] text-[5.952px] whitespace-nowrap">Period</p>
                        <p className="overflow-hidden relative shrink-0 text-[6.944px] text-[rgba(96,109,118,0.62)] whitespace-pre">{`01 Mar  - 31 Mar 2026`}</p>
                      </div>
                    </div>
                  </BackgroundImage11>
                  <BackgroundImage4>
                    <BackgroundImage text="User Experience Research" text1="Insightful Designs Inc." />
                    <BackgroundImage2 />
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                      <BackgroundImage1 text="Invoice ID" text1="INV-2026-04" />
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <BackgroundImage7>
                              <g clipPath="url(#clip0_1_738)" id="lucide/download">
                                <path d={svgPaths.p2321f700} id="Vector" stroke="var(--stroke-0, #606D76)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.744" />
                              </g>
                              <defs>
                                <clipPath id="clip0_1_738">
                                  <rect fill="white" height="7.936" width="7.936" />
                                </clipPath>
                              </defs>
                            </BackgroundImage7>
                          </div>
                        </div>
                      </div>
                    </div>
                  </BackgroundImage4>
                </BackgroundImage12>
                <BackgroundImage12 additionalClassNames="left-[379.68px]">
                  <BackgroundImage11>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                        <div className="content-stretch flex items-center opacity-0 relative shrink-0">
                          <LucideScrollTextBackgroundImage />
                        </div>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideEllipsisBackgroundImage1 />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[7.936px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis w-full">
                        <p className="overflow-hidden relative shrink-0 text-[#606d76] text-[5.952px] whitespace-nowrap">Period</p>
                        <p className="overflow-hidden relative shrink-0 text-[6.944px] text-[rgba(96,109,118,0.62)] whitespace-pre">{`01 May  - 31 May 2026`}</p>
                      </div>
                    </div>
                  </BackgroundImage11>
                  <BackgroundImage4>
                    <BackgroundImage text="Website Revamp Project" text1="Creative Solutions Group" />
                    <BackgroundImage2 />
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                      <BackgroundImage1 text="Invoice ID" text1="INV-2026-06" />
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideDownloadBackgroundImage />
                          </div>
                        </div>
                      </div>
                    </div>
                  </BackgroundImage4>
                </BackgroundImage12>
                <BackgroundImage12 additionalClassNames="left-[506.24px]">
                  <BackgroundImage11>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                        <div className="content-stretch flex items-center opacity-0 relative shrink-0">
                          <LucideScrollTextBackgroundImage />
                        </div>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideEllipsisBackgroundImage1 />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[7.936px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis w-full">
                        <p className="overflow-hidden relative shrink-0 text-[#606d76] text-[5.952px] whitespace-nowrap">Period</p>
                        <p className="overflow-hidden relative shrink-0 text-[6.944px] text-[rgba(96,109,118,0.62)] whitespace-pre">{`01 June  - 30 June 2026`}</p>
                      </div>
                    </div>
                  </BackgroundImage11>
                  <BackgroundImage4>
                    <BackgroundImage text="Mobile App Development" text1="Tech Innovations LLC" />
                    <BackgroundImage2 />
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                      <BackgroundImage1 text="Invoice ID" text1="INV-2026-07" />
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideDownloadBackgroundImage />
                          </div>
                        </div>
                      </div>
                    </div>
                  </BackgroundImage4>
                </BackgroundImage12>
                <BackgroundImage12 additionalClassNames="left-[632.8px]">
                  <BackgroundImage11>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                        <div className="content-stretch flex items-center opacity-0 relative shrink-0">
                          <LucideScrollTextBackgroundImage />
                        </div>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideEllipsisBackgroundImage1 />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[7.936px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis w-full">
                        <p className="overflow-hidden relative shrink-0 text-[#606d76] text-[5.952px] whitespace-nowrap">Period</p>
                        <p className="overflow-hidden relative shrink-0 text-[6.944px] text-[rgba(96,109,118,0.62)] whitespace-pre">{`01 July  - 31 July 2026`}</p>
                      </div>
                    </div>
                  </BackgroundImage11>
                  <BackgroundImage4>
                    <BackgroundImage text="E-commerce Platform Launch" text1="Digital Commerce Corp" />
                    <BackgroundImage2 />
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                      <BackgroundImage1 text="Invoice ID" text1="INV-2026-08" />
                      <div className="content-stretch flex items-start relative shrink-0">
                        <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                            <LucideDownloadBackgroundImage />
                          </div>
                        </div>
                      </div>
                    </div>
                  </BackgroundImage4>
                </BackgroundImage12>
                <div className="absolute h-[25.5px] left-[58px] top-[164px] w-[631px]">
                  <div className="absolute inset-[-5.85%_-0.94%_-77.82%_-0.94%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 642.912 46.836">
                      <g filter="url(#filter0_dddd_1_657)" id="Vector 13">
                        <path d={svgPaths.p2ee8a200} stroke="var(--stroke-0, #E4EAEC)" strokeDasharray="9 9" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                      <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="46.836" id="filter0_dddd_1_657" width="642.912" x="0" y="5.96046e-08">
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="0.992" />
                          <feGaussianBlur stdDeviation="0.992" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.0588235 0 0 0 0 0.121569 0 0 0 0.04 0" />
                          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_657" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="3.472" />
                          <feGaussianBlur stdDeviation="1.736" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.03 0" />
                          <feBlend in2="effect1_dropShadow_1_657" mode="normal" result="effect2_dropShadow_1_657" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="7.936" />
                          <feGaussianBlur stdDeviation="2.48" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.02 0" />
                          <feBlend in2="effect2_dropShadow_1_657" mode="normal" result="effect3_dropShadow_1_657" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="13.888" />
                          <feGaussianBlur stdDeviation="2.728" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.01 0" />
                          <feBlend in2="effect3_dropShadow_1_657" mode="normal" result="effect4_dropShadow_1_657" />
                          <feBlend in="SourceGraphic" in2="effect4_dropShadow_1_657" mode="normal" result="shape" />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                </div>
                <Frame379BackgroundImage additionalClassNames="left-[185px]" />
                <div className="absolute h-[25px] left-[311px] top-[164px] w-0">
                  <BackgroundImage6>
                    <g filter="url(#filter0_dddd_1_757)" id="Vector 15">
                      <path d="M5.956 1.492V26.492" stroke="var(--stroke-0, #24B5F8)" strokeDasharray="9 9" strokeLinecap="round" />
                    </g>
                    <defs>
                      <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="46.336" id="filter0_dddd_1_757" width="11.912" x="0" y="5.96046e-08">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                        <feOffset dy="0.992" />
                        <feGaussianBlur stdDeviation="0.992" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.0588235 0 0 0 0 0.121569 0 0 0 0.04 0" />
                        <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_757" />
                        <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                        <feOffset dy="3.472" />
                        <feGaussianBlur stdDeviation="1.736" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.03 0" />
                        <feBlend in2="effect1_dropShadow_1_757" mode="normal" result="effect2_dropShadow_1_757" />
                        <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                        <feOffset dy="7.936" />
                        <feGaussianBlur stdDeviation="2.48" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.02 0" />
                        <feBlend in2="effect2_dropShadow_1_757" mode="normal" result="effect3_dropShadow_1_757" />
                        <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                        <feOffset dy="13.888" />
                        <feGaussianBlur stdDeviation="2.728" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.01 0" />
                        <feBlend in2="effect3_dropShadow_1_757" mode="normal" result="effect4_dropShadow_1_757" />
                        <feBlend in="SourceGraphic" in2="effect4_dropShadow_1_757" mode="normal" result="shape" />
                      </filter>
                    </defs>
                  </BackgroundImage6>
                </div>
                <div className="absolute h-[35px] left-[375px] top-[190px] w-0">
                  <div className="absolute inset-[-2.83%_-5.96px_-55.27%_-5.96px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.912 55.336">
                      <g filter="url(#filter0_dddd_1_651)" id="Vector 18">
                        <path d="M5.956 0.992V35.992" stroke="var(--stroke-0, #24B5F8)" strokeDasharray="9 9" />
                      </g>
                      <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="55.336" id="filter0_dddd_1_651" width="11.912" x="0" y="0">
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="0.992" />
                          <feGaussianBlur stdDeviation="0.992" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.0588235 0 0 0 0 0.121569 0 0 0 0.04 0" />
                          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_651" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="3.472" />
                          <feGaussianBlur stdDeviation="1.736" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.03 0" />
                          <feBlend in2="effect1_dropShadow_1_651" mode="normal" result="effect2_dropShadow_1_651" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="7.936" />
                          <feGaussianBlur stdDeviation="2.48" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.02 0" />
                          <feBlend in2="effect2_dropShadow_1_651" mode="normal" result="effect3_dropShadow_1_651" />
                          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                          <feOffset dy="13.888" />
                          <feGaussianBlur stdDeviation="2.728" />
                          <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.105882 0 0 0 0 0.121569 0 0 0 0.01 0" />
                          <feBlend in2="effect3_dropShadow_1_651" mode="normal" result="effect4_dropShadow_1_651" />
                          <feBlend in="SourceGraphic" in2="effect4_dropShadow_1_651" mode="normal" result="shape" />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                </div>
                <Frame379BackgroundImage additionalClassNames="left-[437px]" />
                <Frame379BackgroundImage additionalClassNames="left-[563px]" />
                <div className="absolute flex h-[39.238px] items-center justify-center left-[310.5px] top-[170.02px] w-[64.386px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
                  <div className="flex-none rotate-[20.91deg] scale-x-89 scale-y-121 skew-x-[-12.77deg]">
                    <div className="h-[19px] relative w-[61.5px]">
                      <div className="absolute inset-[-2.51%_-0.24%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 61.7952 19.9554">
                          <path d={svgPaths.p19b12a40} id="Vector 19" stroke="var(--stroke-0, #24B5F8)" strokeDasharray="9 9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bg-white left-[253.12px] rounded-[7.936px] top-0 w-[116.56px]">
                  <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
                    <div className="relative shrink-0 w-full" style={{ backgroundImage: "linear-gradient(156.99deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(26, 59, 84) 0%, rgb(26, 59, 84) 100%), linear-gradient(90deg, rgb(252, 249, 243) 0%, rgb(252, 249, 243) 100%)" }}>
                      <div className="content-stretch flex flex-col gap-[11.904px] items-start pb-[7.936px] pl-[11.904px] pr-[7.936px] pt-[11.904px] relative w-full">
                        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                          <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                            <div className="content-stretch flex items-center opacity-0 relative shrink-0">
                              <BackgroundImage8>
                                <g clipPath="url(#clip0_1_705)" id="lucide/scroll-text">
                                  <path d={svgPaths.p249ba180} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.496" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_705">
                                    <rect fill="white" height="11.904" width="11.904" />
                                  </clipPath>
                                </defs>
                              </BackgroundImage8>
                            </div>
                          </div>
                          <div className="content-stretch flex items-start relative shrink-0">
                            <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                              <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                                <LucideEllipsisBackgroundImage />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col gap-[7.936px] items-start relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[1.984px] items-start leading-[normal] not-italic relative shrink-0 text-ellipsis text-white w-full">
                            <p className="overflow-hidden relative shrink-0 text-[5.952px] whitespace-nowrap">Period</p>
                            <p className="opacity-70 overflow-hidden relative shrink-0 text-[6.944px] whitespace-pre">{`01 Apr  - 30 Apr 2026`}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <BackgroundImage4>
                      <BackgroundImage text="Mobile App Development" text1="Tech Innovators LLC" />
                      <BackgroundImage2 />
                      <div className="content-stretch flex items-end justify-between relative shrink-0 w-full">
                        <BackgroundImage1 text="Invoice ID" text1="INV-2026-05" />
                        <div className="content-stretch flex items-start relative shrink-0">
                          <div className="content-stretch flex gap-[3.968px] items-center relative shrink-0">
                            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[11.904px]">
                              <BackgroundImage7>
                                <g clipPath="url(#clip0_1_640)" id="lucide/download">
                                  <path d={svgPaths.p246e3300} id="Vector" stroke="var(--stroke-0, #2E98F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.744" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_1_640">
                                    <rect fill="white" height="7.936" width="7.936" />
                                  </clipPath>
                                </defs>
                              </BackgroundImage7>
                            </div>
                          </div>
                        </div>
                      </div>
                    </BackgroundImage4>
                  </div>
                  <div aria-hidden="true" className="absolute border border-[#ebedee] border-solid inset-[-1px] pointer-events-none rounded-[8.936px] shadow-[0px_218.822px_61.24px_0px_rgba(26,59,84,0),0px_139.658px_56.012px_0px_rgba(26,59,84,0.01),0px_78.417px_47.05px_0px_rgba(26,59,84,0.05),0px_35.101px_35.101px_0px_rgba(26,59,84,0.09),0px_8.962px_19.418px_0px_rgba(26,59,84,0.1)]" />
                </div>
                <div className="absolute h-[159.714px] left-[253.06px] rounded-[6.22px] top-[2.25px] w-[115.829px]">
                  <div aria-hidden="true" className="absolute border-[1.036px] border-[rgba(36,181,248,0)] border-solid inset-[-1.036px] pointer-events-none rounded-[7.256px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[36px] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]" style={{ backgroundImage: "linear-gradient(rgba(178, 247, 194, 0.48) 0%, rgba(253, 251, 247, 0.48) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
          <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[24px] items-start justify-center p-[48px] relative w-full">
              <div className="-translate-x-1/2 absolute flex h-[824.007px] items-center justify-center left-[calc(50%+451.5px)] top-[-191px] w-[1603.272px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
                <div className="flex-none rotate-[14.7deg]">
                  <div className="h-[448px] relative w-[1540px]">
                    <div className="absolute inset-[-81.25%_-23.64%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2268 1176">
                        <g filter="url(#filter0_f_1_638)" id="Ellipse 14">
                          <ellipse cx="1134" cy="588" fill="var(--fill-0, white)" rx="770" ry="224" />
                        </g>
                        <defs>
                          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="1176" id="filter0_f_1_638" width="2268" x="0" y="0">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feGaussianBlur result="effect1_foregroundBlur_1_638" stdDeviation="182" />
                          </filter>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[36px] items-start relative shrink-0">
                <div className="content-stretch flex flex-col font-['Satoshi:Medium',sans-serif] gap-[24px] items-start not-italic relative shrink-0">
                  <p className="leading-[1.04] relative shrink-0 text-[#0b191f] text-[38.319px] text-center whitespace-nowrap">Real-time Project Health</p>
                  <p className="leading-[26px] relative shrink-0 text-[#606d76] text-[16px] w-[332px]">{`Never be surprised by a missed deadline. Track velocity and see instantly if a project is "Project On Track" or "At Risk."`}</p>
                </div>
                <ComponentBackgroundImageAndText text="Start for free" additionalClassNames="opacity-0" asLink={false} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center left-[723px] px-[22.072px] top-[65.04px]">
                <div className="h-[161.079px] relative shrink-0 w-[322.158px]">
                  <div className="absolute inset-[-4.85%_-2.43%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 337.792 176.713">
                      <g id="Frame 273">
                        <path d={svgPaths.p24b83740} id="Ellipse 6" stroke="var(--stroke-0, #E4EAEC)" strokeLinecap="round" strokeWidth="15.6342" />
                        <g id="Ellipse 9">
                          <mask fill="white" id="path-2-inside-1_1_725" />
                          <path d={svgPaths.p24752ef0} fill="var(--stroke-0, #E4EAEC)" mask="url(#path-2-inside-1_1_725)" />
                          <path d={svgPaths.p24752ef0} fill="var(--stroke-1, #6EC679)" mask="url(#path-2-inside-1_1_725)" />
                          <g clipPath="url(#paint0_angular_1_725_clip_path)" data-figma-skip-parse="true" mask="url(#path-2-inside-1_1_725)">
                            <g transform="matrix(0 0.0805395 -0.161079 0 168.896 88.3566)" />
                          </g>
                          <path d={svgPaths.p24752ef0} data-figma-gradient-fill="{'type':'GRADIENT_ANGULAR','stops':[{'color':{'r':0.43137255311012268,'g':0.77647060155868530,'b':0.47450980544090271,'a':1.0},'position':0.0},{'color':{'r':0.13255813717842102,'g':0.94999998807907104,'b':0.42418602108955383,'a':1.0},'position':1.0}],'stopsVar':[{'color':{'r':0.43137255311012268,'g':0.77647060155868530,'b':0.47450980544090271,'a':1.0},'position':0.0},{'color':{'r':0.13255813717842102,'g':0.94999998807907104,'b':0.42418602108955383,'a':1.0},'position':1.0}],'transform':{'m00':6.1571956571932623e-14,'m01':-322.15792846679688,'m02':329.97503662109375,'m10':161.07896423339844,'m11':8.4257755395174272e-14,'m12':7.8170919418334961},'opacity':1.0,'blendMode':'NORMAL','visible':true}" mask="url(#path-2-inside-1_1_725)" />
                        </g>
                      </g>
                      <defs>
                        <clipPath id="paint0_angular_1_725_clip_path">
                          <path d={svgPaths.p24752ef0} mask="url(#path-2-inside-1_1_725)" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>
                <p className="absolute font-['Satoshi:Regular',sans-serif] leading-[normal] left-[calc(50%-84.75px)] not-italic overflow-hidden text-[#0b191f] text-[65.024px] text-ellipsis top-[45.06px] whitespace-nowrap">100%</p>
                <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[calc(50%-79.23px)] not-italic overflow-hidden text-[#13a82e] text-[22.072px] text-ellipsis top-[146.23px] tracking-[-0.2207px] whitespace-nowrap">Project on track</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute content-stretch flex gap-[314px] items-center justify-center left-[calc(50%+0.5px)] top-[28px]">
        <div className="content-stretch flex flex-col items-center relative shrink-0">
          <p className="font-['Sarina',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#0b191f] text-[21.405px] text-center tracking-[-0.4281px] whitespace-nowrap">Continuum</p>
        </div>
        <nav
          aria-label="Page sections"
          className="content-stretch flex font-['Satoshi:Medium',sans-serif] gap-[51px] items-center leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] text-center whitespace-nowrap"
        >
          <span className="relative shrink-0 cursor-default select-none">
            Overview
          </span>
          <span className="relative shrink-0 cursor-default select-none">
            Waitlist
          </span>
          <span className="relative shrink-0 cursor-default select-none">
            Features
          </span>
          <span className="relative shrink-0 cursor-default select-none">
            Contact
          </span>
        </nav>
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
          <ComponentBackgroundImageAndText1 text="Join Waitlist" />
        </div>
      </div>
      <div
        id="landing-footer"
        className="absolute content-stretch flex flex-col items-center left-[137px] not-italic text-center top-[2476px] whitespace-nowrap scroll-mt-28"
      >
        <p className="font-['Sarina',sans-serif] font-normal leading-[47.662px] relative shrink-0 text-[#0b191f] text-[42.509px] tracking-[-0.8502px]">Continuum</p>
        <p className="font-['Sathu:Regular',sans-serif] leading-[normal] opacity-80 relative shrink-0 text-[#252014] text-[15.458px] tracking-[-0.1546px]">Time track with one click.</p>
      </div>
      <div className="absolute content-stretch flex font-['Satoshi:Medium',sans-serif] gap-[51px] items-center leading-[normal] left-[593px] not-italic text-[#606d76] text-[16px] text-center top-[2499px] whitespace-nowrap">
        <p className="opacity-0 relative shrink-0">Product</p>
        <p className="opacity-0 relative shrink-0">Heading 2</p>
        <p className="opacity-0 relative shrink-0">Heading 3</p>
      </div>
      <div className="absolute content-stretch flex gap-[8px] items-center left-[1272px] top-[2497px]">
        <ComponentBackgroundImageAndText1 text="Join Waitlist" />
      </div>
      <div className="absolute content-stretch flex items-center left-[159px] top-[1794px]">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#eb4335] left-1/2 mix-blend-color-burn rounded-[4px] size-[8px] top-1/2" />
        <div className="bg-[#eb4335] rounded-[999px] shrink-0 size-[2px]" />
      </div>
    </div>
  );
}
