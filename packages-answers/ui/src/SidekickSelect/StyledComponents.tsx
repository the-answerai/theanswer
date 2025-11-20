import { keyframes } from '@emotion/react'
import { styled, Dialog, Box, Typography, Button, Paper, IconButton, Grid, Chip, Skeleton, useScrollTrigger } from '@mui/material'

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        width: '90vw',
        maxWidth: '1200px',
        height: '60vh',
        maxHeight: '800px',
        backgroundColor: theme.vars.palette.background.default
    }
}))

export const ScrollableContent = styled(Box)({
    overflowY: 'auto',
    height: 'calc(100% - 120px)',
    paddingTop: '16px',
    paddingBottom: '16px'
})

// New styled components for the horizontal scrolling UI
export const CategorySectionContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    transition: 'all 0.3s ease'
}))

export const CategoryTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
}))

export const HorizontalScrollContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    overflowX: 'auto',
    padding: theme.spacing(1, 0),
    gap: theme.spacing(2),
    '&::-webkit-scrollbar': {
        height: '8px'
    },
    '&::-webkit-scrollbar-track': {
        background: `rgba(${theme.vars.palette.primary.mainChannel} / 0.05)`,
        borderRadius: '10px'
    },
    '&::-webkit-scrollbar-thumb': {
        background: `rgba(${theme.vars.palette.primary.mainChannel} / 0.2)`,
        borderRadius: '10px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: `rgba(${theme.vars.palette.primary.mainChannel} / 0.3)`
    }
}))

export const ViewAllButton = styled(Button)(({ theme }) => ({
    color: theme.vars.palette.primary.main,
    padding: 0,
    minWidth: 'auto',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    '& .MuiButton-endIcon': {
        transition: 'transform 0.3s ease'
    },
    '&:hover': {
        background: 'none',
        color: theme.vars.palette.primary.dark,
        '& .MuiButton-endIcon': {
            transform: 'translateX(3px)'
        }
    },
    '&:focus-visible': {
        outline: '2px solid',
        outlineColor: theme.vars.palette.primary.main,
        outlineOffset: '2px',
        boxShadow: `0 0 0 3px rgba(${theme.vars.palette.primary.mainChannel} / 0.25)`,
        transition: 'box-shadow 0.2s ease-in-out'
    }
}))

export const SidekickCardContainer = styled(Paper)(({ theme, onClick }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '220px', // Fixed height for all cards
    position: 'relative',
    // In horizontal scroll, we want fixed width
    '.horizontal-container &': {
        width: '300px',
        minWidth: '300px',
        maxWidth: '300px'
    },
    // In grid view, we want full width
    '.grid-container &': {
        width: '100%'
    },
    ...(!onClick
        ? {}
        : {
              cursor: 'pointer',
              '&:hover': {
                  backgroundColor: theme.vars.palette.action.hover,
                  transform: 'translateY(-2px)'
                  //   boxShadow: theme.shadows[4]
              }
          })
}))

export const FavoriteButton = styled(IconButton)(({ theme }) => ({
    zIndex: 1
}))

export const SidekickHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    height: '68px' // Fixed height for header (includes title and tags)
})

export const SidekickTitle = styled(Typography)({
    fontWeight: 'bold',
    fontSize: '1.1rem',
    lineHeight: '1.2',
    height: '2.4em', // Height for two lines of text
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
})

export const SidekickDescription = styled(Typography)({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    height: '42px', // Fixed height for two lines of description
    marginBottom: '16px'
})

export const SidekickFooter = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom
    height: '36px', // Fixed height for footer
    gap: theme.spacing(1),
    '& .MuiSvgIcon-root': {
        color: theme.vars.palette.common.white
    },
    '& .MuiButton-contained': {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.7)`,
        color: theme.vars.palette.common.white,
        '&:hover': {
            backgroundColor: theme.vars.palette.primary.main
        }
    }
}))

export const ContentWrapper = styled(Box)(({ theme }) => ({
    width: '100%',
    maxWidth: '1200px',

    backgroundColor: theme.vars.palette.background.default,

    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius
}))

export const WhiteButton = styled(Button)(({ theme }) => ({
    color: theme.vars.palette.common.white,
    borderColor: theme.vars.palette.common.white,
    '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
        borderColor: theme.vars.palette.primary.main,
        color: theme.vars.palette.primary.main
    },
    '&:focus-visible': {
        outline: '2px solid',
        outlineColor: theme.vars.palette.primary.main,
        outlineOffset: '2px',
        boxShadow: `0 0 0 3px rgba(${theme.vars.palette.primary.mainChannel} / 0.25)`,
        transition: 'box-shadow 0.2s ease-in-out'
    }
}))

export const WhiteIconButton = styled(IconButton)(({ theme }) => ({
    color: theme.vars.palette.common.white,
    '&:hover': {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
        color: theme.vars.palette.primary.main
    },
    '&:focus-visible': {
        outline: '2px solid',
        outlineColor: theme.vars.palette.primary.main,
        outlineOffset: '2px',
        boxShadow: `0 0 0 3px rgba(${theme.vars.palette.primary.mainChannel} / 0.25)`,
        transition: 'box-shadow 0.2s ease-in-out'
    }
}))

export const StyledGrid = styled(Grid)(({ theme }) => ({
    marginTop: theme.spacing(1),
    transition: 'all 0.3s ease'
}))

// Add a new styled component for category filter pills container
export const CategoryFilterContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    overflowX: 'auto',
    padding: theme.spacing(1, 0),
    marginBottom: theme.spacing(2),
    gap: theme.spacing(1),
    '&::-webkit-scrollbar': {
        height: '6px'
    },
    '&::-webkit-scrollbar-track': {
        background: `rgba(${theme.vars.palette.primary.mainChannel} / 0.05)`,
        borderRadius: '10px'
    },
    '&::-webkit-scrollbar-thumb': {
        background: `rgba(${theme.vars.palette.primary.mainChannel} / 0.2)`,
        borderRadius: '10px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: `rgba(${theme.vars.palette.primary.mainChannel} / 0.3)`
    }
}))

// Add a styled component for the category filter pills
export const CategoryFilterChip = styled(Chip)<{ selected?: boolean }>(({ theme, selected }) => ({
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:focus-visible': {
        outline: '2px solid',
        outlineColor: theme.vars.palette.primary.main,
        outlineOffset: '2px',
        boxShadow: `0 0 0 3px rgba(${theme.vars.palette.primary.mainChannel} / 0.25)`,
        transition: 'box-shadow 0.2s ease-in-out'
    },
    ...(selected && {
        backgroundColor: theme.vars.palette.primary.main,
        color: theme.vars.palette.common.white,
        fontWeight: 'bold',
        '&:hover': {
            backgroundColor: theme.vars.palette.primary.dark
        }
    })
}))

// Add a new styled component for grid items
export const StyledGridItem = styled(Grid)(({ theme }) => ({
    height: '100%',
    '& > div': {
        height: '100%'
    }
}))

// Add a skeleton card component
export const SkeletonCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    height: '220px',
    position: 'relative',
    backgroundColor: theme.vars.palette.background.paper,
    // Use CSS variable for border color that automatically updates with theme
    border: `1px solid ${theme.vars.palette.divider}`,
    '.horizontal-container &': {
        width: '300px',
        minWidth: '300px',
        maxWidth: '300px'
    },
    '.grid-container &': {
        width: '100%'
    }
}))

// Add a shimmer animation for skeleton items
export const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`

// Styled component for skeleton items with shimmer effect
// Uses CSS variables with color-mix for theme-aware shimmer animation
export const SkeletonItem = styled(Skeleton)(({ theme }) => ({
    backgroundColor: theme.vars.palette.action.hover,
    backgroundImage: `linear-gradient(
        90deg,
        ${theme.vars.palette.action.hover} 25%,
        ${theme.vars.palette.action.selected} 37%,
        ${theme.vars.palette.action.hover} 63%
    )`,
    backgroundSize: '200px 100%',
    backgroundRepeat: 'no-repeat',
    animation: `${shimmer} 1.5s infinite linear`,
    borderRadius: theme.shape.borderRadius
}))

export const OrgSidekicksHeader = styled(Box)(({ theme }) => ({
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: theme.spacing(1, 0),
    transition: theme.transitions && theme.transitions.create ? theme.transitions.create(['box-shadow']) : 'box-shadow 0.3s ease',
    boxShadow: useScrollTrigger() ? `0 1px 0 ${theme.vars.palette.divider}` : 'none'
}))
