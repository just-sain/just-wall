import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { deleteObject } from '@/lib/s3'

// DELETE /api/admin/wallpapers/[id] - Delete wallpaper
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params

		// Get wallpaper first
		const wallpaper = await prisma.wallpaper.findUnique({
			where: { id },
			select: {
				originalUrl: true,
				previewUrl: true,
				thumbnailUrl: true,
			},
		})

		if (!wallpaper) {
			return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 })
		}

		// Delete from S3
		const deletePromises = [
			wallpaper.originalUrl ? deleteObject(wallpaper.originalUrl) : Promise.resolve(),
			wallpaper.previewUrl ? deleteObject(wallpaper.previewUrl) : Promise.resolve(),
			wallpaper.thumbnailUrl ? deleteObject(wallpaper.thumbnailUrl) : Promise.resolve(),
		]

		await Promise.all(deletePromises)

		// Delete from database (tags will be cascade deleted)
		await prisma.wallpaper.delete({
			where: { id },
		})

		return NextResponse.json({ message: 'Wallpaper deleted successfully' })
	} catch (error) {
		console.error('Error deleting wallpaper:', error)

		return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 })
	}
}

// PATCH /api/admin/wallpapers/[id] - Update wallpaper
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params
		const body = await request.json()
		const { title, description, tags, isPublic } = body

		const updateData: any = {}

		if (title !== undefined) updateData.title = title
		if (description !== undefined) updateData.description = description
		if (isPublic !== undefined) updateData.isPublic = isPublic

		// Handle tags update
		if (tags !== undefined) {
			// Delete existing tags
			await prisma.wallpaperTag.deleteMany({ where: { wallpaperId: id } })

			// Add new tags
			const tagOperations = tags.map(async (tagName: string) => {
				const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
				let tag = await prisma.tag.findUnique({ where: { slug: tagSlug } })

				if (!tag) {
					tag = await prisma.tag.create({
						data: { name: tagName, slug: tagSlug },
					})
				}

				return prisma.wallpaperTag.create({
					data: { wallpaperId: id, tagId: tag.id },
				})
			})

			await Promise.all(tagOperations)
		}

		const wallpaper = await prisma.wallpaper.update({
			where: { id },
			data: updateData,
			include: { tags: { include: { tag: true } } },
		})

		return NextResponse.json({
			id: wallpaper.id,
			title: wallpaper.title,
			description: wallpaper.description,
			isPublic: wallpaper.isPublic,
			tags: wallpaper.tags.map((t) => ({
				id: t.tag.id,
				name: t.tag.name,
				slug: t.tag.slug,
			})),
		})
	} catch (error) {
		console.error('Error updating wallpaper:', error)

		return NextResponse.json({ error: 'Failed to update wallpaper' }, { status: 500 })
	}
}
