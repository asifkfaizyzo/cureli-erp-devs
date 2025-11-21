const Topbar = () => {
    return (
        <div className="w-full h-16 bg-white border-b flex justify-between items-center px-6">
            <img src="/logo.png" className="h-10" />

            <div className="flex items-center gap-6">
                <i className="ri-notification-line text-xl"></i>
                <i className="ri-chat-1-line text-xl"></i>

                <div className="flex items-center gap-2">
                    <img src="/user.jpg" className="h-10 w-10 rounded-full" />
                    <div>
                        <p className="font-medium">James Philip</p>
                        <p className="text-xs text-gray-500">Manager</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
