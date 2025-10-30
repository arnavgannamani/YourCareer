import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#007a33]" />
          <span className="text-xl font-semibold">progression.ai</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/auth/signin" className="hover:text-white">Sign in</Link>
          <Link href="/auth/signup" className="inline-flex items-center rounded-full bg-[#007a33] text-white px-4 py-2 hover:bg-[#006628]">Get started</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-green-900/40 text-green-300 px-3 py-1 rounded-full border border-green-800">AI Career Copilot</div>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight">
            Your Career, Quantified
            <br />
            <span className="text-green-400">WITH PROGRESSION.AI</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Progression.ai turns your experience into a quantified overall, surfaces tailored recommendations, and
            gets you from upload to insights in under a minute.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-[#007a33] text-white h-12 px-6 text-base hover:bg-[#006628]">
              Try Progression for Free
            </Link>
            <Link href="/auth/signin" className="inline-flex items-center justify-center rounded-full border border-zinc-800 h-12 px-6 text-base hover:bg-zinc-800">
              Upload Resume
            </Link>
          </div>
        </section>

        <section className="mt-16 rounded-2xl p-6 border border-zinc-800 bg-zinc-900/50">
          <div className="h-72 sm:h-96 w-full rounded-xl border border-zinc-800 grid place-items-center text-green-300 text-sm">
            Preview: Your dashboard, skills, and matches appear here after upload
          </div>
        </section>
      </main>

      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} progression.ai · Your Career, Quantified
      </footer>
    </div>
  );
}
