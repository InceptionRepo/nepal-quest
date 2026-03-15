import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

function RetroGrid({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = 'gray',
  darkLineColor = 'gray',
}) {
  const gridStyles = {
    '--grid-angle': `${angle}deg`,
    '--cell-size': `${cellSize}px`,
    '--opacity': opacity,
    '--light-line': lightLineColor,
    '--dark-line': darkLineColor,
  };

  return (
    <div
      className="pointer-events-none absolute w-full h-full overflow-hidden"
      style={{ ...gridStyles, perspective: '200px', opacity: opacity }}
    >
      <div className="absolute inset-0" style={{ transform: `rotateX(${angle}deg)` }}>
        <div
          className="animate-grid"
          style={{
            backgroundImage: `linear-gradient(to right, ${darkLineColor} 1px, transparent 0), linear-gradient(to bottom, ${darkLineColor} 1px, transparent 0)`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${cellSize}px ${cellSize}px`,
            height: '300vh',
            inset: '0% 0px',
            marginLeft: '-200%',
            transformOrigin: '100% 0 0',
            width: '600vw',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent to-90%" />
    </div>
  );
}

export function HeroSection({
  className,
  title = 'Build products for everyone',
  subtitle = {
    regular: 'Designing your projects faster with ',
    gradient: 'the largest figma UI kit.',
  },
  description = '',
  ctaText = 'Browse courses',
  ctaHref = '#',
  bottomImage = null,
  gridOptions = {},
  onCtaClick,
  ...props
}) {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className="absolute top-0 z-0 h-screen w-screen bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      <section className="relative max-w-full mx-auto z-[1]">
        <RetroGrid {...gridOptions} />
        <div className="max-w-screen-xl z-10 mx-auto px-4 py-28 gap-12 md:px-8 relative">
          <div className="space-y-5 max-w-3xl leading-0 lg:leading-5 mx-auto text-center">
            <h1 className="text-sm text-gray-400 group mx-auto px-5 py-2 bg-gradient-to-tr from-zinc-300/5 via-gray-400/5 to-transparent border-[2px] border-white/5 rounded-3xl w-fit">
              {title}
              <ChevronRight className="inline w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
            </h1>
            <h2 className="text-4xl tracking-tighter bg-clip-text text-transparent mx-auto md:text-6xl font-bold bg-[linear-gradient(180deg,#FFF_0%,rgba(255,255,255,0.00)_202.08%)]">
              {subtitle.regular}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-orange-200">
                {subtitle.gradient}
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-gray-300">
              {description}
            </p>
            <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
              <span className="relative inline-block overflow-hidden rounded-full p-[1.5px]">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                  {onCtaClick ? (
                    <button
                      onClick={onCtaClick}
                      className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/5 via-purple-400/20 to-transparent text-white border border-white/10 hover:from-zinc-300/10 hover:via-purple-400/30 transition-all sm:w-auto py-4 px-10"
                    >
                      {ctaText}
                    </button>
                  ) : (
                    <a
                      href={ctaHref}
                      className="inline-flex rounded-full text-center group items-center w-full justify-center bg-gradient-to-tr from-zinc-300/5 via-purple-400/20 to-transparent text-white border border-white/10 hover:from-zinc-300/10 hover:via-purple-400/30 transition-all sm:w-auto py-4 px-10"
                    >
                      {ctaText}
                    </a>
                  )}
                </div>
              </span>
            </div>
          </div>
          {bottomImage && (
            <div className="mt-20 mx-10 relative z-10">
              <img
                src={bottomImage}
                className="w-full shadow-lg rounded-lg border border-gray-800"
                alt="Nepal preview"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
