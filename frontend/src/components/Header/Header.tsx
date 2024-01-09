import Auth from "./Auth";
import Search from "./Search";

const Header = () => {
    return (
        <header className="flex justify-between bg-zinc-300 px-16 py-3">
            <div className="flex items-center">
                <h1 className="text-3xl pr-10 text-zinc-900">Collectioner</h1>
                <Search />
            </div>
            <Auth />
        </header>
    )
}

export default Header;