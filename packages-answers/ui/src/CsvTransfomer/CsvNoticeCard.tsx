'use client'
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Typography, 
  Button, 
  Stack, 
  CircularProgress 
} from '@mui/material'
import { useRouter } from 'next/navigation'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LaunchIcon from '@mui/icons-material/Launch'


interface CsvNoticeCardProps {
  onRefresh?: () => Promise<void>
}

const CsvNoticeCard: React.FC<CsvNoticeCardProps> = ({ onRefresh }) => {
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)


  const handleRefresh = async () => {
    if (!onRefresh) return
    
    try {
      await onRefresh()
    } catch (error) {
      console.error('Error refreshing chatflows:', error)
    }
  }

  // Check if user returned from marketplace and auto-refresh
  useEffect(() => {
    const checkMarketplaceReturn = () => {
      const installedCsv = localStorage.getItem('csv-processor-installed')
      if (installedCsv && onRefresh) {
        localStorage.removeItem('csv-processor-installed')
        // Auto-refresh after a short delay
        setTimeout(() => {
          handleRefresh()
        }, 1000)
      }
    }

    checkMarketplaceReturn()
    
    // Listen for focus events (when user returns to tab)
    window.addEventListener('focus', checkMarketplaceReturn)
    return () => window.removeEventListener('focus', checkMarketplaceReturn)
  }, [onRefresh, handleRefresh])

  const handleUseProcessor = async () => {
    setNavigating(true)
    try {
      // Mark that user is going to install CSV processor
      localStorage.setItem('csv-processor-install-intent', 'true')
      
      // Navigate to marketplace with CSV usecase filter
      await router.push('/sidekick-studio/marketplaces?usecase=CSV')
    } catch (error) {
      try {
        // Fallback: Go to marketplace with CSV search
        await router.push('/sidekick-studio/marketplaces?search=csv')
      } catch (fallbackError) {
        // Final fallback: Just go to marketplace
        router.push('/sidekick-studio/marketplaces')
      }
    } finally {
      // Reset loading state after a brief delay to show feedback
      setTimeout(() => {
        setNavigating(false)
      }, 1000)
    }
  }

  return (
    <Card 
      variant="outlined"
      sx={{ 
        p: { xs: 2, sm: 2.5, md: 3 },
        mt: { xs: 1.5, sm: 2 },
        borderRadius: { xs: 1, sm: 1.5 },
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: { xs: 1, sm: 2 },
          borderColor: 'primary.main'
        }
      }}
    >
      <Stack 
        direction={{ xs: 'column', lg: 'row' }} 
        spacing={3} 
        alignItems={{ xs: 'stretch', lg: 'center' }}
      >
        {/* Content Section */}
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center" 
          flexGrow={1}
        >
          <InfoOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          <Stack>
            <Typography variant="h5" gutterBottom>
              CSV Processor Setup Required
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              To use the CSV Transformer, you need at least one chatflow tagged with 'csv'.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Click below to install our ready-to-use CSV processor template from the marketplace.
            </Typography>
                         <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
               After installation: return to this page and the chatflow list will refresh automatically.
             </Typography>
          </Stack>
        </Stack>
          
                 {/* Actions Section */}
         <Stack 
           direction={{ xs: 'column', sm: 'row' }} 
           spacing={1.5}
           flexShrink={0}
           sx={{ alignItems: 'stretch', justifyContent: 'flex-end' }}
         >
           <Button
            variant="outlined"
            size="small"
            startIcon={
              navigating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <LaunchIcon sx={{ fontSize: 16 }} />
              )
            }
            onClick={handleUseProcessor}
                         disabled={navigating}
            sx={{ 
              fontWeight: 500,
              textTransform: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {navigating ? 'Opening Marketplace...' : 'Install CSV Processor'}
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}

export default CsvNoticeCard
