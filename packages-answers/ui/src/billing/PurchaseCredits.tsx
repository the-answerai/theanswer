'use client'

import React, { useState, useCallback } from 'react'
import { Box, Button, Card, Container, Grid, Typography, Slider, TextField } from '@mui/material'
import { BILLING_CONFIG } from '../config/billing'

const PurchaseCredits = () => {
    const [sparksToBuy, setSparksToBuy] = useState(10000)
    const [loading, setLoading] = useState(false)

    const handleSparkChange = (event: Event, newValue: number | number[]) => {
        setSparksToBuy(newValue as number)
    }

    const calculateSparkPrice = (sparks: number) => {
        return sparks * BILLING_CONFIG.SPARK_TO_USD
    }

    const handlePurchase = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/billing/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sparks: sparksToBuy,
                    amount: calculateSparkPrice(sparksToBuy)
                })
            })
            if (!response.ok) throw new Error('Failed to initiate purchase')
            const { url } = await response.json()
            if (url) window.location.assign(url)
        } catch (error) {
            console.error('Failed to initiate purchase:', error)
        } finally {
            setLoading(false)
        }
    }, [sparksToBuy])

    return (
        <Container maxWidth='lg'>
            <Card
                sx={{
                    bgcolor: 'rgba(30,30,30,0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'none',
                    p: 3,
                    mb: 4
                }}
            >
                <Typography variant='h5' sx={{ color: 'white', mb: 3 }}>
                    Purchase Sparks
                </Typography>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                            Select amount of Sparks to purchase
                        </Typography>
                        <Slider
                            value={sparksToBuy}
                            onChange={handleSparkChange}
                            min={1000}
                            max={1000000}
                            step={1000}
                            valueLabelDisplay='auto'
                            valueLabelFormat={(value) => `${value.toLocaleString()} Sparks`}
                            sx={{
                                color: 'primary.main',
                                '& .MuiSlider-thumb': {
                                    bgcolor: 'white'
                                },
                                '& .MuiSlider-track': {
                                    bgcolor: 'primary.main'
                                },
                                '& .MuiSlider-rail': {
                                    bgcolor: 'rgba(255,255,255,0.2)'
                                }
                            }}
                        />
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TextField
                                value={sparksToBuy}
                                onChange={(e) => setSparksToBuy(Number(e.target.value))}
                                type='number'
                                variant='outlined'
                                size='small'
                                InputProps={{
                                    endAdornment: <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Sparks</Typography>
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        bgcolor: 'rgba(0,0,0,0.2)',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        }
                                    }
                                }}
                            />
                            <Typography variant='h6' sx={{ color: 'white', flexGrow: 1, textAlign: 'right' }}>
                                Total: ${calculateSparkPrice(sparksToBuy).toFixed(2)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            variant='contained'
                            fullWidth
                            size='large'
                            onClick={handlePurchase}
                            disabled={loading}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark'
                                }
                            }}
                        >
                            {loading ? 'Processing...' : 'Purchase Sparks'}
                        </Button>
                    </Grid>
                </Grid>
            </Card>
        </Container>
    )
}

export default PurchaseCredits
