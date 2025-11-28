import UserHeader from "../components/User/UserHeader";
import UserTable from "../components/User/UserTable";
import Pagination from "../components/User/Pagination";

const UserPage = () => {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Search / Filters */}
      <UserHeader />

      {/* Table */}
      <div className="bg-white shadow-md rounded-xl p-3">
        <UserTable />
      </div>

      {/* Pagination */}
      <Pagination totalPages={12} currentPage={1} />
    </div>
  );
};

export default UserPage;
