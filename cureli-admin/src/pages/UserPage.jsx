// import { useState } from "react";
// import UserHeader from "../components/User/UserHeader";
// import UserTable from "../components/User/UserTable";
// import dummyUsers from "../data/dummyUsers";

// const UserPage = () => {
//   const [currentPage, setCurrentPage] = useState(1);

//   // 🌟 FILTER STATES
//   const [searchText, setSearchText] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [roleFilter, setRoleFilter] = useState("");
//   const [dateFilter, setDateFilter] = useState("");

//   return (
//     <div className="w-full h-full overflow-hidden flex flex-col gap-3">

//       {/* Filters */}
//       <UserHeader
//         searchText={searchText}
//         setSearchText={setSearchText}
//         statusFilter={statusFilter}
//         setStatusFilter={setStatusFilter}
//         roleFilter={roleFilter}
//         setRoleFilter={setRoleFilter}
//         dateFilter={dateFilter}
//         setDateFilter={setDateFilter}
//       />

//       {/* Table */}
//       <div className="px-1 py-2 flex-1 overflow-hidden">
//         <UserTable
//           currentPage={currentPage}
//           setCurrentPage={setCurrentPage}
//           searchText={searchText}
//           statusFilter={statusFilter}
//           roleFilter={roleFilter}
//           dateFilter={dateFilter}
//           dummyUsers={dummyUsers}
//         />
//       </div>
//     </div>
//   );
// };

// export default UserPage;

import { useState, useEffect } from "react";
import UserHeader from "../components/User/UserHeader";
import UserTable from "../components/User/UserTable";
import dummyUsers from "../data/dummyUsers";

const UserPage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, dateFilter]);

  return (
    // KEY FIX: Added min-w-0 to allow proper flex shrinking
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">

      {/* Header - flex-shrink-0 prevents it from collapsing */}
      <UserHeader
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dummyUsers={dummyUsers}
      />

      {/* Table - Takes remaining space */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <UserTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          searchText={searchText}
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          dateFilter={dateFilter}
          dummyUsers={dummyUsers}
        />
      </div>
    </div>
  );
};

export default UserPage;