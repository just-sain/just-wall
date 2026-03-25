import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/s3'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)

		// Pagination
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '20')
		const skip = (page - 1) * limit

		// Filters
		const tagIds = searchParams.get('tags')?.split(',').filter(Boolean)
		const search = searchParams.get('search')?.trim()
		const sortBy = searchParams.get('sort') || 'createdAt'
		const order = searchParams.get('order') || 'desc'

		// Build where clause
		const where: any = {
			isPublic: true,
		}

		// Search by title or description
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			]
		}

		// Filter by tags
		if (tagIds && tagIds.length > 0) {
			where.tags = {
				some: {
					tagId: { in: tagIds },
				},
			}
		}

		// Validate sort field
		const validSortFields = ['createdAt', 'viewsCount', 'downloads']
		const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'

		// Get wallpapers with tags
		const [wallpapers, total] = await Promise.all([
			prisma.wallpaper.findMany({
				where,
				include: {
					tags: {
						include: {
							tag: true,
						},
					},
				},
				orderBy: {
					[sortField]: order,
				},
				skip,
				take: limit,
			}),
			prisma.wallpaper.count({ where }),
		])

		// Format response
		const formattedWallpapers = wallpapers.map((wallpaper) => ({
			id: wallpaper.id,
			slug: wallpaper.slug,
			title: wallpaper.title,
			description: wallpaper.description,
			thumbnailUrl: wallpaper.thumbnailUrl ? getPublicUrl(wallpaper.thumbnailUrl) : null,
			previewUrl: wallpaper.previewUrl ? getPublicUrl(wallpaper.previewUrl) : null,
			originalUrl: getPublicUrl(wallpaper.originalUrl),
			width: wallpaper.width,
			height: wallpaper.height,
			format: wallpaper.format,
			viewsCount: wallpaper.viewsCount,
			downloads: wallpaper.downloads,
			tags: wallpaper.tags.map((t) => ({
				id: t.tag.id,
				name: t.tag.name,
				slug: t.tag.slug,
				color: t.tag.color,
			})),
			createdAt: wallpaper.createdAt,
		}))

		return NextResponse.json({
			data: formattedWallpapers,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasMore: skip + limit < total,
			},
		})
	} catch (error) {
		console.error('Error fetching wallpapers:', error)

		return NextResponse.json({ error: 'Failed to fetch wallpapers' }, { status: 500 })
	}
}
