'use client'

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'

import { Button, Input } from '@shadcn'
import type { Tag, Wallpaper, WallpapersResponse } from '@types'
import { MasonryGallery, TagCloud } from '@wallpaper'
import { Loader2, Plus, Search, SlidersHorizontal } from 'lucide-react'

export default function HomePage() {
	const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
	const [tags, setTags] = useState<Tag[]>([])
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(false)
	const [total, setTotal] = useState(0)

	// Filters
	const [search, setSearch] = useState('')
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<'createdAt' | 'viewsCount' | 'downloads'>('createdAt')

	// Fetch wallpapers
	const fetchWallpapers = useCallback(
		async (pageNum: number = 1, append: boolean = false) => {
			try {
				if (append) {
					setLoadingMore(true)
				} else {
					setLoading(true)
				}

				const params = new URLSearchParams({
					page: pageNum.toString(),
					limit: '20',
					sort: sortBy,
				})

				if (search) params.set('search', search)
				if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))

				const response = await fetch(`/api/wallpapers?${params.toString()}`)
				const data: WallpapersResponse = await response.json()

				if (append) {
					setWallpapers((prev) => [...prev, ...data.data])
				} else {
					setWallpapers(data.data)
				}

				setHasMore(data.pagination.hasMore)
				setTotal(data.pagination.total)
				setPage(pageNum)
			} catch (error) {
				console.error('Error fetching wallpapers:', error)
			} finally {
				setLoading(false)
				setLoadingMore(false)
			}
		},
		[search, selectedTags, sortBy],
	)

	// Fetch tags
	const fetchTags = useCallback(async () => {
		try {
			const response = await fetch('/api/tags?limit=50')
			const data = await response.json()

			setTags(data.data)
		} catch (error) {
			console.error('Error fetching tags:', error)
		}
	}, [])

	// Initial load
	useEffect(() => {
		fetchWallpapers()
		fetchTags()
	}, [])

	// Re-fetch when filters change
	useEffect(() => {
		fetchWallpapers(1, false)
	}, [search, selectedTags, sortBy, fetchWallpapers])

	// Load more
	const handleLoadMore = useCallback(() => {
		if (!loadingMore && hasMore) {
			fetchWallpapers(page + 1, true)
		}
	}, [loadingMore, hasMore, page, fetchWallpapers])

	// Search handler
	const handleSearch = useCallback((e: React.FormEvent) => {
		e.preventDefault()
		setPage(1)
	}, [])

	// Tag click handler
	const handleTagClick = useCallback((tagSlug: string) => {
		setSelectedTags((prev) => (prev.includes(tagSlug) ? prev.filter((t) => t !== tagSlug) : [...prev, tagSlug]))
	}, [])

	// Clear filters
	const clearFilters = useCallback(() => {
		setSearch('')
		setSelectedTags([])
		setSortBy('createdAt')
	}, [])

	const hasActiveFilters = search || selectedTags.length > 0

	return (
		<main className='min-h-screen bg-background'>
			{/* Header */}
			<header className='sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center justify-between gap-4'>
						<h1 className='text-2xl font-bold'>Just-Wall</h1>

						<form className='flex-1 max-w-md' onSubmit={handleSearch}>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
								<Input
									className='pl-10'
									placeholder='Search wallpapers...'
									type='search'
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</form>

						<div className='flex items-center gap-2'>
							<Link href='/admin/upload'>
								<Button size='icon' variant='outline'>
									<Plus className='w-4 h-4' />
								</Button>
							</Link>
							<Button size='icon' variant='outline'>
								<SlidersHorizontal className='w-4 h-4' />
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Tags */}
			<div className='border-b bg-muted/30'>
				<div className='container mx-auto px-4 py-3'>
					<TagCloud selectedTags={selectedTags} tags={tags} onTagClick={handleTagClick} />
				</div>
			</div>

			{/* Active filters */}
			{hasActiveFilters && (
				<div className='border-b bg-muted/20'>
					<div className='container mx-auto px-4 py-2 flex items-center gap-2'>
						<span className='text-sm text-muted-foreground'>Filters:</span>
						{search && <span className='text-sm px-2 py-1 bg-muted rounded'>Search: {search}</span>}
						{selectedTags.map((tag) => (
							<span
								key={tag}
								className='text-sm px-2 py-1 bg-primary/10 text-primary rounded flex items-center gap-1'
							>
								#{tag}
								<button className='hover:text-primary/70' onClick={() => handleTagClick(tag)}>
									×
								</button>
							</span>
						))}
						<Button size='sm' variant='ghost' onClick={clearFilters}>
							Clear all
						</Button>
					</div>
				</div>
			)}

			{/* Results info */}
			<div className='container mx-auto px-4 py-4'>
				<div className='flex items-center justify-between'>
					<p className='text-muted-foreground'>{loading ? 'Loading...' : `${total} wallpapers found`}</p>
					<select
						className='px-3 py-1.5 rounded-lg border bg-background text-sm'
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'viewsCount' | 'downloads')}
					>
						<option value='createdAt'>Newest</option>
						<option value='viewsCount'>Most Popular</option>
						<option value='downloads'>Most Downloaded</option>
					</select>
				</div>
			</div>

			{/* Gallery */}
			<div className='container mx-auto px-4 pb-8'>
				{loading && wallpapers.length === 0 ? (
					<div className='flex items-center justify-center py-20'>
						<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
					</div>
				) : wallpapers.length === 0 ? (
					<div className='text-center py-20'>
						<p className='text-muted-foreground text-lg'>No wallpapers found</p>
						{hasActiveFilters && (
							<Button variant='link' onClick={clearFilters}>
								Clear filters
							</Button>
						)}
					</div>
				) : (
					<MasonryGallery
						hasMore={hasMore}
						loading={loadingMore}
						wallpapers={wallpapers}
						onLoadMore={handleLoadMore}
					/>
				)}
			</div>
		</main>
	)
}
