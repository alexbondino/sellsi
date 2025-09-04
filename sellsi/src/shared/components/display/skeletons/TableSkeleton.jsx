import React from 'react';
import { Box, Paper, Skeleton } from '@mui/material';

// Generic table skeleton: configurable rows, columns, avatar column, action column widths
const TableSkeleton = ({ rows = 6, columns = 5, withAvatar = false }) => {
  const colArray = Array.from({ length: columns });
  return (
    <Paper sx={{ p: 0 }}>
      <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Skeleton variant="text" width={140} height={28} />
        <Skeleton variant="rounded" width={180} height={38} />
      </Box>
      {Array.from({ length: rows }).map((_, r) => (
        <Box key={r} sx={{ display: 'flex', px: 2, py: 1.5, alignItems: 'center', borderTop: r === 0 ? '1px solid rgba(0,0,0,0.08)' : 'none', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          {withAvatar && (
            <Skeleton variant="rounded" width={72} height={72} sx={{ mr: 2 }} />
          )}
          {colArray.map((__, c) => (
            <Skeleton
              // vary widths slightly for visual rhythm
              key={c}
              variant="text"
              width={c === colArray.length - 1 ? 110 : 160 - ((c * 7) % 40)}
              height={24}
              sx={{ mr: 3, flexShrink: 0 }}
            />
          ))}
        </Box>
      ))}
    </Paper>
  );
};

export default TableSkeleton;
