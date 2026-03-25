import { NextRequest, NextResponse } from 'next/server'

import { GetObjectCommand } from '@aws-sdk/client-s3'

import { BUCKET, s3Client } from '@/lib/s3'

// GET /api/files/[...key] - Proxy file from Minio
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
	try {
		const { key } = await params
		const keyPath = key.join('/')

		// Security check - prevent path traversal
		if (keyPath.includes('..') || keyPath.includes('//')) {
			return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
		}

		const command = new GetObjectCommand({
			Bucket: BUCKET,
			Key: keyPath,
		})

		const response = await s3Client.send(command)

		if (!response.Body) {
			return NextResponse.json({ error: 'File not found' }, { status: 404 })
		}

		// Convert stream to buffer
		const chunks: Uint8Array[] = []

		for await (const chunk of response.Body as any) {
			chunks.push(chunk)
		}
		const buffer = Buffer.concat(chunks)

		// Determine content type
		const contentType = getContentType(keyPath)

		return new NextResponse(buffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch (error: any) {
		if (error.name === 'NoSuchKey') {
			return NextResponse.json({ error: 'File not found' }, { status: 404 })
		}
		console.error('Error proxying file:', error)

		return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
	}
}

function getContentType(key: string): string {
	const ext = key.split('.').pop()?.toLowerCase()
	const contentTypes: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		webp: 'image/webp',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		avif: 'image/avif',
	}

	return contentTypes[ext || ''] || 'application/octet-stream'
}
