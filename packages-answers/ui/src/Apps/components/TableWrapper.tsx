import React from 'react'
import { TableContainer, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'

interface TableWrapperProps {
    columns: string[]
    rows: string[][]
    renderCell?: (cell: string, rowIdx: number, colIdx: number) => React.ReactNode
}

const TableWrapper: React.FC<TableWrapperProps> = ({ columns, rows, renderCell }) => (
    <TableContainer component={Paper} sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
        <Table>
            <TableHead>
                <TableRow>
                    {columns.map((col, idx) => (
                        <TableCell key={idx} align='center'>
                            {col}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map((row, rIdx) => (
                    <TableRow key={rIdx}>
                        {row.map((cell, cIdx) => (
                            <TableCell key={cIdx} align='center'>
                                {renderCell ? renderCell(cell, rIdx, cIdx) : cell}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
)

export default TableWrapper
