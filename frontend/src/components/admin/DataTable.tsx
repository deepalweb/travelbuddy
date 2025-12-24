import React, { useState, useMemo } from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowAction?: (action: string, row: any) => void;
  bulkActions?: { label: string; value: string }[];
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  rowKey?: string;
  pageSize?: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowAction,
  bulkActions,
  onBulkAction,
  rowKey = '_id',
  pageSize: initialPageSize = 25
}) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(c => c.key))
  );

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row[rowKey])));
    }
  };

  const exportCSV = () => {
    const headers = columns.filter(c => visibleColumns.has(c.key)).map(c => c.label);
    const rows = sortedData.map(row =>
      columns
        .filter(c => visibleColumns.has(c.key))
        .map(c => {
          const val = row[c.key];
          return typeof val === 'object' ? JSON.stringify(val) : val;
        })
    );
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
  };

  const visibleCols = columns.filter(c => visibleColumns.has(c.key));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2 items-center">
          {bulkActions && selectedRows.size > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value && onBulkAction) {
                  onBulkAction(e.target.value, Array.from(selectedRows));
                  setSelectedRows(new Set());
                }
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Bulk Actions ({selectedRows.size})</option>
              {bulkActions.map(action => (
                <option key={action.value} value={action.value}>{action.label}</option>
              ))}
            </select>
          )}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {bulkActions && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
              )}
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map(row => (
              <tr key={row[rowKey]} className="hover:bg-gray-50">
                {bulkActions && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row[rowKey])}
                      onChange={() => toggleRow(row[rowKey])}
                      className="rounded"
                    />
                  </td>
                )}
                {visibleCols.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
