import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

// GET /api/tags - Get all tags with wallpapers count
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const limit = parseInt(searchParams.get('limit') || '50')
		const search = searchParams.get('search')?.trim()

		const where = search
			? {
					name: { contains: search, mode: 'insensitive' as const },
				}
			: {}

		const tags = await prisma.tag.findMany({
			where,
			orderBy: {
				count: 'desc',
			},
			take: limit,
		})

		return NextResponse.json({
			data: tags.map((tag) => ({
				id: tag.id,
				name: tag.name,
				slug: tag.slug,
				color: tag.color,
				count: tag.count,
			})),
		})
	} catch (error) {
		console.error('Error fetching tags:', error)

		return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
	}
}

// POST /api/tags - Create a new tag (admin only - would need auth check)
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { name, color } = body

		if (!name) {
			return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
		}

		// Generate slug from name
		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')

		const tag = await prisma.tag.create({
			data: {
				name,
				slug,
				color: color || '#6366f1',
			},
		})

		return NextResponse.json({
			id: tag.id,
			name: tag.name,
			slug: tag.slug,
			color: tag.color,
			count: tag.count,
		})
	} catch (error: any) {
		if (error.code === 'P2002') {
			return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
		}
		console.error('Error creating tag:', error)

		return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
	}
}
