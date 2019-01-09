import React, { memo } from 'react';
import { format } from 'd3';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@material-ui/core';

const formatter = format('.4f');

const StatisticsTable = memo(({ y }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>name</TableCell>
          <TableCell>mean</TableCell>
          <TableCell>standard deviation</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(y).map(([key, { average, stddev }]) => (
          <TableRow key={key}>
            <TableCell>{key}</TableCell>
            <TableCell>
              {formatter(average)}
              nm
            </TableCell>
            <TableCell>
              {formatter(stddev)}
              nm
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

export default StatisticsTable;
