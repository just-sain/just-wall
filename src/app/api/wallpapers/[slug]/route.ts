import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/s3'

// GET /api/wallpapers/[slug] - Get single wallpaper by slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params

		const wallpaper = await prisma.wallpaper.findUnique({
			where: { slug },
			include: {
				tags: {
					include: {
						tag: true,
					},
				},
			},
		})

		if (!wallpaper) {
			return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 })
		}

		// Increment views count
		await prisma.wallpaper.update({
			where: { id: wallpaper.id },
			data: { viewsCount: { increment: 1 } },
		})

		// Format response
		const formattedWallpaper = {
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
			size: wallpaper.size,
			viewsCount: wallpaper.viewsCount,
			downloads: wallpaper.downloads,
			tags: wallpaper.tags.map((t) => ({
				id: t.tag.id,
				name: t.tag.name,
				slug: t.tag.slug,
				color: t.tag.color,
			})),
			createdAt: wallpaper.createdAt,
			updatedAt: wallpaper.updatedAt,
		}

		return NextResponse.json(formattedWallpaper)
	} catch (error) {
		console.error('Error fetching wallpaper:', error)

		return NextResponse.json({ error: 'Failed to fetch wallpaper' }, { status: 500 })
	}
}
