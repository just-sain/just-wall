'use client'

import React, { useCallback, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import type { Wallpaper } from '@types'
import Masonry from 'react-masonry-css'

import { cn } from '@/lib/utils'

interface MasonryGalleryProps {
	wallpapers: Wallpaper[]
	hasMore?: boolean
	onLoadMore?: () => void
	loading?: boolean
}

const breakpointColumns = {
	default: 4,
	1400: 3,
	1100: 2,
	700: 1,
}

export function MasonryGallery({ wallpapers, hasMore = false, onLoadMore, loading = false }: MasonryGalleryProps) {
	const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)

	const handleLoadMore = useCallback(() => {
		if (onLoadMore && !loading && hasMore) {
			onLoadMore()
		}
	}, [onLoadMore, loading, hasMore])

	return (
		<div className='w-full'>
			<Masonry
				breakpointCols={breakpointColumns}
				className='flex -ml-4 w-auto'
				columnClassName='pl-4 bg-clip-padding'
			>
				{wallpapers.map((wallpaper) => (
					<WallpaperCard
						key={wallpaper.id}
						wallpaper={wallpaper}
						onClick={() => setSelectedWallpaper(wallpaper)}
					/>
				))}
			</Masonry>

			{/* Load more button */}
			{hasMore && (
				<div className='flex justify-center mt-8'>
					<button
						className={cn(
							'px-6 py-3 rounded-lg font-medium transition-colors',
							'bg-primary text-primary-foreground hover:bg-primary/90',
							'disabled:opacity-50 disabled:cursor-not-allowed',
						)}
						disabled={loading}
						onClick={handleLoadMore}
					>
						{loading ? 'Loading...' : 'Load More'}
					</button>
				</div>
			)}

			{/* Lightbox modal */}
			{selectedWallpaper && (
				<WallpaperLightbox wallpaper={selectedWallpaper} onClose={() => setSelectedWallpaper(null)} />
			)}
		</div>
	)
}

interface WallpaperCardProps {
	wallpaper: Wallpaper
	onClick: () => void
}

function WallpaperCard({ wallpaper, onClick }: WallpaperCardProps) {
	const aspectRatio = wallpaper.width / wallpaper.height
	const isPortrait = aspectRatio < 1

	return (
		<div
			className={cn(
				'mb-4 relative group cursor-pointer overflow-hidden rounded-lg',
				'transition-transform duration-300 hover:scale-[1.02]',
				'bg-muted',
			)}
			style={{
				aspectRatio: `${wallpaper.width} / ${wallpaper.height}`,
			}}
			onClick={onClick}
		>
			<Image
				fill
				alt={wallpaper.title}
				className='object-cover transition-opacity duration-300'
				loading='lazy'
				sizes='(max-width: 700px) 100vw, (max-width: 1100px) 50vw, (max-width: 1400px) 33vw, 25vw'
				src={wallpaper.thumbnailUrl || '/placeholder.svg'}
			/>

			{/* Overlay */}
			<div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
				<div className='absolute bottom-0 left-0 right-0 p-4'>
					<h3 className='text-white font-medium text-sm truncate'>{wallpaper.title}</h3>
					<div className='flex items-center gap-2 mt-1'>
						<span className='text-white/70 text-xs'>
							{wallpaper.width} × {wallpaper.height}
						</span>
						{wallpaper.tags.slice(0, 2).map((tag) => (
							<span key={tag.id} className='text-xs px-2 py-0.5 rounded-full bg-white/20 text-white'>
								{tag.name}
							</span>
						))}
					</div>
				</div>
			</div>

			{/* View count badge */}
			<div className='absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity'>
				<svg
					fill='none'
					height='12'
					stroke='currentColor'
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth='2'
					viewBox='0 0 24 24'
					width='12'
					xmlns='http://www.w3.org/2000/svg'
				>
					<path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' />
					<circle cx='12' cy='12' r='3' />
				</svg>
				{wallpaper.viewsCount}
			</div>
		</div>
	)
}

interface WallpaperLightboxProps {
	wallpaper: Wallpaper
	onClose: () => void
}

function WallpaperLightbox({ wallpaper, onClose }: WallpaperLightboxProps) {
	// Close on escape
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}

		window.addEventListener('keydown', handleEscape)

		return () => window.removeEventListener('keydown', handleEscape)
	}, [onClose])

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'
			onClick={onClose}
		>
			{/* Close button */}
			<button
				className='absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors'
				onClick={onClose}
			>
				<svg
					fill='none'
					height='24'
					stroke='currentColor'
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth='2'
					viewBox='0 0 24 24'
					width='24'
					xmlns='http://www.w3.org/2000/svg'
				>
					<path d='M18 6 6 18' />
					<path d='m6 6 12 12' />
				</svg>
			</button>

			{/* Image container */}
			<div className='relative max-w-[90vw] max-h-[90vh]' onClick={(e) => e.stopPropagation()}>
				<Image
					priority
					alt={wallpaper.title}
					className='max-w-full max-h-[90vh] object-contain rounded-lg'
					height={wallpaper.height}
					src={wallpaper.previewUrl || wallpaper.originalUrl}
					width={wallpaper.width}
				/>

				{/* Info panel */}
				<div className='absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg'>
					<h2 className='text-white text-xl font-semibold'>{wallpaper.title}</h2>
					{wallpaper.description && <p className='text-white/70 mt-2 text-sm'>{wallpaper.description}</p>}
					<div className='flex items-center gap-4 mt-4'>
						<span className='text-white/60 text-sm'>
							{wallpaper.width} × {wallpaper.height}
						</span>
						<span className='text-white/60 text-sm'>{wallpaper.format.toUpperCase()}</span>
						<span className='text-white/60 text-sm'>{wallpaper.viewsCount} views</span>
					</div>
					<div className='flex gap-2 mt-3'>
						{wallpaper.tags.map((tag) => (
							<Link
								key={tag.id}
								className='px-3 py-1 text-sm rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors'
								href={`/?tag=${tag.slug}`}
							>
								#{tag.name}
							</Link>
						))}
					</div>
					<div className='mt-4 flex gap-3'>
						<a
							download
							className='px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors'
							href={wallpaper.originalUrl}
						>
							Download Original
						</a>
						<Link
							className='px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors'
							href={`/wallpaper/${wallpaper.slug}`}
						>
							View Details
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
