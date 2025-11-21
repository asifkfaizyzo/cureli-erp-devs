const SidebarItem = ({ icon, label, isOpen, active }) => {
    return (
        <div className={`flex items-center gap-3 p-3 cursor-pointer 
            ${active ? "bg-[#000060] text-white" : "hover:bg-gray-100"}`}>
            
            <i className={`text-xl ${icon}`}></i>

            {/* Show label only if sidebar is open */}
            {isOpen && (
                <span className="text-sm font-medium">{label}</span>
            )}
        </div>
    );
};

export default SidebarItem;
