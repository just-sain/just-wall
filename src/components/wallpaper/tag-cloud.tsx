'use client'

import { useCallback } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import type { Tag } from '@types'

import { cn } from '@/lib/utils'

interface TagCloudProps {
	tags: Tag[]
	selectedTags?: string[]
	onTagClick?: (tag: string) => void
}

export function TagCloud({ tags, selectedTags = [], onTagClick }: TagCloudProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleTagClick = useCallback(
		(tagSlug: string) => {
			if (onTagClick) {
				onTagClick(tagSlug)
			} else {
				// Default: toggle tag in URL
				const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || []
				const newTags = currentTags.includes(tagSlug)
					? currentTags.filter((t) => t !== tagSlug)
					: [...currentTags, tagSlug]

				const params = new URLSearchParams(searchParams.toString())

				if (newTags.length > 0) {
					params.set('tags', newTags.join(','))
				} else {
					params.delete('tags')
				}

				router.push(`/?${params.toString()}`)
			}
		},
		[onTagClick, router, searchParams],
	)

	// Sort tags by count
	const sortedTags = [...tags].sort((a, b) => (b.count || 0) - (a.count || 0))

	return (
		<div className='flex flex-wrap gap-2'>
			{sortedTags.map((tag) => {
				const isSelected = selectedTags.includes(tag.slug)
				const count = tag.count || 0

				return (
					<button
						key={tag.id}
						className={cn(
							'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
							'border hover:scale-105',
							isSelected
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background text-muted-foreground border-border hover:border-primary/50',
						)}
						style={!isSelected && tag.color ? { borderColor: `${tag.color}30`, color: tag.color } : undefined}
						onClick={() => handleTagClick(tag.slug)}
					>
						<span>#</span>
						<span>{tag.name}</span>
						{count > 0 && (
							<span
								className={cn(
									'ml-1 text-xs px-1.5 py-0.5 rounded-full',
									isSelected ? 'bg-primary-foreground/20' : 'bg-muted',
								)}
							>
								{count}
							</span>
						)}
					</button>
				)
			})}
		</div>
	)
}
