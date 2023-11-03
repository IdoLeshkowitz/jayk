import Link from "next/link";

export default function PageLayout() {
    return (
        <nav className="flex w-full h-full justify-evenly items-center">
            <Link href="/hide-and-avoid">
                Hide and Avoid
            </Link>
            <Link href="/hide-and-seek">
                Hide and Seek
            </Link>
        </nav>
    )
}