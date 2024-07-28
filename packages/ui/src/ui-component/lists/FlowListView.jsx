import PropTypes from 'prop-types'
import { Box, Grid, Skeleton, Typography } from '@mui/material'
import ItemCard from '@/ui-component/cards/ItemCard'

const FlowListView = ({ data, images, nodeTypes, isLoading, updateFlowsApi, setError, type, onItemClick }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={3}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <Grid item xs={4} sm={4} md={4} key={index}>
                            <Skeleton variant='rectangular' height={200} />
                        </Grid>
                    ))
                ) : data.length > 0 ? (
                    data.map(
                        (item) =>
                            item && (
                                <Grid item xs={4} sm={4} md={4} key={item.id || item.templateId}>
                                    <ItemCard
                                        key={item.id || item.templateId}
                                        data={item}
                                        images={images && images[item.id]}
                                        nodeTypes={nodeTypes && nodeTypes[item.id]}
                                        onClick={() => onItemClick(item)}
                                        type={type}
                                        updateFlowsApi={updateFlowsApi}
                                        setError={setError}
                                    />
                                </Grid>
                            )
                    )
                ) : (
                    <Grid item xs={12}>
                        <Typography variant='body1' align='center'>
                            No items found.
                        </Typography>
                    </Grid>
                )}
            </Grid>
        </Box>
    )
}

FlowListView.propTypes = {
    data: PropTypes.array,
    images: PropTypes.object,
    nodeTypes: PropTypes.object,
    isLoading: PropTypes.bool,
    updateFlowsApi: PropTypes.object,
    setError: PropTypes.func,
    type: PropTypes.oneOf(['chatflows', 'agentflows', 'marketplace', 'tools']).isRequired,
    onItemClick: PropTypes.func.isRequired
}

FlowListView.defaultProps = {
    images: {},
    nodeTypes: {}
}

export default FlowListView
