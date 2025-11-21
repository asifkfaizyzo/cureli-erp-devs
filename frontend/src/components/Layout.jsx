import Sidebar from "./Sidebar/Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children }) => {
    return (
        <div className="flex w-full h-screen overflow-hidden">
            
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Topbar />

                <div className="flex-1 overflow-auto bg-gray-50 p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
