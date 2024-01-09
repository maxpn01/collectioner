
const Main = () => {
    return (
        <main className="h-full flex items-center justify-center">
            <div className="px-16 py-3">
                <h2 className="text-2xl">Latest Items</h2>
                <ul>
                    <li>item 1</li>
                    <li>item 2</li>
                    <li>item 3</li>
                    <li>item 4</li>
                    <li>item 5</li>
                </ul>
            </div>
            <div className="px-16 py-3">
                <h2 className="text-2xl">5 Largest Collections</h2>
                <ul>
                    <li>collection 1</li>
                    <li>collection 2</li>
                    <li>collection 3</li>
                    <li>collection 4</li>
                    <li>collection 5</li>
                </ul>
            </div>
        </main>
    )
}

export default Main;