import WatchlistList from "@/components/WatchlistList";
import { auth } from "@/lib/better-auth/auth";
import { getWatchlistByUserId } from "@/lib/actions/watchlist.actions";
import { headers } from "next/headers";

const WatchlistPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const watchlist = userId ? await getWatchlistByUserId(userId) : [];

  return (
    <div className="flex min-h-screen">
      <section className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Watchlist</h1>
          <p className="text-sm text-gray-500">Your saved stocks.</p>
        </div>
        <WatchlistList initialWatchlist={watchlist} />
      </section>
    </div>
  );
};

export default WatchlistPage;
