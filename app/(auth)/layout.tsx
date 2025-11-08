import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() })

    if (session?.user) redirect('/')

    return (
        <main className="auth-layut flex">
            <section className="auth-left-section">
                <Link href="/" className=" flex items-center gap-1 auth-logo ">
                    <Image
                        src="/assets/icons/Group.png"
                        alt="TradeX Logo"
                        width={120}
                        height={30}
                        className="h-5 w-auto crusor-pointer"
                    />
                    <p className="text-xl font-bold bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 bg-clip-text text-transparent">TradeX</p>
                </Link>
                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>

            <section className="auth-right-section">
                <div className=" text-center px-8 ">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 bg-clip-text text-transparent mb-3 tracking-wider">
                        TradeX
                    </h2>
                    <p className="text-2xl font-medium bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 bg-clip-text text-transparent">
                        Real-time signals and  analytics
                    </p>
                </div>
                <div className="relative mt-10 mb-16">
                    <Image
                        src="/assets/images/dashboard.png"
                        alt="Dashboard Preview"
                        width={1440}
                        height={1550}
                        className="auto-dashboard-preview absolute top-0 animate-float"
                    />

                </div>
            </section>
        </main>
    )
}

export default Layout