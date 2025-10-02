import NavItems from "./NavItems"
import UserDropdown from "./UserDropdown"
import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"

const Header = () => {
    return (
        <header className=" sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <Image
                        src="/assets/icons/logo.svg"
                        alt="Signalist Logo"
                        width={120}
                        height={40}
                        className="h-8 w-auto crusor-pointer"
                    />
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
