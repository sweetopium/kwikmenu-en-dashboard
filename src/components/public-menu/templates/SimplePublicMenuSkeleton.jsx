const PAGE_SKELETON_BG = '#f5f6f8';
const HERO_SKELETON_BG = '#d9dce3';
const HERO_SKELETON_BORDER = 'rgba(104, 112, 124, 0.14)';
const HERO_SKELETON_BAR = 'rgba(255,255,255,0.28)';
const HERO_SKELETON_PILL = 'rgba(255,255,255,0.22)';
const SKELETON_SURFACE = '#fcfcfd';
const SKELETON_PANEL_BORDER = 'rgba(148, 163, 184, 0.18)';
const SKELETON_ACCENT = '#cfd4dd';
const ACTIVE_CHIP_BG = '#d7dbe3';
const ACTIVE_CHIP_BORDER = 'rgba(148, 163, 184, 0.2)';
const ACTIVE_CHIP_SHADOW = '0 6px 14px rgba(15, 23, 42, 0.06)';

const SkeletonBar = ({ className = '' }) => (
  <div className={`animate-pulse rounded-full bg-black/8 ${className}`} />
);

const SkeletonMenuRow = ({ withVariants = false }) => {
  if (withVariants) {
    return (
      <article className="py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2.5">
            <SkeletonBar className="h-5 w-[42%]" />
            <div className="border-l border-black/10 pl-3">
              <div className="space-y-2.5">
                {[0, 1, 2].map((variantIndex) => (
                  <div key={variantIndex} className="flex items-center justify-between gap-4">
                    <SkeletonBar className="h-4 w-14" />
                    <SkeletonBar className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBar className="h-5 w-[68%]" />
          <SkeletonBar className="h-4 w-[44%]" />
        </div>
        <SkeletonBar className="h-5 w-14" />
      </div>
    </article>
  );
};

const SkeletonSectionCard = ({ accentColor, panelBorder, titleWidth = 'w-40', rows = 4, withVariants = false }) => (
  <div
    className="rounded-[2rem] border p-5 shadow-[0_14px_34px_rgba(18,54,47,0.09)] sm:p-6"
    style={{
      backgroundColor: SKELETON_SURFACE,
      borderColor: panelBorder,
    }}
  >
    <div className="mb-4 space-y-2 sm:mb-5">
      <SkeletonBar className={`h-7 ${titleWidth} sm:h-8`} />
      <div className="h-[3px] w-[76px] rounded-full" style={{ backgroundColor: accentColor }} />
    </div>

    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`${rowIndex > 0 ? 'border-t' : ''}`}
          style={{ borderColor: 'rgba(18, 54, 47, 0.1)' }}
        >
          {withVariants && rowIndex === 1 ? <SkeletonMenuRow withVariants /> : <SkeletonMenuRow />}
        </div>
      ))}
    </div>
  </div>
);

const SimplePublicMenuSkeleton = ({ accentColor = '#6d67eb' }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_SKELETON_BG, fontFamily: '"Avenir Next", "Manrope", Inter, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
        <section
          className="overflow-hidden rounded-[2rem] border p-4 shadow-[0_16px_38px_rgba(18,54,47,0.12)] sm:p-5"
          style={{
            backgroundColor: HERO_SKELETON_BG,
            borderColor: HERO_SKELETON_BORDER,
          }}
        >
          <div className="flex gap-3">
            <div
              className="h-[64px] w-[64px] shrink-0 rounded-[1rem] border sm:h-[72px] sm:w-[72px]"
              style={{ borderColor: 'rgba(255,255,255,0.42)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            />

            <div className="min-w-0 flex-1 pt-0.5">
              <SkeletonBar className="h-7 w-40 sm:h-8 sm:w-52" />

              <div className="mt-2 flex gap-1.5">
                <div className="h-8 w-[3.35rem] animate-pulse rounded-[0.5rem]" style={{ backgroundColor: HERO_SKELETON_PILL }} />
                <div className="h-8 w-[3.35rem] animate-pulse rounded-[0.5rem]" style={{ backgroundColor: HERO_SKELETON_PILL }} />
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="h-4 w-[72%] animate-pulse rounded-full" style={{ backgroundColor: HERO_SKELETON_BAR }} />
            <div className="h-4 w-[46%] animate-pulse rounded-full" style={{ backgroundColor: HERO_SKELETON_BAR }} />
          </div>
        </section>

        <section className="sticky top-3 z-20">
          <div className="flex gap-1.5 overflow-hidden pb-1">
            <div className="h-10 w-28 animate-pulse rounded-full border" style={{ backgroundColor: ACTIVE_CHIP_BG, borderColor: ACTIVE_CHIP_BORDER, boxShadow: ACTIVE_CHIP_SHADOW }} />
            <div className="h-10 w-24 animate-pulse rounded-full border" style={{ backgroundColor: SKELETON_SURFACE, borderColor: SKELETON_PANEL_BORDER }} />
            <div className="h-10 w-32 animate-pulse rounded-full border" style={{ backgroundColor: SKELETON_SURFACE, borderColor: SKELETON_PANEL_BORDER }} />
            <div className="h-10 w-24 animate-pulse rounded-full border" style={{ backgroundColor: SKELETON_SURFACE, borderColor: SKELETON_PANEL_BORDER }} />
          </div>
        </section>

        <section className="space-y-4">
          <SkeletonSectionCard
            accentColor={SKELETON_ACCENT}
            panelBorder={SKELETON_PANEL_BORDER}
            titleWidth="w-40 sm:w-48"
            rows={5}
            withVariants
          />

          <SkeletonSectionCard
            accentColor={SKELETON_ACCENT}
            panelBorder={SKELETON_PANEL_BORDER}
            titleWidth="w-32 sm:w-40"
            rows={3}
          />
        </section>
      </div>
    </div>
  );
};

export default SimplePublicMenuSkeleton;
