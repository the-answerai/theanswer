/**
 * Unstructured API Service
 *
 * This module provides functions to interact with the Unstructured library
 * running in a Docker container.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execPromise = promisify(exec)

// Docker container name
const CONTAINER_NAME = 'unstructured-api'

/**
 * Process a file using Unstructured and return structured elements
 *
 * @param {string} filePath - Path to the file to process
 * @param {Object} options - Additional options for processing
 * @returns {Promise<Array>} - Array of structured elements extracted from the file
 */
export async function processFile(filePath, options = {}) {
    try {
        if (!(await fileExists(filePath))) {
            throw new Error(`File does not exist: ${filePath}`)
        }

        // Get absolute path and container path for the file
        const absFilePath = path.resolve(filePath)
        const fileName = path.basename(absFilePath)
        const containerFilePath = `/app/uploads/${fileName}`

        // Create a temporary Python script to run inside the container
        const pythonScriptPath = await createProcessingScript(options)

        // Copy the file to the container
        await execPromise(`docker cp "${absFilePath}" ${CONTAINER_NAME}:/app/uploads/`)

        // Run the Python script inside the container
        const { stdout } = await execPromise(`docker exec ${CONTAINER_NAME} python3 ${pythonScriptPath} "${containerFilePath}"`)

        // Parse the JSON output
        return JSON.parse(stdout)
    } catch (error) {
        console.error('Error processing file with Unstructured:', error)
        throw error
    }
}

/**
 * Check if the Unstructured container is available
 *
 * @returns {Promise<boolean>} - True if container is available, false otherwise
 */
export async function checkApiStatus() {
    try {
        const { stdout } = await execPromise(`docker ps -q -f "name=${CONTAINER_NAME}"`)
        return stdout.trim() !== ''
    } catch (error) {
        console.error('Error checking Unstructured container status:', error)
        return false
    }
}

/**
 * Extract text from a file using Unstructured
 *
 * @param {string} filePath - Path to the file to process
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractText(filePath) {
    const elements = await processFile(filePath)

    // Combine all text elements into a single string
    return elements
        .filter((element) => element.text?.trim())
        .map((element) => element.text)
        .join('\n')
}

/**
 * Check if a file exists
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if file exists, false otherwise
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

/**
 * Create a temporary Python script for processing the file
 *
 * @param {Object} options - Processing options
 * @returns {Promise<string>} - Path to the created Python script inside the container
 */
async function createProcessingScript(options) {
    const scriptContent = `
import sys
import json
from unstructured.partition.auto import partition

# Get the file path from command line arguments
file_path = sys.argv[1]

# Process the file
elements = partition(
    filename=file_path,
    ${options.strategy ? `strategy="${options.strategy}",` : ''}
    ${options.coordinates ? `coordinates=${options.coordinates},` : ''}
    ${options.hierarchical ? `hierarchical=${options.hierarchical},` : ''}
)

# Convert elements to dictionaries
element_dicts = []
for element in elements:
    # Convert the element to a simple dictionary with primitive types
    element_dict = {
        "type": element.__class__.__name__,
        "text": element.text
    }
    
    # Only add metadata if it exists and convert to dict
    if hasattr(element, "metadata"):
        # Convert metadata to a simple dict with only primitive values
        metadata = {}
        for key, value in vars(element.metadata).items():
            if isinstance(value, (str, int, float, bool, type(None))):
                metadata[key] = value
            else:
                metadata[key] = str(value)
        element_dict["metadata"] = metadata
    
    element_dicts.append(element_dict)

# Print JSON output
print(json.dumps(element_dicts))
`

    const tempScriptPath = '/app/process_file.py'

    // Write the script to a temporary file
    const localScriptPath = path.join(process.cwd(), 'temp_process_file.py')
    await fs.writeFile(localScriptPath, scriptContent)

    // Copy the script to the container
    await execPromise(`docker cp "${localScriptPath}" ${CONTAINER_NAME}:${tempScriptPath}`)

    // Remove the temporary local file
    await fs.unlink(localScriptPath)

    return tempScriptPath
}

export default {
    processFile,
    checkApiStatus,
    extractText
}
