import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

const imgEfficiencyArc = mcpAsset("a66a3896-7a75-4ab0-8590-1a9153d1131d");
const imgGaugeIndicator = mcpAsset("526dd3fc-a323-411f-a999-20f981098020");
const imgTasksArc = mcpAsset("496742c5-9223-4416-adc2-deff7ef9f49b");
const imgCommitsSeg1 = mcpAsset("f2dd3b1a-f123-4e62-b25a-81ba164cab8b");
const imgCommitsFrame = mcpAsset("16ac1dec-3035-4bdb-a771-8def8c26b0cc");
const imgCommitsSeg2 = mcpAsset("049c11c9-ae20-4c8a-9053-7f6e83daccdb");
const imgLegendShipped = mcpAsset("07b7126a-5203-4677-9754-7af36c03acb9");
const imgLegendProgress = mcpAsset("a8cfd688-142f-4eda-ad11-95db12443984");

export type WelcomeMetricsRowProps = {
  empty?: boolean;
};

/** Welcome Continuum demo metrics row — static Figma images with hardcoded mock data. */
export function WelcomeMetricsRow({ empty = false }: WelcomeMetricsRowProps) {
  return (
    <div
      data-tour="welcome-metrics-row"
      className={`relative mx-auto flex w-full max-w-[815px] shrink-0 flex-wrap items-center rounded-[12px] bg-white sm:gap-x-10 ${
        empty ? "justify-between gap-x-6 gap-y-6" : "justify-center gap-x-8 gap-y-6"
      }`}
      data-name="Welcome metrics"
      data-node-id="11:5683"
    >
      {/* ---------- Efficiency Rate ---------- */}
      <div className="relative flex shrink-0 items-center gap-6" data-node-id="11:5685">
        <div className="relative h-[81.592px] w-[82.864px] shrink-0" data-node-id="11:5686">
          <p
            className="absolute top-[18px] left-1/2 z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[32px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis"
            data-node-id="11:5687"
          >
            {empty ? "0" : "1.17"}
          </p>
          <div
            className={`absolute top-0 left-0 h-[66.484px] w-[82.864px] ${empty ? "opacity-[0.42] grayscale" : ""}`}
            data-node-id="11:5688"
          >
            <div className="absolute inset-[-6.52%_-5.23%]">
              <img alt="" className="block size-full max-w-none" src={imgEfficiencyArc} />
            </div>
          </div>
          <div
            className="absolute z-[2] size-[8.672px]"
            data-node-id="11:5689"
            style={{ top: 62, left: 3.86 }}
          >
            <div className="absolute inset-[-44.44%]">
              <img alt="" className="block size-full max-w-none" src={imgGaugeIndicator} />
            </div>
          </div>
          <p
            className="absolute top-[66px] left-[11.86px] overflow-hidden font-['Satoshi',sans-serif] text-[12px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis opacity-50"
            data-node-id="11:5690"
          >
            0
          </p>
          <p
            className="absolute top-[66px] left-[69.86px] -translate-x-full overflow-hidden text-right font-['Satoshi',sans-serif] text-[12px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis opacity-50"
            data-node-id="11:5691"
          >
            3
          </p>
        </div>
        <div className="relative flex shrink-0 flex-col items-start" data-node-id="11:5692">
          <div className="relative flex w-[122px] shrink-0 flex-col items-start" data-node-id="11:5693">
            <div className="relative flex w-full shrink-0 flex-col items-start gap-1" data-node-id="11:5694">
              <p className="relative w-[122px] shrink-0 overflow-hidden font-['Satoshi',sans-serif] text-[16px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis" data-node-id="11:5695">
                Efficiency Rate
              </p>
              <div className="relative flex w-full shrink-0 items-center justify-center" data-node-id="11:5696">
                <p className="relative min-h-px min-w-px flex-1 font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] tracking-[-0.14px] text-[#727d83]" data-node-id="11:5697">
                  {empty ? "No data yet" : "Safe Zone"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Tasks Completed ---------- */}
      <div className="relative flex shrink-0 items-center gap-6" data-node-id="11:5699">
        <div className="relative h-[81.592px] w-[82.864px] shrink-0" data-node-id="11:5700">
          <p
            className="absolute top-[18px] left-[calc(50%+0.07px)] z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[32px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis"
            data-node-id="11:5701"
          >
            {empty ? "0" : "46"}
          </p>
          <div
            className={`absolute top-0 left-0 h-[66.484px] w-[82.864px] ${empty ? "opacity-[0.42] grayscale" : ""}`}
            data-node-id="11:5702"
          >
            <div className="absolute inset-[-6.52%_-5.23%]">
              <img alt="" className="block size-full max-w-none" src={imgTasksArc} />
            </div>
          </div>
          <div
            className="absolute z-[2] size-[8.672px]"
            data-node-id="11:5703"
            style={{ top: 62, left: 5 }}
          >
            <div className="absolute inset-[-44.44%]">
              <img alt="" className="block size-full max-w-none" src={imgGaugeIndicator} />
            </div>
          </div>
        </div>
        <div className="relative flex shrink-0 flex-col items-start" data-node-id="11:5704">
          <div className="relative flex w-[124px] shrink-0 flex-col items-start" data-node-id="11:5705">
            <div className="relative flex w-full shrink-0 flex-col items-start gap-1" data-node-id="11:5706">
              <p className="relative shrink-0 overflow-hidden font-['Satoshi',sans-serif] text-[16px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis" data-node-id="11:5707">
                Tasks Completed
              </p>
              <div className="relative flex w-full shrink-0 items-center" data-node-id="11:5708">
                <p className="relative shrink-0 whitespace-nowrap font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] tracking-[-0.14px] text-[#727d83]" data-node-id="11:5709">
                  {empty ? "of 0 Total Points" : "of 150 Total Points"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Commits ---------- */}
      <div className="relative flex shrink-0 items-center gap-6" data-node-id="11:5711">
        <div className="relative h-[81.592px] w-[82.864px] shrink-0" data-name="Component 145" data-node-id="11:5712">
          <p
            className="absolute top-[18px] left-[calc(50%+0.07px)] z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[32px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis"
            data-node-id="I11:5712;3310:12281"
          >
            {empty ? "0" : "12"}
          </p>
          <div className={`absolute -top-1 -left-1 size-[90px] ${empty ? "opacity-0" : ""}`} data-node-id="I11:5712;3310:12284">
            <div className="absolute inset-[37.56%_0_15.57%_79.82%]">
              <img alt="" className="block size-full max-w-none" src={imgCommitsSeg1} />
            </div>
          </div>
          <div className={`absolute -top-1 -left-1 size-[90px] ${empty ? "opacity-40" : ""}`} data-node-id="I11:5712;3310:12375">
            <img alt="" className="absolute block size-full max-w-none" src={imgCommitsFrame} />
          </div>
          <div className={`absolute -top-1 -left-1 size-[90px] ${empty ? "opacity-0" : ""}`} data-node-id="I11:5712;3310:12286">
            <div className="absolute inset-[3.03%_63.16%_15.57%_0]">
              <img alt="" className="block size-full max-w-none" src={imgCommitsSeg2} />
            </div>
          </div>
        </div>
        <div className="relative flex shrink-0 flex-col items-start" data-node-id="11:5713">
          <div className="relative flex shrink-0 flex-col items-start gap-1" data-node-id="11:5714">
            <p className="relative shrink-0 overflow-hidden font-['Satoshi',sans-serif] text-[16px] font-medium leading-[normal] whitespace-nowrap text-[#0b191f] text-ellipsis" data-node-id="11:5715">
              Commits
            </p>
            <div className="relative flex w-full shrink-0 flex-col items-start" data-node-id="11:5716">
              <div className="relative flex shrink-0 items-center gap-1.5" data-node-id="11:5717">
                <div className="relative size-1 shrink-0" data-node-id="11:5718">
                  <div className="absolute inset-[-44.44%]">
                    <img alt="" className="block size-full max-w-none" src={imgLegendShipped} />
                  </div>
                </div>
                <p className="relative shrink-0 overflow-hidden font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] whitespace-nowrap text-[#727d83] text-ellipsis" data-node-id="11:5719">
                  Shipped
                </p>
              </div>
              <div className="relative flex shrink-0 items-center gap-1.5" data-node-id="11:5720">
                <div className="relative size-1 shrink-0" data-node-id="11:5721">
                  <div className="absolute inset-[-44.44%]">
                    <img alt="" className="block size-full max-w-none" src={imgLegendProgress} />
                  </div>
                </div>
                <p className="relative shrink-0 overflow-hidden font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] whitespace-nowrap text-[#727d83] text-ellipsis" data-node-id="11:5722">
                  In Progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
