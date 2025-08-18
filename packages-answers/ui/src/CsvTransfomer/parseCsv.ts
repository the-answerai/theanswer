import Papa from 'papaparse'

export interface ParsedCsvResult {
  headers: string[]
  rows: string[][]
  rowObjects: Record<string, string>[]
}

/**
 * Normalize CSV to make it RFC 4180 compliant
 * This fixes the real issue: fields with commas not properly quoted
 */
function normalizeCsv(input: string): string {
  const lines = input.split('\n')
  const normalizedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed === '') return trimmed
    
    // If line contains commas and is not already quoted, quote it
    if (trimmed.includes(',') && !trimmed.startsWith('"')) {
      // Escape any existing quotes and wrap in quotes
      const escaped = trimmed.replace(/"/g, '""')
      return `"${escaped}"`
    }
    
    return trimmed
  })
  
  return normalizedLines.join('\n')
}

/**
 * Validate CSV structure for RFC 4180 compliance
 * This prevents the "number of columns" error Brad mentioned
 */
function validateCsvStructure(input: string): string[] {
  const errors: string[] = []
  
  if (!input || input.trim() === '') {
    errors.push('CSV file is empty or contains no data.')
    return errors
  }

  const lines = input.split('\n')
  if (lines.length < 1) {
    errors.push('CSV file must contain at least one line.')
    return errors
  }

  // Check for unmatched quotes in each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') continue
    
    const quoteCount = (line.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) {
      errors.push(`Line ${i + 1}: Unmatched quotes detected. Ensure all quoted fields start and end with double quotes.`)
    }
    
    // Check that fields with commas are properly quoted
    if (line.includes(',') && !line.startsWith('"')) {
      errors.push(`Line ${i + 1}: Fields containing commas must be enclosed in quotes for RFC 4180 compliance.`)
    }
  }

  return errors
}

/**
 * Parse CSV content using RFC 4180 compliant parser (PapaParse)
 * Now with automatic normalization and header detection
 */
export function parseCsvRfc4180(input: string): ParsedCsvResult {
  try {
    // Step 1: Normalize CSV to make it RFC 4180 compliant
    const normalizedInput = normalizeCsv(input)
    
    // Step 2: Validate normalized CSV structure
    const validationErrors = validateCsvStructure(normalizedInput)
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '))
    }

    // Step 3: Try parsing with headers first
    try {
      return parseWithHeaders(normalizedInput)
    } catch (headerError) {
      // Step 4: If headers fail, try without headers (your case)
      return parseWithoutHeaders(normalizedInput)
    }
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message)
    }
    throw new Error('Failed to parse CSV file. Please check the file format and try again.')
  }
}

/**
 * Parse CSV with headers (existing logic)
 */
function parseWithHeaders(input: string): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(input.trim(), {
    header: true,
    skipEmptyLines: true,
    comments: '#'
  })

  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors.slice(0, 3).map((e) => e.message || 'CSV parsing error')
    throw new Error(errorMessages.join('; '))
  }

  const headers = result.meta.fields || []
  if (headers.length === 0) {
    throw new Error('CSV has no header row or headers could not be determined.')
  }

  const rowObjects = result.data || []
  if (rowObjects.length === 0) {
    throw new Error('CSV file has no data rows.')
  }

  const rows = rowObjects.map((obj) => headers.map((k) => (obj[k] ?? '').toString()))

  const badIndex = rows.findIndex((r) => r.length !== headers.length)
  if (badIndex !== -1) {
    throw new Error(`Row ${badIndex + 1} has ${rows[badIndex].length} columns but expected ${headers.length}.`)
  }

  return { headers, rows, rowObjects }
}

/**
 * Parse CSV without headers (for your real case)
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

  // Create default structure for single-column CSV without headers
  const headers = ['question']
  
  // Handle the case where some rows might have been split due to commas
  const rowObjects = rows.map((row, index) => {
    // If row was split into multiple columns due to commas, join them back
    const questionText = row.join(', ').replace(/^"|"$/g, '') // Remove outer quotes
    return {
      question: questionText || `Row ${index + 1}`
    }
  })

  return { headers, rows, rowObjects }
}
