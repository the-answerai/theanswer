import React from 'react'
import TableWrapper from '../../components/TableWrapper'
import { Typography, Link } from '@mui/material'
import { isValidUrl } from '../../utils/isValidUrl'

interface RawDataTableProps {
    columns: string[]
    rows: string[][]
}

const RawDataTable: React.FC<RawDataTableProps> = ({ columns, rows }) => {
    if (!rows || rows.length === 0) {
        return <Typography color='text.secondary'>No CSV data found.</Typography>
    }
    return (
        <TableWrapper
            columns={columns}
            rows={rows}
            renderCell={(cell) =>
                isValidUrl(cell) ? (
                    <Link href={cell} target='_blank' rel='noopener noreferrer'>
                        {cell}
                    </Link>
                ) : (
                    cell
                )
            }
        />
    )
}

export default RawDataTable
