/******************************************************************************
 DashboardTable.utils.js
******************************************************************************/

export const sortRows = (rows, sort) => {
  if (!sort?.key) return rows;

  return [...rows].sort((a, b) => {
    const aValue = a?.[sort.key];
    const bValue = b?.[sort.key];

    if (aValue === bValue) return 0;

    if (sort.direction === "asc") {
      return aValue > bValue ? 1 : -1;
    }

    return aValue < bValue ? 1 : -1;
  });
};

export const searchRows = (rows, keyword) => {
  if (!keyword) return rows;

  const text = keyword.toLowerCase();

  return rows.filter((row) =>
    [
      row.subject,
      row.sender,
      row.senderEmail,
      row.company,
    ]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(text)
      )
  );
};

export const filterRows = (rows, filters) => {
  return rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value || value === "" || value === "All") {
        return true;
      }

      return row[key] === value;
    })
  );
};

export const paginateRows = (
  rows,
  page,
  pageSize
) => {
  const start = (page - 1) * pageSize;

  return rows.slice(start, start + pageSize);
};

export const calculateMetrics = (rows) => {
  const replied = rows.filter(
    (r) => r.status === "Replied"
  ).length;

  const pending = rows.filter(
    (r) => r.status === "Pending"
  ).length;

  const highPriority = rows.filter(
    (r) => r.priority === "High"
  ).length;

  return {
    totalEmails: rows.length,
    replied,
    pending,
    highPriority,
    responseRate:
      rows.length === 0
        ? 0
        : Math.round((replied / rows.length) * 100),
  };
};

export const exportData = (
  rows,
  selectedRows
) => {
  if (!selectedRows.length) return rows;

  return rows.filter((row) =>
    selectedRows.includes(row.id)
  );
};