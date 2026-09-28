import { Menu } from "lucide-react";

type AdminMobileHeaderProps = {
  onMenuClick: () => void;
};

const AdminMobileHeader = ({
  onMenuClick,
}: AdminMobileHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="ml-3">
        <p className="text-sm font-semibold text-gray-900">
          Physical Media Store
        </p>

        <p className="text-xs text-gray-500">
          Admin Panel
        </p>
      </div>
    </header>
  );
};

export default AdminMobileHeader;