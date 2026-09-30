"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook dùng chung cho các trang danh sách: gọi service.getAll(), quản lý
 * đầy đủ 4 trạng thái (loading / có dữ liệu / rỗng / lỗi) và cho phép reload.
 */
export function useCrudList(service, params) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await service.getAll(params);
      setData(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [service]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}

export function usePagination(items, pageSize) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    totalItems: items.length,
  };
}
