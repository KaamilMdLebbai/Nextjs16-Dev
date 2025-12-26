const Navbar = () => {
    return (
        <header>
            <nav>
                <a href="/" className={"logo"}>
                    <img src={"/icons/logo.png"} alt={"logo"} width={24} height={24} />

                    <p>Dev Event</p>
                </a>
                <ul>
                    <a href={"/"}>Home</a>
                    <a href={"/"}>Events</a>
                    <a href={"/"}>Create Event</a>
                </ul>
            </nav>
        </header>
    )
}
export default Navbar
