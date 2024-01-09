const Search = () => {
    return (
       <div className="flex items-center">
            <div className="flex">
                <input
                    type="text"
                    className="block w-full px-4 py-2 mr-4 text-zinc-700 bg-transparent border-b-2 border-zinc-700 focus:outline-none"
                    placeholder="Search..."
                />
                <button className="px-4 text-zinc-100 bg-zinc-700">
                    Search
                </button>
            </div>
        </div>
    )
}

export default Search;