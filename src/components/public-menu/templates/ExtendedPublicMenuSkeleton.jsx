const PAGE_BG = '#f5efe6';
const HERO_BG = '#faf7f2';
const HERO_BORDER = 'rgba(162, 142, 121, 0.18)';
const SKELETON_BAR = '#ded8cf';
const CARD_BG = '#fffdfa';
const CARD_BORDER = 'rgba(162, 142, 121, 0.16)';
const PUBLIC_DESKTOP_BG = '#d9d9d9';

const SkeletonBar = ({ className = '' }) => (
  <div className={`animate-pulse rounded-full ${className}`} style={{ backgroundColor: SKELETON_BAR }} />
);

const CardSkeleton = () => (
  <div
    className="overflow-hidden rounded-[1.35rem] border shadow-[0_12px_28px_rgba(55,48,41,0.05)]"
    style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
  >
    <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: '#e5e0d8' }} />
    <div className="space-y-3 px-3 py-3.5">
      <div className="space-y-2">
        <SkeletonBar className="h-4 w-[88%]" />
        <SkeletonBar className="h-4 w-[72%]" />
      </div>
      <SkeletonBar className="h-4 w-14" />
    </div>
  </div>
);

const ExtendedPublicMenuSkeleton = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: PUBLIC_DESKTOP_BG, fontFamily: '"Avenir Next", "Manrope", Inter, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="mx-auto w-full max-w-[430px]">
        <div className="flex min-h-screen w-full flex-col gap-4 px-4 py-4 sm:px-4 sm:py-4" style={{ backgroundColor: PAGE_BG }}>
        <section
          className="rounded-[2rem] border px-4 py-4 shadow-[0_16px_42px_rgba(55,48,41,0.05)] sm:px-5 sm:py-5"
          style={{ backgroundColor: HERO_BG, borderColor: HERO_BORDER }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <div className="space-y-2">
                <SkeletonBar className="h-7 w-40 sm:h-8 sm:w-44" />
                <SkeletonBar className="h-2.5 w-14" />
              </div>
              <div className="space-y-2">
                <SkeletonBar className="h-4 w-48" />
                <SkeletonBar className="h-4 w-32" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex rounded-full border p-1" style={{ borderColor: HERO_BORDER }}>
                <div className="h-6 w-10 animate-pulse rounded-full" style={{ backgroundColor: '#ddd5cb' }} />
                <div className="h-6 w-10 animate-pulse rounded-full" style={{ backgroundColor: 'transparent' }} />
              </div>
              <SkeletonBar className="h-4 w-20" />
            </div>
          </div>
        </section>

        <section
          className="sticky top-3 z-20 rounded-full border px-2 py-2 shadow-[0_12px_28px_rgba(55,48,41,0.04)]"
          style={{ backgroundColor: 'rgba(255,253,248,0.72)', borderColor: HERO_BORDER, backdropFilter: 'blur(18px)' }}
        >
          <div className="flex gap-2 overflow-hidden">
            <div className="h-10 w-24 animate-pulse rounded-full" style={{ backgroundColor: '#e0d9cf' }} />
            <div className="h-10 w-24 animate-pulse rounded-full" style={{ backgroundColor: '#f3eee6' }} />
            <div className="h-10 w-20 animate-pulse rounded-full" style={{ backgroundColor: '#f3eee6' }} />
            <div className="h-10 w-16 animate-pulse rounded-full" style={{ backgroundColor: '#f3eee6' }} />
          </div>
        </section>

        <section className="space-y-7">
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <SkeletonBar className="h-8 w-28" />
              <SkeletonBar className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};

export default ExtendedPublicMenuSkeleton;
