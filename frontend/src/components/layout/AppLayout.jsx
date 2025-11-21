import { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

const AppLayout = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState("billing");

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gray-50">
      <Sidebar activeId={activeMenu} onChange={setActiveMenu} />

      <div className="flex-1 flex flex-col">
        <TopHeader />

        {/* Main scrollable area */}
        <main className="flex-1 overflow-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
