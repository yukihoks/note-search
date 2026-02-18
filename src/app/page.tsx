
import SearchEngine from '@/components/SearchEngine';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
            Note Search
          </h1>
          <p className="text-lg leading-8 text-zinc-400 max-w-2xl mx-auto">
            Explore articles by <span className="text-amber-400 font-semibold">@yukidouji</span>.
            Full-text search enabled for Antigravity, AI, and Engineering insights.
          </p>
        </div>

        <SearchEngine />

        <footer className="mt-32 text-center text-zinc-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Note Search Project. Unofficial viewer.</p>
        </footer>
      </div>
    </main>
  );
}
