import PortfolioTable from "@/components/PortfolioTable";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getPortfolioByUserId } from "@/lib/actions/portfolio.actions";

const PortfolioPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const holdings = userId ? await getPortfolioByUserId(userId) : [];

  return (
    <div className="flex min-h-screen">
      <section className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Portfolio</h1>
          <p className="text-sm text-gray-500">Track your holdings and profit/loss.</p>
        </div>
        <PortfolioTable initialHoldings={holdings} />
      </section>
    </div>
  );
};

export default PortfolioPage;
