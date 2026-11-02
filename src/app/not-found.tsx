import Link from "next/link";
import { BrandMark } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <BrandMark />
      <h1 className="mt-6 text-2xl font-semibold text-navy">Page not found</h1>
      <p className="mt-2 text-slate-600">This page, product or shop does not exist or is not open yet.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-dark">Go to the home page</Link>
    </main>
  );
}
