import { useState } from "react";
import UserHeader from "../components/User/UserHeader";
import UserTable from "../components/User/UserTable";
import dummyUsers from "../data/dummyUsers";

const UserPage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  // 🌟 FILTER STATES
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  return (
    <div className="w-full h-full flex flex-col gap-3">

      {/* Filters */}
      <UserHeader
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      {/* Table */}
      <div className="bg-white shadow-md rounded-xl p-3 flex-1 overflow-hidden">
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
