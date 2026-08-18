import { useEffect, useRef } from "react";
import { FiBell, FiSearch } from "react-icons/fi";
import useAuthContext from "../../hooks/useAuthContext";
import "./Topbar.css";

const Topbar = () => {

    const { user } = useAuthContext();
    const currentUser = user?.user || user;
    const name = currentUser?.name || "User";
    const avatar = currentUser?.avatar;
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key.toLowerCase() === "k") {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <header className="topbar">
            <div className="topbar-search">
                <FiSearch />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                />
                <span className="search-shortcut">
                    Ctrl K
                </span>
            </div>
            <div className="topbar-actions">
                <button
                    type="button"
                    className="topbar-icon-button"
                >
                    <FiBell />
                </button>
                <button
                    type="button"
                    className="topbar-user"
                >
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={name}
                            className="topbar-avatar-image"
                        />
                    ) : (
                        <span className="topbar-avatar">
                            {name
                                .charAt(0)
                                .toUpperCase()
                            }
                        </span>
                    )}
                    <span className="topbar-user-name">
                        {name}
                    </span>
                    <span>
                        ▾
                    </span>
                </button>
            </div>
        </header>
    );
};

export default Topbar;