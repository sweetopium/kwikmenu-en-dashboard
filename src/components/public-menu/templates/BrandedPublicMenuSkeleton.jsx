const Pulse = ({ className }) => <div className={`animate-pulse bg-black/10 ${className}`} />;

const BrandedPublicMenuSkeleton = ({ accentColor = '#26382f' }) => (
  <div className="min-h-screen bg-[#d8d8d6]">
    <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#f6f1e9] shadow-xl">
      <div className="h-[320px] p-5" style={{ backgroundColor: accentColor }}>
        <Pulse className="h-14 w-14 rounded-2xl bg-white/30" />
        <div className="mt-28">
          <Pulse className="h-3 w-20 rounded bg-white/25" />
          <Pulse className="mt-3 h-10 w-64 rounded bg-white/25" />
          <Pulse className="mt-3 h-3 w-52 rounded bg-white/20" />
        </div>
      </div>
      <div className="flex gap-2 border-b border-black/5 px-4 py-4">
        {[1, 2, 3, 4].map((item) => (
          <Pulse key={item} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="p-4">
        <Pulse className="mt-4 h-8 w-44 rounded" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl bg-white">
              <Pulse className="aspect-[4/3] w-full" />
              <div className="p-3">
                <Pulse className="h-4 w-4/5 rounded" />
                <Pulse className="mt-3 h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default BrandedPublicMenuSkeleton;
