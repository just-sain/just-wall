import { NextRequest, NextResponse } from 'next/server'

import { processAndUploadImage } from '@/lib/image-processor'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/s3'

// POST /api/admin/wallpapers - Create new wallpaper with image processing
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()

		const title = formData.get('title')?.toString()
		const description = formData.get('description')?.toString() || ''
		const tagsInput = formData.get('tags')?.toString()
		const file = formData.get('file') as File | null

		if (!title) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 })
		}

		if (!file) {
			return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
		}

		// Process the image
		const buffer = Buffer.from(await file.arrayBuffer())
		const processed = await processAndUploadImage(buffer, file.name)

		// Generate slug from title
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')

		// Parse tags
		const tagNames = tagsInput
			? tagsInput
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: []

		// Create wallpaper with tags
		const wallpaper = await prisma.wallpaper.create({
			data: {
				slug: `${slug}-${Date.now()}`,
				title,
				description,
				originalUrl: processed.originalKey,
				previewUrl: processed.previewKey,
				thumbnailUrl: processed.thumbnailKey,
				width: processed.width,
				height: processed.height,
				format: processed.format,
				size: processed.size,
				tags: {
					create: await Promise.all(
						tagNames.map(async (name) => {
							// Find or create tag
							const tagSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
							let tag = await prisma.tag.findUnique({ where: { slug: tagSlug } })

							if (!tag) {
								tag = await prisma.tag.create({
									data: { name, slug: tagSlug },
								})
							} else {
								// Increment count
								await prisma.tag.update({
									where: { id: tag.id },
									data: { count: { increment: 1 } },
								})
							}

							return { tagId: tag.id }
						}),
					),
				},
			},
			include: {
				tags: { include: { tag: true } },
			},
		})

		return NextResponse.json({
			id: wallpaper.id,
			slug: wallpaper.slug,
			title: wallpaper.title,
			thumbnailUrl: getPublicUrl(wallpaper.thumbnailUrl || ''),
			previewUrl: getPublicUrl(wallpaper.previewUrl || ''),
			originalUrl: getPublicUrl(wallpaper.originalUrl),
			width: wallpaper.width,
			height: wallpaper.height,
			tags: wallpaper.tags.map((t) => ({
				id: t.tag.id,
				name: t.tag.name,
				slug: t.tag.slug,
			})),
			createdAt: wallpaper.createdAt,
		})
	} catch (error) {
		console.error('Error creating wallpaper:', error)

		return NextResponse.json({ error: 'Failed to create wallpaper' }, { status: 500 })
	}
}

// GET /api/admin/wallpapers - Get all wallpapers (admin view)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '20')
		const skip = (page - 1) * limit

		const [wallpapers, total] = await Promise.all([
			prisma.wallpaper.findMany({
				include: {
					tags: { include: { tag: true } },
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			prisma.wallpaper.count(),
		])

		return NextResponse.json({
			data: wallpapers.map((w) => ({
				id: w.id,
				slug: w.slug,
				title: w.title,
				description: w.description,
				thumbnailUrl: w.thumbnailUrl ? getPublicUrl(w.thumbnailUrl) : null,
				width: w.width,
				height: w.height,
				viewsCount: w.viewsCount,
				downloads: w.downloads,
				isPublic: w.isPublic,
				tags: w.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug })),
				createdAt: w.createdAt,
			})),
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		})
	} catch (error) {
		console.error('Error fetching wallpapers:', error)

		return NextResponse.json({ error: 'Failed to fetch wallpapers' }, { status: 500 })
	}
}
