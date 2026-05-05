import Papa from 'papaparse'

export interface ParsedCsvResult {
    headers: string[]
    rows: string[][]
}

/**
 * Generate consistent column name for CSV parsing
 * @param index - Zero-based column index
 * @returns Standardized column name (e.g., "Column 1", "Column 2")
 */
function generateColumnName(index: number): string {
    return `Column ${index + 1}`
}

/**
 * Strip BOM, zero-width, and format chars so headers are not visually blank in the UI.
 */
function sanitizeHeaderLabel(raw: string): string {
    return String(raw ?? '')
        .replace(/^\uFEFF/, '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
}

/** Readable label for chips and UI (handles invisible-only header cells). */
export function formatCsvHeaderForUi(raw: string, columnIndex?: number): string {
    const v = sanitizeHeaderLabel(String(raw ?? ''))
    if (v) return v
    return typeof columnIndex === 'number' ? generateColumnName(columnIndex) : 'Column'
}

/**
 * Parse CSV content using RFC 4180 compliant parser with headers
 */
export function parseCsvWithHeaders(input: string): ParsedCsvResult {
    return parseWithHeaders(input)
}

/**
 * Parse CSV content using RFC 4180 compliant parser without headers
 */
export function parseCsvWithoutHeaders(input: string): ParsedCsvResult {
    return parseWithoutHeaders(input)
}

/**
 * Parse CSV with headers
 */
function parseWithHeaders(input: string): ParsedCsvResult {
    const headerCounts = new Map<string, number>()

    const result = Papa.parse<Record<string, string>>(input.trim(), {
        header: true,
        skipEmptyLines: true,
        comments: '#',
        transformHeader: (header, index) => {
            const colIndex = typeof index === 'number' ? index : 0
            let base = sanitizeHeaderLabel(String(header ?? ''))
            if (!base) {
                base = generateColumnName(colIndex)
            }
            const n = (headerCounts.get(base) ?? 0) + 1
            headerCounts.set(base, n)
            return n === 1 ? base : `${base} (${n})`
        }
    })

    // Be very lenient with errors - Papa Parse can handle most cases
    if (result.errors && result.errors.length > 0) {
        const criticalErrors = result.errors.filter(
            (e) => e.type === 'Quotes' && e.code === 'InvalidQuotes' // Only fail on malformed quotes
        )
        if (criticalErrors.length > 0) {
            const errorMessages = criticalErrors.slice(0, 3).map((e) => e.message || 'CSV parsing error')
            throw new Error(errorMessages.join('; '))
        }
        // Ignore delimiter detection warnings - Papa Parse handles this gracefully
    }

    const headers = result.meta.fields || []
    if (headers.length === 0) {
        throw new Error('CSV has no header row or headers could not be determined.')
    }

    // After transformHeader, names should be non-empty; keep only real labels
    const cleanHeaders = headers.filter((h) => sanitizeHeaderLabel(h) !== '')
    if (cleanHeaders.length === 0) {
        throw new Error('CSV has no valid header names.')
    }

    const rowObjects = result.data || []
    if (rowObjects.length === 0) {
        throw new Error('CSV file has no data rows.')
    }

    const rows = rowObjects.map((obj) => cleanHeaders.map((k) => (obj[k] ?? '').toString()))

    // Be more lenient with column count mismatches
    const maxColumns = Math.max(...rows.map((r) => r.length), cleanHeaders.length)
    const normalizedRows = rows.map((row) => {
        while (row.length < maxColumns) {
            row.push('') // Pad with empty strings for missing columns
        }
        return row.slice(0, maxColumns) // Trim excess columns
    })

    return { headers: cleanHeaders, rows: normalizedRows }
}

/**
 * Parse CSV without headers
 */
function parseWithoutHeaders(input: string): ParsedCsvResult {
    const result = Papa.parse(input.trim(), {
        header: false,
        skipEmptyLines: true,
        comments: '#'
    })

    const rows = result.data as string[][]
    if (rows.length === 0) {
        throw new Error('CSV file has no data rows.')
    }

    // Detect actual CSV structure from the first row
    const firstRow = rows[0]
    if (!firstRow || firstRow.length === 0) {
        throw new Error('CSV file has no valid data in first row.')
    }

    // Create headers based on actual column count
    const headers = firstRow.map((_, index) => generateColumnName(index))

    return { headers, rows }
}
