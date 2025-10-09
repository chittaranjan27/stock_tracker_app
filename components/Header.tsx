import NavItems from "./NavItems"
import UserDropdown from "./UserDropdown"
import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"

const Header = () => {
    return (
        <header className=" sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="flex items-center gap-1">
                    <Image
                        src="/assets/icons/Group.png"
                        alt="Signalist Logo"
                        width={120}
                        height={40}
                        className="h-8 w-auto crusor-pointer"
                    />
                    <p className="text-2xl font-bold text-gray-500">TRADEX</p>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems />
                </nav>

                <UserDropdown/>
            </div>
        </header>
    )
}

export default Header
