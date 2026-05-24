import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <div className="font-mono text-7xl font-black gradient-text">404</div>
      <h1 className="mt-4 text-2xl font-bold text-white">
        This ticker doesn’t exist
      </h1>
      <p className="mt-2 max-w-sm text-zinc-400">
        The character or page you’re looking for isn’t listed on the exchange.
      </p>
      <Link href="/market" className="btn-primary mt-6">
        Back to the market <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
