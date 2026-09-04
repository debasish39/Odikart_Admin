import {
  Menu,
  Bell,
  Search,
} from "lucide-react";

import { useAdminAuth } from "../../context/AdminAuthContext";

const Topbar = ({
  onMenuClick,
}) => {

  const { user } =
    useAdminAuth();

  const name =
    `${user?.firstName || ""} ${
      user?.lastName || ""
    }`.trim() || "Admin";

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">

      <div className="flex items-center gap-4">

        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:flex items-center gap-2 w-80 bg-gray-100 rounded-xl px-4 py-2.5">

          <Search
            size={18}
            className="text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none w-full text-sm"
          />

        </div>

      </div>

      <div className="flex items-center gap-4">

        <button className="relative p-2.5 rounded-xl hover:bg-gray-100">

          <Bell size={20} />

          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />

        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="hidden sm:block">

            <p className="text-sm font-semibold">
              {name}
            </p>

            <p className="text-xs text-gray-500">
              Administrator
            </p>

          </div>

        </div>

      </div>

    </header>
  );
};

export default Topbar;