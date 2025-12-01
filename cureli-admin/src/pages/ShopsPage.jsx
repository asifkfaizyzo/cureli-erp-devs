import { useState, useMemo } from "react";
import ShopsHeader from "../components/Shops/ShopsHeader";
import ShopsTable from "../components/Shops/ShopsTable";
import Pagination from "../components/Shops/Pagination";
import shopsData from "../data/shopsdummydata"; // dummy data

const ShopsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const pageSize = 6;

  const filtered = useMemo(() => {
    return shopsData.filter((s) =>
      s.businessName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <ShopsHeader search={search} setSearch={setSearch} />

      <ShopsTable shops={paginated} />

      <Pagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    </div>
  );
};

export default ShopsPage;
