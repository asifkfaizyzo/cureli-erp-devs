// src/pages/ShopsPage.jsx

import { useState, useEffect, useCallback } from "react";
import ShopsHeader from "../components/Shops/ShopsHeader";
import ShopsTable from "../components/Shops/ShopsTable";
import { getShops } from "../api/cadminShops";

const ShopsPage = () => {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Responsive rows per page
  useEffect(() => {
    const updateRows = () => {
      const width = window.innerWidth;
      if (width >= 2560) setRowsPerPage(14);
      else if (width >= 1920) setRowsPerPage(12);
      else if (width >= 1440) setRowsPerPage(9);
      else if (width >= 1366) setRowsPerPage(8);
      else setRowsPerPage(6);
    };

    updateRows();
    window.addEventListener("resize", updateRows);
    return () => window.removeEventListener("resize", updateRows);
  }, []);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("verified");
  const [subscriptionFilter, setSubscriptionFilter] = useState("active");
  const [activeFilter, setActiveFilter] = useState("Active");
  const [dateFilter, setDateFilter] = useState("");

  // Sort
  const [sortConfig, setSortConfig] = useState({ sortBy: "created_at", order: "desc" });

  // Data
  const [shops, setShops] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        verification_status: verificationFilter || undefined,
        subscription_status: subscriptionFilter || undefined,
        is_active: activeFilter === "Active" ? true : activeFilter === "Inactive" ? false : undefined,
        date_start: dateFilter || undefined,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await getShops(params);
      const payload = response.data?.data || {};

      setShops(payload.data || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
      setShops([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText, verificationFilter, subscriptionFilter, activeFilter, dateFilter, sortConfig]);

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchShops();
  }, [fetchShops]);

  // Local update for optimistic UI
  const handleShopUpdate = useCallback((shopId, updates) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.shop_id === shopId ? { ...shop, ...updates } : shop
      )
    );
  }, []);

  // Sort handler
  const handleSortChange = (column) => {
    setSortConfig((prev) => {
      const order = prev.sortBy === column && prev.order === "asc" ? "desc" : "asc";
      return { sortBy: column, order };
    });
    setCurrentPage(1);
  };

  // Filter handler
  const handleFilterChange = ({ search, verification, subscription, active, date }) => {
    if (search !== undefined) setSearchText(search);
    if (verification !== undefined) setVerificationFilter(verification);
    if (subscription !== undefined) setSubscriptionFilter(subscription);
    if (active !== undefined) setActiveFilter(active);
    if (date !== undefined) setDateFilter(date);
    setCurrentPage(1);
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <ShopsHeader
        searchText={searchText}
        setSearchText={(v) => handleFilterChange({ search: v })}
        verificationFilter={verificationFilter}
        setVerificationFilter={(v) => handleFilterChange({ verification: v })}
        subscriptionFilter={subscriptionFilter}
        setSubscriptionFilter={(v) => handleFilterChange({ subscription: v })}
        activeFilter={activeFilter}
        setActiveFilter={(v) => handleFilterChange({ active: v })}
        dateFilter={dateFilter}
        setDateFilter={(v) => handleFilterChange({ date: v })}
        shops={shops}
        totalItems={totalItems}
      />

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <ShopsTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          shops={shops}
          loading={loading}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
          onShopUpdate={handleShopUpdate}
        />
      </div>
    </div>
  );
};

export default ShopsPage;