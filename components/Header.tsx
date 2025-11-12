import NavItems from "./NavItems"
import UserDropdown from "./UserDropdown"
import Link from "next/link"
import Image from "next/image"
import { searchStocks } from "@/lib/actions/finnhub.actions"

const Header = async ({user}: {user: User} ) => {
    const initialStocks = await searchStocks();

    return (
        <header className=" sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="flex items-center gap-1">
                    <Image
                        src="/assets/icons/Group.png"
                        alt="TradeX Logo"
                        width={120}
                        height={40}
                        className="h-8 w-auto crusor-pointer"
                    />
                    <p className="text-2xl font-bold text-gray-500">tradeX</p>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks}/>
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks} />
            </div>
        </header>
    )
}

export default Header
