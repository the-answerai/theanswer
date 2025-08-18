import Papa from 'papaparse'

export interface ParsedCsvResult {
  headers: string[]
  rows: string[][]
  rowObjects: Record<string, string>[]
}

/**
 * Normalize CSV to make it RFC 4180 compliant
 * Handles field-level normalization instead of line-level to preserve column structure
 */
function normalizeCsv(input: string): string {
  const lines = input.split('\n')
  const normalizedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed === '') return trimmed
    
    // Split by commas and normalize each field individually
    const fields = trimmed.split(',')
    const normalizedFields = fields.map(field => {
      const trimmedField = field.trim()
      if (trimmedField === '') return trimmedField
      
      // If field contains commas or quotes, it needs proper quoting
      if (trimmedField.includes(',') || trimmedField.includes('"')) {
        const escaped = trimmedField.replace(/"/g, '""')
        return `"${escaped}"`
      }
      
      return trimmedField
    })
    
    return normalizedFields.join(',')
  })
  
  return normalizedLines.join('\n')
}



/**
 * Parse CSV content using RFC 4180 compliant parser
 */
export function parseCsvRfc4180(input: string): ParsedCsvResult {
  try {
    // Step 1: Try parsing with headers first (most common case)
    try {
      return parseWithHeaders(input)
    } catch (headerError) {
      console.warn('Header parsing failed, trying with normalization:', headerError)
      
      // Step 2: If headers fail, try with normalized input
      try {
        const normalizedInput = normalizeCsv(input)
        return parseWithHeaders(normalizedInput)
      } catch (normalizedError) {
        console.warn('Normalized header parsing also failed, falling back to no-headers parsing:', normalizedError)
        
        // Step 3: If both fail, try without headers as last resort
        return parseWithoutHeaders(input)
      }
    }
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message)
    }
    throw new Error('Failed to parse CSV file. Please check the file format and try again.')
  }
}

/**
 * Parse CSV with headers
 */
function parseWithHeaders(input: string): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(input.trim(), {
    header: true,
    skipEmptyLines: true,
    comments: '#',
    transformHeader: (header) => header.trim() // Clean up header names
  })

  // Be more lenient with errors - only fail on critical ones
  if (result.errors && result.errors.length > 0) {
    const criticalErrors = result.errors.filter(e => 
      e.type === 'Delimiter' || e.type === 'Quotes' || e.type === 'FieldMismatch'
    )
    if (criticalErrors.length > 0) {
      const errorMessages = criticalErrors.slice(0, 3).map((e) => e.message || 'CSV parsing error')
      throw new Error(errorMessages.join('; '))
    }
  }

  const headers = result.meta.fields || []
  if (headers.length === 0) {
    throw new Error('CSV has no header row or headers could not be determined.')
  }

  // Filter out empty header names
  const cleanHeaders = headers.filter(header => header && header.trim() !== '')
  if (cleanHeaders.length === 0) {
    throw new Error('CSV has no valid header names.')
  }

  const rowObjects = result.data || []
  if (rowObjects.length === 0) {
    throw new Error('CSV file has no data rows.')
  }

  const rows = rowObjects.map((obj) => cleanHeaders.map((k) => (obj[k] ?? '').toString()))

  // Be more lenient with column count mismatches
  const maxColumns = Math.max(...rows.map(r => r.length), cleanHeaders.length)
  const normalizedRows = rows.map(row => {
    while (row.length < maxColumns) {
      row.push('') // Pad with empty strings for missing columns
    }
    return row.slice(0, maxColumns) // Trim excess columns
  })

  return { headers: cleanHeaders, rows: normalizedRows, rowObjects }
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
  const headers = firstRow.map((_, index) => `Column ${index + 1}`)
  
  // Create row objects with actual column structure
  const rowObjects = rows.map((row, rowIndex) => {
    const obj: Record<string, string> = {}
    headers.forEach((header, colIndex) => {
      obj[header] = row[colIndex] || ''
    })
    return obj
  })

  return { headers, rows, rowObjects }
}
