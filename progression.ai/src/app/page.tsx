import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/circular logo.png" 
            alt="Progression" 
            width={32} 
            height={32}
            className="rounded-full"
          />
          <span className="text-xl font-semibold text-[#007A33]">Progression</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/auth/signin" className="hover:text-black">Sign in</Link>
          <Link href="/auth/signup" className="inline-flex items-center rounded-full bg-[#007A33] text-white px-4 py-2 hover:bg-[#006628]">Get started</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-[#007A33]/10 text-[#007A33] px-3 py-1 rounded-full border border-[#007A33]/20">AI Career Copilot</div>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-black">
            Your Career, Quantified
            <br />
            <span className="text-[#007A33]">WITH PROGRESSION</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Progression turns your experience into a quantified overall, surfaces tailored recommendations, and
            gets you from upload to insights in under a minute.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-[#007A33] text-white h-12 px-6 text-base hover:bg-[#006628]">
              Try Progression for Free
            </Link>
            <Link href="/auth/signin" className="inline-flex items-center justify-center rounded-full border border-gray-300 h-12 px-6 text-base hover:bg-gray-50 text-black">
              Upload Resume
            </Link>
          </div>
        </section>

        <section className="mt-16 rounded-2xl p-6 border border-gray-200 bg-gray-50">
          <div className="h-72 sm:h-96 w-full rounded-xl border border-gray-200 grid place-items-center text-[#007A33] text-sm">
            Preview: Your dashboard, skills, and matches appear here after upload
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-10 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Progression · Your Career, Quantified
      </footer>
    </div>
  );
}
