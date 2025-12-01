import { ChevronUp, ChevronDown } from "lucide-react";
import VerificationRow from "./VerificationRow";

const VerificationTable = ({ data, triggerSort, onRowClick, sortField, sortOrder }) => {
  // utility: check if column is currently sorted
  const isActive = (column, dir) =>
    sortField === column && sortOrder === dir;

  return (
    <div className="mt-2 overflow-hidden rounded-xl shadow-lg">
      <table className="w-full border-collapse text-[11px]">

        {/* HEADER */}
        <thead className="bg-gradient-to-r from-[#05015A] to-[#090174] text-white">
          <tr className="text-[11px] select-none">

            {/* SL NO */}
            <th className="p-2 text-left font-semibold">SL.No</th>

            {/* SHOP NAME */}
            <th
              className="p-2 cursor-pointer font-semibold"
              onClick={() =>
                triggerSort(
                  "shopName",
                  sortField === "shopName" && sortOrder === "asc" ? "desc" : "asc"
                )
              }
            >
              <div className="flex justify-between items-center">
                <span>Shop Name</span>

                <div className="flex flex-col leading-[6px]">
                  <ChevronUp
                    size={12}
                    className={
                      isActive("shopName", "asc")
                        ? "text-yellow-300"
                        : "text-white/50"
                    }
                  />
                  <ChevronDown
                    size={12}
                    className={
                      isActive("shopName", "desc")
                        ? "text-yellow-300 -mt-1"
                        : "text-white/50 -mt-1"
                    }
                  />
                </div>
              </div>
            </th>

            {/* SHOP ID */}
            <th className="p-2 text-left font-semibold">Shop ID</th>

            {/* OWNER NAME */}
            <th
              className="p-2 cursor-pointer font-semibold"
              onClick={() =>
                triggerSort(
                  "ownerName",
                  sortField === "ownerName" && sortOrder === "asc" ? "desc" : "asc"
                )
              }
            >
              <div className="flex justify-between items-center">
                <span>Owner Name</span>

                <div className="flex flex-col leading-[6px]">
                  <ChevronUp
                    size={12}
                    className={
                      isActive("ownerName", "asc")
                        ? "text-yellow-300"
                        : "text-white/50"
                    }
                  />
                  <ChevronDown
                    size={12}
                    className={
                      isActive("ownerName", "desc")
                        ? "text-yellow-300 -mt-1"
                        : "text-white/50 -mt-1"
                    }
                  />
                </div>
              </div>
            </th>

            {/* EMAIL */}
            <th
              className="p-2 cursor-pointer font-semibold"
              onClick={() =>
                triggerSort(
                  "email",
                  sortField === "email" && sortOrder === "asc" ? "desc" : "asc"
                )
              }
            >
              <div className="flex justify-between items-center">
                <span>Email</span>

                <div className="flex flex-col leading-[6px]">
                  <ChevronUp
                    size={12}
                    className={
                      isActive("email", "asc")
                        ? "text-yellow-300"
                        : "text-white/50"
                    }
                  />
                  <ChevronDown
                    size={12}
                    className={
                      isActive("email", "desc")
                        ? "text-yellow-300 -mt-1"
                        : "text-white/50 -mt-1"
                    }
                  />
                </div>
              </div>
            </th>

            {/* STATUS */}
            <th className="p-2 text-left font-semibold">Status</th>

            {/* SUB COUNT */}
            <th
              className="p-2 cursor-pointer font-semibold"
              onClick={() =>
                triggerSort(
                  "subCount",
                  sortField === "subCount" && sortOrder === "asc" ? "desc" : "asc"
                )
              }
            >
              <div className="flex justify-between items-center">
                <span>Sub Count</span>

                <div className="flex flex-col leading-[6px]">
                  <ChevronUp
                    size={12}
                    className={
                      isActive("subCount", "asc")
                        ? "text-yellow-300"
                        : "text-white/50"
                    }
                  />
                  <ChevronDown
                    size={12}
                    className={
                      isActive("subCount", "desc")
                        ? "text-yellow-300 -mt-1"
                        : "text-white/50 -mt-1"
                    }
                  />
                </div>
              </div>
            </th>

            {/* DATE */}
            <th
              className="p-2 cursor-pointer font-semibold"
              onClick={() =>
                triggerSort(
                  "date",
                  sortField === "date" && sortOrder === "asc" ? "desc" : "asc"
                )
              }
            >
              <div className="flex justify-between items-center">
                <span>Date</span>

                <div className="flex flex-col leading-[6px]">
                  <ChevronUp
                    size={12}
                    className={
                      isActive("date", "asc")
                        ? "text-yellow-300"
                        : "text-white/50"
                    }
                  />
                  <ChevronDown
                    size={12}
                    className={
                      isActive("date", "desc")
                        ? "text-yellow-300 -mt-1"
                        : "text-white/50 -mt-1"
                    }
                  />
                </div>
              </div>
            </th>

          </tr>
        </thead>

        {/* BODY */}
        <tbody className="bg-gray-100">
          {data.map((item, index) => (
            <VerificationRow
              key={index}
              item={item}
              index={index}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VerificationTable;
