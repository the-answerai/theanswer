import { useRef, useEffect, useState } from 'react'
import { Box, Typography, Tooltip, Paper, IconButton, FormControlLabel, Switch, useTheme, Chip, Button } from '@mui/material'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RefreshIcon from '@mui/icons-material/Refresh'
import LabelIcon from '@mui/icons-material/Label'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import axios from 'axios'

// Library for dimensionality reduction (t-SNE)
// Since we're dealing with high-dimensional embeddings, we need to project them to 2D
// We'll use a basic approach with PCA-like dimensionality reduction
const reduceEmbeddingDimensions = (embeddings) => {
    try {
        // Create a matrix of embeddings, ensuring each embedding is an array
        const matrix = embeddings.filter((doc) => doc.embedding && Array.isArray(doc.embedding)).map((doc) => doc.embedding)

        // Check if we have enough valid embeddings to proceed
        if (matrix.length === 0) {
            console.error('No valid embeddings found for visualization')
            return embeddings.map(() => [Math.random() * 100, Math.random() * 100]) // Return random positions as fallback
        }

        // Ensure all vectors have the same dimension
        const dimensions = matrix[0].length

        // Calculate mean of each dimension
        const mean = Array(dimensions).fill(0)

        for (const vector of matrix) {
            // Skip invalid vectors
            if (!Array.isArray(vector) || vector.length !== dimensions) continue

            for (let i = 0; i < dimensions; i++) {
                mean[i] += vector[i] / matrix.length
            }
        }

        // Center the data
        const centered = matrix.map((vector) => {
            // Skip invalid vectors
            if (!Array.isArray(vector) || vector.length !== dimensions) {
                return Array(dimensions).fill(0) // Return zero vector as fallback
            }

            return vector.map((value, i) => value - mean[i])
        })

        // Take first two principal components (simplified)
        // This is a very simple approach - in production use a proper PCA/t-SNE implementation
        const result = centered.map((vector) => {
            // Use first dimension directly
            const x = vector[0] * 100

            // For the second dimension, use a combination of a few dimensions
            let y = 0
            for (let i = 1; i < Math.min(5, dimensions); i++) {
                y += vector[i] * (10 / i)
            }

            return [x, y]
        })

        return result
    } catch (error) {
        console.error('Error reducing embedding dimensions:', error)
        // Return random positions as fallback
        return embeddings.map(() => [Math.random() * 100, Math.random() * 100])
    }
}

// Function to cluster documents based on similarity
const clusterDocuments = (coordinates, numClusters = 5) => {
    console.log(`Clustering ${coordinates.length} documents into ${numClusters} clusters`)

    // Simple k-means inspired clustering
    // Initialize with centroids at different positions around a smaller circle to ensure they're in viewport
    const centroids = Array(numClusters)
        .fill(0)
        .map((_, i) => {
            const angle = (i / numClusters) * 2 * Math.PI
            const radius = 50 // Smaller radius to keep clusters closer to center
            return [Math.cos(angle) * radius, Math.sin(angle) * radius]
        })

    console.log('Initial centroids:', centroids)

    const maxIterations = 15

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Assign points to clusters
        const clusters = Array(numClusters)
            .fill(0)
            .map(() => [])

        for (const [idx, coord] of coordinates.entries()) {
            // Find closest centroid
            let minDist = Number.POSITIVE_INFINITY
            let closestCluster = 0

            for (let i = 0; i < centroids.length; i++) {
                const centroid = centroids[i]
                const dist = Math.sqrt((coord[0] - centroid[0]) ** 2 + (coord[1] - centroid[1]) ** 2)

                if (dist < minDist) {
                    minDist = dist
                    closestCluster = i
                }
            }

            clusters[closestCluster].push({ coord, idx })
        }

        // Update centroids
        let changed = false
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i]
            if (cluster.length === 0) continue

            const newCentroid = [0, 0]
            for (const { coord } of cluster) {
                newCentroid[0] += coord[0] / cluster.length
                newCentroid[1] += coord[1] / cluster.length
            }

            // Check if centroid moved significantly
            if (Math.abs(newCentroid[0] - centroids[i][0]) > 0.1 || Math.abs(newCentroid[1] - centroids[i][1]) > 0.1) {
                changed = true
            }

            centroids[i] = newCentroid
        }

        // If centroids didn't change much, we've converged
        if (!changed && iteration > 2) {
            console.log(`Clustering converged after ${iteration + 1} iterations`)
            break
        }
    }

    // Assign cluster IDs to all points
    const clusterAssignments = Array(coordinates.length).fill(0)

    for (const [idx, coord] of coordinates.entries()) {
        let minDist = Number.POSITIVE_INFINITY
        let closestCluster = 0

        for (let i = 0; i < centroids.length; i++) {
            const centroid = centroids[i]
            const dist = Math.sqrt((coord[0] - centroid[0]) ** 2 + (coord[1] - centroid[1]) ** 2)

            if (dist < minDist) {
                minDist = dist
                closestCluster = i
            }
        }

        clusterAssignments[idx] = closestCluster
    }

    // Count documents per cluster
    const clusterCounts = {}
    for (const clusterId of clusterAssignments) {
        clusterCounts[clusterId] = (clusterCounts[clusterId] || 0) + 1
    }
    console.log('Final cluster distribution:', clusterCounts)

    return { clusterAssignments, centroids }
}

const DocumentEmbeddingVisualizer = ({ documents }) => {
    const svgRef = useRef(null)
    const [showLabels, setShowLabels] = useState(true)
    const [tooltipInfo, setTooltipInfo] = useState(null)
    const [simulation, setSimulation] = useState(null)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [status, setStatus] = useState({ isValid: true, message: '' })
    const [clusterLabels, setClusterLabels] = useState({})
    const [isGeneratingLabels, setIsGeneratingLabels] = useState(false)
    const theme = useTheme() // Get the current theme
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [clusterData, setClusterData] = useState(null)

    // Toggle labels
    const handleToggleLabels = () => {
        setShowLabels(!showLabels)
    }

    // Zoom handlers
    const handleZoomIn = () => {
        setZoomLevel(Math.min(zoomLevel + 0.2, 3))
    }

    const handleZoomOut = () => {
        setZoomLevel(Math.max(zoomLevel - 0.2, 0.5))
    }

    // Reset simulation
    const handleReset = () => {
        if (simulation) {
            simulation.alpha(1).restart()
        }
    }

    // Function to generate cluster labels using LLM
    const generateClusterLabels = async () => {
        if (!clusterData) return

        setIsGeneratingLabels(true)

        try {
            // For each cluster, extract documents and get an LLM summary
            const clusters = Object.entries(clusterData)
            const labelPromises = clusters.map(async ([clusterId, data]) => {
                // Get sample text from each document in the cluster (limit to save tokens)
                const sampleTexts = data.nodes.slice(0, 5).map((node) => {
                    const doc = documents.find((d) => d.id === node.id)
                    if (!doc) return ''

                    // Use document content if available or title as fallback
                    const content = doc.metadata?.content || doc.metadata?.text || doc.title
                    // Limit text length
                    return content ? content.substring(0, 200) : doc.title
                })

                // Create a prompt for the LLM
                const prompt = `
          I have a group of ${data.nodes.length} similar documents based on their embedding vectors.
          Here are samples from ${Math.min(5, data.nodes.length)} of them:
          ${sampleTexts.map((text, i) => `Document ${i + 1}: "${text}"`).join('\n')}
          
          What's a short phrase (3-5 words maximum) that describes the common theme or topic of these documents?
          Reply ONLY with the label phrase, nothing else.
        `

                try {
                    // Call the AnswerAI API through our backend endpoint
                    const response = await axios.post('/api/analyzer/process-with-answerai', {
                        prompt: prompt,
                        max_tokens: 25 // Keep the response short
                    })

                    // Extract the label from the response
                    const label = response.data?.text?.trim() || `Cluster ${clusterId}`

                    return { clusterId, label }
                } catch (err) {
                    console.warn(`Error generating label for cluster ${clusterId}:`, err)
                    return { clusterId, label: `Cluster ${clusterId}` }
                }
            })

            // Wait for all labels to be generated
            const results = await Promise.all(labelPromises)

            // Create a map of cluster IDs to labels
            const newLabels = results.reduce((acc, { clusterId, label }) => {
                acc[clusterId] = label
                return acc
            }, {})

            setClusterLabels(newLabels)
        } catch (err) {
            console.error('Error generating cluster labels:', err)
        } finally {
            setIsGeneratingLabels(false)
        }
    }

    // Validate documents on mount
    useEffect(() => {
        try {
            console.log('Validating documents for visualization:', documents.length)

            // Check if we have documents
            if (!documents || documents.length === 0) {
                setStatus({
                    isValid: false,
                    message: 'No documents provided for visualization'
                })
                return
            }

            // Check if we have embeddings
            const validDocs = documents.filter(
                (doc) =>
                    doc.embedding &&
                    (Array.isArray(doc.embedding) || (typeof doc.embedding === 'object' && doc.embedding.length !== undefined))
            )

            console.log(`Found ${validDocs.length} documents with valid embeddings out of ${documents.length}`)

            if (validDocs.length === 0) {
                setStatus({
                    isValid: false,
                    message: 'None of the documents have valid embedding data'
                })
                return
            }

            if (validDocs.length < documents.length) {
                console.warn(`${documents.length - validDocs.length} documents have invalid embeddings`)
            }

            // Check the first valid embedding
            const firstEmbedding = validDocs[0].embedding
            console.log(
                'Sample embedding:',
                typeof firstEmbedding,
                Array.isArray(firstEmbedding),
                firstEmbedding ? firstEmbedding.length : 0
            )

            setStatus({ isValid: true, message: '' })
        } catch (err) {
            console.error('Error validating documents:', err)
            setStatus({
                isValid: false,
                message: `Error validating documents: ${err.message}`
            })
        }
    }, [documents])

    useEffect(() => {
        if (!documents || documents.length === 0 || !svgRef.current) {
            return
        }

        try {
            // Validate documents have proper embeddings
            const validDocuments = documents.filter((doc) => doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0)

            if (validDocuments.length === 0) {
                console.error('No documents with valid embeddings found')
                return
            }

            // Clear any existing visualization
            d3.select(svgRef.current).selectAll('*').remove()

            // SVG dimensions
            const width = svgRef.current.clientWidth
            const height = 600

            // Create SVG with theme-aware background
            const svg = d3
                .select(svgRef.current)
                .attr('width', width)
                .attr('height', height)
                .style('background', theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper)

            // Create a group for zoom/pan
            const g = svg.append('g')

            // Add zoom behavior
            const zoom = d3
                .zoom()
                .scaleExtent([0.5, 5])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform)
                })

            svg.call(zoom)

            // Update zoom based on zoomLevel state
            svg.call(zoom.transform, d3.zoomIdentity.scale(zoomLevel))

            // Reduce embedding dimensions for visualization
            const coordinates = reduceEmbeddingDimensions(validDocuments)

            // Calculate optimal number of clusters based on dataset size
            const numClusters = Math.min(10, Math.max(3, Math.ceil(validDocuments.length / 10)))

            // Cluster documents based on their 2D coordinates
            const { clusterAssignments } = clusterDocuments(coordinates, numClusters)

            // Count the actual number of clusters used
            const uniqueClusters = [...new Set(clusterAssignments)]
            console.log('Unique clusters used:', uniqueClusters)

            // Define highly contrasting colors for better distinction
            const distinctColors = [
                '#FF0000', // Red
                '#00FF00', // Green
                '#0000FF', // Blue
                '#FFFF00', // Yellow
                '#FF00FF', // Magenta
                '#00FFFF', // Cyan
                '#FF8000', // Orange
                '#8000FF', // Purple
                '#0080FF', // Light Blue
                '#FF0080', // Pink
                '#80FF00', // Lime
                '#FF8080' // Light Red
            ]

            // Create nodes data with explicitly assigned cluster colors
            const nodes = validDocuments.map((doc, i) => {
                // Calculate cluster
                const cluster = clusterAssignments[i]

                return {
                    id: doc.id,
                    title: doc.title || `Document ${doc.id}`,
                    metadata: doc.metadata,
                    x: coordinates[i][0] + width / 2,
                    y: coordinates[i][1] + height / 2,
                    radius: 8, // Default circle radius
                    cluster: cluster, // Assign cluster ID
                    // Directly embed the color based on cluster for debugging
                    color: distinctColors[cluster % distinctColors.length]
                }
            })

            // Log all nodes to verify color assignment
            console.log(
                'Nodes with colors:',
                nodes.map((n) => ({ id: n.id, cluster: n.cluster, color: n.color }))
            )

            // Create a force simulation with stronger clustering but tighter grouping
            const sim = d3
                .forceSimulation(nodes)
                .force('charge', d3.forceManyBody().strength(-30)) // Reduced repulsion strength
                .force('center', d3.forceCenter(width / 2, height / 2).strength(0.2)) // Stronger centering force
                .force(
                    'collision',
                    d3.forceCollide().radius((d) => d.radius + 1)
                ) // Smaller collision radius
                .force('x', d3.forceX(width / 2).strength(0.1)) // Stronger force toward center
                .force('y', d3.forceY(height / 2).strength(0.1)) // Stronger force toward center
                // Add stronger cluster forces to make the clusters more distinct but compact
                .force('cluster', (alpha) => {
                    // Calculate weighted cluster centers, but position them closer to the center
                    const clusterCenters = {}

                    for (const d of nodes) {
                        if (!clusterCenters[d.cluster]) {
                            // Calculate a position for this cluster on a circle around the center
                            const angle = (Number.parseInt(d.cluster) / numClusters) * 2 * Math.PI
                            const radius = Math.min(width, height) * 0.25 // 25% of the smaller dimension

                            clusterCenters[d.cluster] = {
                                x: width / 2 + Math.cos(angle) * radius, // Position around center
                                y: height / 2 + Math.sin(angle) * radius, // Position around center
                                count: 0,
                                angle: angle // Store the angle for reference
                            }
                        }
                        clusterCenters[d.cluster].count += 1
                    }

                    // Apply force toward cluster center with stronger pull
                    const clusterStrength = 0.5 * alpha // Stronger cluster force
                    for (const d of nodes) {
                        const center = clusterCenters[d.cluster]
                        if (center) {
                            // Pull more strongly toward the predefined center position
                            d.vx += (center.x - d.x) * clusterStrength
                            d.vy += (center.y - d.y) * clusterStrength
                        }
                    }
                })

            // Save simulation to state for restarting later
            setSimulation(sim)

            // Draw clusters as circle backgrounds with direct color assignment
            g.selectAll('.cluster-background')
                .data(Object.entries(d3.group(nodes, (d) => d.cluster)))
                .enter()
                .append('circle')
                .attr('class', 'cluster-background')
                .attr('fill', ([clusterId]) => {
                    // Use modulo to ensure we stay within the color array bounds
                    const color = distinctColors[Number.parseInt(clusterId) % distinctColors.length]
                    console.log(`Cluster ${clusterId} background gets color ${color}`)
                    return color
                })
                .attr('opacity', 0.2)
                .attr('r', 60) // Initial radius, will be updated on tick
                .attr('stroke', theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5')

            // Draw circles for nodes with explicitly assigned colors
            const circles = g
                .selectAll('.node')
                .data(nodes)
                .enter()
                .append('circle')
                .attr('class', 'node')
                .attr('r', (d) => d.radius)
                .attr('fill', (d) => {
                    // Use the directly embedded color from the node
                    console.log(`Node ${d.id} in cluster ${d.cluster} gets color ${d.color}`)
                    return d.color
                })
                .attr('stroke', theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
                .attr('stroke-width', 1.5)
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    // Show tooltip
                    setTooltipInfo({
                        x: event.pageX,
                        y: event.pageY,
                        title: d.title,
                        metadata: d.metadata,
                        cluster: d.cluster
                    })

                    // Highlight the node
                    d3.select(event.target)
                        .attr('stroke', theme.palette.mode === 'dark' ? '#fff' : '#000')
                        .attr('stroke-width', 2)
                        .attr('r', d.radius * 1.5)

                    // Highlight all nodes in the same cluster
                    g.selectAll('.node')
                        .filter((node) => node.cluster === d.cluster && node.id !== d.id)
                        .attr('stroke', theme.palette.mode === 'dark' ? '#fff' : '#000')
                        .attr('stroke-width', 1.5)
                })
                .on('mouseout', (event, d) => {
                    // Hide tooltip
                    setTooltipInfo(null)

                    // Remove highlight from current node
                    d3.select(event.target)
                        .attr('stroke', theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
                        .attr('stroke-width', 1.5)
                        .attr('r', d.radius)

                    // Remove highlight from cluster nodes
                    g.selectAll('.node')
                        .filter((node) => node.cluster === d.cluster && node.id !== d.id)
                        .attr('stroke', theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
                        .attr('stroke-width', 1.5)
                })

            // Draw labels for nodes with theme-appropriate colors
            const labels = g
                .selectAll('text')
                .data(nodes)
                .enter()
                .append('text')
                .text((d) => d.title)
                .attr('font-size', '8px')
                .attr('text-anchor', 'middle')
                .attr('dy', (d) => -d.radius - 5)
                .attr('fill', theme.palette.text.primary)
                .style('pointer-events', 'none')
                .style('opacity', showLabels ? 0.7 : 0)

            // Update node positions on simulation tick
            sim.on('tick', () => {
                // Update node positions
                circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y)

                labels.attr('x', (d) => d.x).attr('y', (d) => d.y)

                // Update cluster backgrounds
                const clusterPositions = {}
                for (const d of nodes) {
                    if (!clusterPositions[d.cluster]) {
                        clusterPositions[d.cluster] = {
                            x: 0,
                            y: 0,
                            count: 0,
                            points: []
                        }
                    }
                    clusterPositions[d.cluster].x += d.x
                    clusterPositions[d.cluster].y += d.y
                    clusterPositions[d.cluster].count += 1
                    clusterPositions[d.cluster].points.push([d.x, d.y])
                }

                // Update cluster background circles
                g.selectAll('.cluster-background').each(function ([clusterId]) {
                    const pos = clusterPositions[clusterId]
                    if (pos && pos.count > 0) {
                        // Calculate center
                        const centerX = pos.x / pos.count
                        const centerY = pos.y / pos.count

                        // Calculate radius based on max distance from center
                        let maxDist = 40 // Minimum radius
                        for (const [x, y] of pos.points) {
                            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
                            maxDist = Math.max(maxDist, dist + 15) // Add padding
                        }

                        d3.select(this).attr('cx', centerX).attr('cy', centerY).attr('r', maxDist)

                        // Update cluster info with final center positions
                        if (clusterInfo[clusterId]) {
                            clusterInfo[clusterId].center = {
                                x: centerX,
                                y: centerY
                            }
                        }
                    }
                })

                // Capture cluster data for labeling
                const clusterInfo = {}
                for (const d of nodes) {
                    if (!clusterInfo[d.cluster]) {
                        clusterInfo[d.cluster] = {
                            center: { x: 0, y: 0 },
                            count: 0,
                            nodes: [],
                            color: d.color
                        }
                    }
                    clusterInfo[d.cluster].count += 1
                    clusterInfo[d.cluster].nodes.push({
                        id: d.id,
                        title: d.title
                    })
                }

                // Update cluster centers
                g.selectAll('.cluster-background').each(function ([clusterId]) {
                    const pos = clusterPositions[clusterId]
                    if (pos && pos.count > 0) {
                        // Calculate center
                        const centerX = pos.x / pos.count
                        const centerY = pos.y / pos.count

                        // Calculate radius based on max distance from center
                        let maxDist = 40 // Minimum radius
                        for (const [x, y] of pos.points) {
                            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
                            maxDist = Math.max(maxDist, dist + 15) // Add padding
                        }

                        d3.select(this).attr('cx', centerX).attr('cy', centerY).attr('r', maxDist)

                        // Update cluster info with final center positions
                        if (clusterInfo[clusterId]) {
                            clusterInfo[clusterId].center = {
                                x: centerX,
                                y: centerY
                            }
                        }
                    }
                })

                setClusterData(clusterInfo)
            })

            // Draw cluster labels once simulation has stabilized
            let drawLabelsTimeout
            sim.on('end', () => {
                // Clear any existing timeout
                if (drawLabelsTimeout) clearTimeout(drawLabelsTimeout)

                // Delay to ensure the final positions are used
                drawLabelsTimeout = setTimeout(() => {
                    if (!Object.keys(clusterLabels).length) {
                        // If no labels have been generated yet, use cluster numbers
                        const tempLabels = {}
                        g.selectAll('.cluster-background').each(([clusterId]) => {
                            tempLabels[clusterId] = `Cluster ${clusterId}`
                        })
                        setClusterLabels(tempLabels)
                    }

                    // Draw cluster labels
                    g.selectAll('.cluster-label')
                        .data(Object.entries(clusterData || {}))
                        .join('text')
                        .attr('class', 'cluster-label')
                        .text(([clusterId]) => clusterLabels[clusterId] || `Cluster ${clusterId}`)
                        .attr('x', ([clusterId, data]) => data.center.x)
                        .attr('y', ([clusterId, data]) => data.center.y - 50) // Position above the cluster
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '12px')
                        .attr('font-weight', 'bold')
                        .attr('fill', ([clusterId, data]) => {
                            // Use a darker version of the cluster color for better contrast
                            return theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                        })
                        .attr('stroke', theme.palette.mode === 'dark' ? '#000000' : '#ffffff')
                        .attr('stroke-width', 0.5)
                        .attr('paint-order', 'stroke')
                        .style('pointer-events', 'none')
                }, 1000)
            })

            // Update label visibility when showLabels changes
            return () => {
                sim.stop()
            }
        } catch (error) {
            console.error('Error rendering visualization:', error)
        }
    }, [
        documents,
        showLabels,
        zoomLevel,
        theme.palette.mode,
        theme.palette.background.default,
        theme.palette.background.paper,
        theme.palette.text.primary,
        dimensions,
        clusterLabels
    ])

    // Update label visibility when showLabels changes
    useEffect(() => {
        if (!svgRef.current) return

        d3.select(svgRef.current)
            .selectAll('text')
            .style('opacity', showLabels ? 0.7 : 0)
    }, [showLabels])

    // Update zoom level when it changes
    useEffect(() => {
        if (!svgRef.current) return

        d3.select(svgRef.current).transition().duration(300).call(d3.zoom().transform, d3.zoomIdentity.scale(zoomLevel))
    }, [zoomLevel])

    // Update dimensions when svg is mounted
    useEffect(() => {
        if (svgRef.current) {
            setDimensions({
                width: svgRef.current.clientWidth,
                height: 600
            })
        }
    }, []) // Only run once on mount

    // Auto-fit zoom when visualization is ready
    useEffect(() => {
        if (!svgRef.current || !documents || documents.length === 0) return

        // Only run this after the simulation has had time to position nodes
        setTimeout(() => {
            const svg = d3.select(svgRef.current)

            // Set initial zoom to show all content
            const initialZoom = 0.8 // Slightly zoomed out to see everything
            svg.call(
                d3.zoom().transform,
                d3.zoomIdentity
                    .translate(dimensions.width / 2, dimensions.height / 2)
                    .scale(initialZoom)
                    .translate(-dimensions.width / 2, -dimensions.height / 2)
            )

            // Update the zoom level state
            setZoomLevel(initialZoom)
        }, 500)
    }, [documents, dimensions])

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6'>Document Similarity Map</Typography>
                <Box>
                    <IconButton onClick={handleZoomIn} size='small'>
                        <ZoomInIcon />
                    </IconButton>
                    <IconButton onClick={handleZoomOut} size='small'>
                        <ZoomOutIcon />
                    </IconButton>
                    <IconButton onClick={handleReset} size='small'>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        startIcon={<LabelIcon />}
                        size='small'
                        variant='outlined'
                        color='primary'
                        onClick={generateClusterLabels}
                        disabled={isGeneratingLabels || !clusterData}
                        sx={{ ml: 1, mr: 1 }}
                    >
                        {isGeneratingLabels ? 'Generating...' : 'Label Clusters'}
                    </Button>
                    <FormControlLabel
                        control={<Switch checked={showLabels} onChange={handleToggleLabels} />}
                        label='Labels'
                        sx={{ ml: 1 }}
                    />
                </Box>
            </Box>

            {/* Display cluster legend below the visualization */}
            {Object.keys(clusterLabels).length > 0 && (
                <Box mt={1} mb={2} display='flex' flexWrap='wrap' gap={1}>
                    {Object.entries(clusterData || {}).map(([clusterId, data]) => (
                        <Chip
                            key={clusterId}
                            label={clusterLabels[clusterId] || `Cluster ${clusterId}`}
                            sx={{
                                backgroundColor: `${data.color}33`, // Add transparency
                                color: theme.palette.getContrastText(data.color),
                                borderColor: data.color,
                                border: '1px solid'
                            }}
                        />
                    ))}
                </Box>
            )}

            {!status.isValid ? (
                <Paper
                    elevation={2}
                    sx={{
                        width: '100%',
                        minHeight: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        p: 3
                    }}
                >
                    <Typography color='error' gutterBottom>
                        Visualization Error
                    </Typography>
                    <Typography>{status.message}</Typography>
                    <Typography variant='body2' color='text.secondary' mt={2}>
                        Please ensure documents have valid embedding vectors and try again.
                    </Typography>
                </Paper>
            ) : (
                <Paper
                    elevation={2}
                    sx={{
                        width: '100%',
                        height: '600px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <svg ref={svgRef} width='100%' height='100%' />

                    {/* Tooltip */}
                    {tooltipInfo && (
                        <Tooltip
                            open={true}
                            title={
                                <Box sx={{ maxWidth: 300 }}>
                                    <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {tooltipInfo.title || 'Document'}
                                    </Typography>
                                    {tooltipInfo.metadata && Object.keys(tooltipInfo.metadata).length > 0 && (
                                        <Box mt={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {Object.entries(tooltipInfo.metadata).map(([key, value]) => {
                                                // Skip empty values
                                                if (value === null || value === undefined) {
                                                    return null
                                                }

                                                // For nested objects, handle them specially
                                                if (typeof value === 'object') {
                                                    return (
                                                        <Box key={key} sx={{ mb: 1 }}>
                                                            <Typography
                                                                variant='caption'
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    display: 'block'
                                                                }}
                                                            >
                                                                {key}:
                                                            </Typography>
                                                            {/* Recursively render nested objects */}
                                                            <Box sx={{ pl: 2 }}>
                                                                {Object.entries(value).map(([nestedKey, nestedValue]) => {
                                                                    let nestedDisplay

                                                                    // Handle doubly nested objects (like loc.lines)
                                                                    if (nestedValue && typeof nestedValue === 'object') {
                                                                        nestedDisplay = Object.entries(nestedValue)
                                                                            .map(([deepKey, deepValue]) => `${deepKey}: ${deepValue}`)
                                                                            .join(', ')
                                                                        return (
                                                                            <Typography
                                                                                key={nestedKey}
                                                                                variant='caption'
                                                                                display='block'
                                                                                sx={{ fontSize: '0.75rem' }}
                                                                            >
                                                                                <strong>{nestedKey}:</strong> {nestedDisplay}
                                                                            </Typography>
                                                                        )
                                                                    }

                                                                    nestedDisplay = String(nestedValue)
                                                                    return (
                                                                        <Typography
                                                                            key={nestedKey}
                                                                            variant='caption'
                                                                            display='block'
                                                                            sx={{ fontSize: '0.75rem' }}
                                                                        >
                                                                            <strong>{nestedKey}:</strong> {nestedDisplay}
                                                                        </Typography>
                                                                    )
                                                                })}
                                                            </Box>
                                                        </Box>
                                                    )
                                                }

                                                // For simple values
                                                let formattedValue = String(value)

                                                // Truncate long values
                                                if (formattedValue.length > 50) {
                                                    formattedValue = `${formattedValue.substring(0, 47)}...`
                                                }

                                                return (
                                                    <Typography key={key} variant='caption' display='block' sx={{ mb: 0.5 }}>
                                                        <strong>{key}:</strong> {formattedValue}
                                                    </Typography>
                                                )
                                            })}
                                        </Box>
                                    )}
                                </Box>
                            }
                            placement='top'
                            arrow
                            sx={{
                                position: 'absolute',
                                left: `${tooltipInfo.x}px`,
                                top: `${tooltipInfo.y}px`,
                                pointerEvents: 'none'
                            }}
                        />
                    )}
                </Paper>
            )}

            <Box mt={2}>
                <Typography variant='caption' color='text.secondary'>
                    Similar documents are positioned closer together. Colors indicate document clusters. Hover over nodes to see document
                    details. Use mouse wheel to zoom and drag to pan.
                </Typography>
            </Box>
        </Box>
    )
}

DocumentEmbeddingVisualizer.propTypes = {
    documents: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string.isRequired,
            embedding: PropTypes.array.isRequired,
            metadata: PropTypes.object
        })
    ).isRequired
}

export default DocumentEmbeddingVisualizer
