import { Eye, Pencil, Trash2 } from "lucide-react";
import dummyUsers from "../../data/dummyUsers";

const UserTable = () => {
  // ✅ compute longest role length (Super Admin will be longest)
  const longestRoleLength = Math.max(...dummyUsers.map(u => u.role.length));

  return (
    <div className="
      max-h-[320px]
      min-[1366px]:max-h-[400px]
      min-[1440px]:max-h-[540px]
      min-[1920px]:max-h-[610px]
      min-[2560px]:max-h-[640px]
      overflow-hidden
    ">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#05015A] text-white text-left">
            <th className="p-2 border-white">SL.No</th>
            <th className="p-2 border-white">Full Name</th>
            <th className="p-2 border-white">Username</th>
            <th className="p-2 border-white">Email</th>
            <th className="p-2 border-white">Role</th>
            <th className="p-2 border-white">Status</th>
            <th className="p-2 border-white">Last Login</th>
            <th className="p-2 border-white text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {dummyUsers.map((u, index) => (
            <tr key={u.id} className="border-r-4 border-b-4 border-white odd:bg-gray-100 even:bg-gray-100">
              <td className="p-2 border-r-2 border-white">{index + 1}</td>
              <td className="p-2 border-r-4 border-white">{u.name}</td>
              <td className="p-2 border-r-4 border-white">{u.username}</td>
              <td className="p-2 border-r-4 border-white">{u.email}</td>

              {/* ✅ ROLE (same as before, only width logic added) */}
              <td className="p-2 bg-white text-center border-r-4 border-white">
                <span
                  className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] inline-block"
                  style={{
                    minWidth: `${longestRoleLength * 6}px`,
                    textAlign: "center"
                  }}
                >
                  {u.role}
                </span>
              </td>

              {/* ✅ STATUS (now EXACT same width source as role, like your image) */}
              <td className="p-2 bg-white text-center border-r-4 border-white">
                <span
                  className={u.status === "Active"
                    ? "px-2 py-1 rounded-full bg-green-100 text-green-600 text-[10px] inline-block"
                    : "px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] inline-block"}
                  style={{
                    minWidth: `${longestRoleLength * 6}px`,
                    textAlign: "center"
                  }}
                >
                  {u.status === "Active" ? "Active" : "Inactive"}
                </span>
              </td>

              <td className="p-2 border-r-4 border-white">{u.lastLogin}</td>

              {/* Actions */}
              <td className="p-2 flex items-center bg-white justify-center gap-3">
                <Eye size={16} className="cursor-pointer text-gray-600 hover:text-[#05015A]" />
                <Pencil size={16} className="cursor-pointer text-gray-600 hover:text-[#05015A]" />
                <Trash2 size={16} className="cursor-pointer text-red-500 hover:text-red-700" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
