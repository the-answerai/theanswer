'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Fuse from 'fuse.js'
import { debounce } from '@utils/debounce'
import { Sidekick } from '../SidekickSelect.types'

export interface UseSidekickSearchProps {
    sidekicks: Sidekick[]
    debounceMs?: number
    enableLogs?: boolean
    initialTab?: string
}

export interface UseSidekickSearchResult {
    searchInputValue: string
    searchTerm: string
    activeTab: string
    previousActiveTab: string
    searchbarRef: React.RefObject<HTMLInputElement>
    fuse: Fuse<Sidekick> | null
    searchResults: Sidekick[]
    handleSearchChange: (value: string) => void
    clearSearchField: () => void
    setActiveTab: React.Dispatch<React.SetStateAction<string>>
    setPreviousActiveTab: React.Dispatch<React.SetStateAction<string>>
}

export const useSidekickSearch = ({
    sidekicks,
    debounceMs = 300,
    enableLogs = false,
    initialTab = 'all'
}: UseSidekickSearchProps): UseSidekickSearchResult => {
    const [searchInputValue, setSearchInputValue] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [previousActiveTab, setPreviousActiveTab] = useState<string>(initialTab)
    const [activeTab, setActiveTab] = useState<string>(initialTab)
    const searchbarRef = useRef<HTMLInputElement>(null)
    const [fuse, setFuse] = useState<Fuse<Sidekick> | null>(null)

    // Initialize Fuse.js for searching when sidekicks change
    useEffect(() => {
        if (sidekicks.length === 0) return

        // Skip initialization if Fuse already exists with same sidekick count
        if (fuse && fuse.getIndex() && sidekicks.length === fuse._docs.length) {
            return
        }

        const fuseOptions = {
            keys: [
                { name: 'chatflow.name', weight: 2 },
                { name: 'chatflow.description', weight: 1 },
                { name: 'chatflow.category', weight: 0.5 },
                { name: 'categories', weight: 0.5 }
            ],
            threshold: 0.3,
            includeScore: true
        }

        setFuse(new Fuse(sidekicks, fuseOptions))
    }, [sidekicks, fuse])

    // Create a stable reference to the debounced function
    const debouncedSetSearchTerm = useMemo(
        () =>
            debounce(
                (value: string) => {
                    setSearchTerm(value)
                    if (value) {
                        setPreviousActiveTab(activeTab)
                        setActiveTab('search')
                    }
                },
                debounceMs,
                { trailing: true, leading: false }
            ),
        [activeTab, debounceMs]
    )

    // Handle search input change
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchInputValue(value)
            debouncedSetSearchTerm(value)
        },
        [debouncedSetSearchTerm]
    )

    // Clear search field
    const clearSearchField = useCallback(() => {
        setSearchInputValue('')
        setSearchTerm('')
        setActiveTab(previousActiveTab)

        // Focus back on the search field for better UX
        if (searchbarRef.current) {
            searchbarRef.current.focus()
        }
    }, [previousActiveTab])

    // Perform search when searchTerm changes
    const searchResults = useMemo(() => {
        if (!searchTerm || !fuse) return []
        const results = fuse.search(searchTerm)
        return results.map((result) => result.item)
    }, [searchTerm, fuse])

    return {
        searchInputValue,
        searchTerm,
        activeTab,
        previousActiveTab,
        searchbarRef,
        fuse,
        searchResults,
        handleSearchChange,
        clearSearchField,
        setActiveTab,
        setPreviousActiveTab
    }
}

export default useSidekickSearch
