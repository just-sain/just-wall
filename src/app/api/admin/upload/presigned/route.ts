import { NextRequest, NextResponse } from 'next/server'

import { getPresignedUploadUrl } from '@/lib/s3'

// POST /api/admin/upload/presigned - Get presigned URL for direct upload
export async function POST(request: NextRequest) {
	try {
		// In production, add authentication check here
		// const session = await getServerSession(authOptions);
		// if (!session || session.user.role !== 'ADMIN') {
		//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		// }

		const body = await request.json()
		const { filename, contentType, folder } = body

		if (!filename || !contentType) {
			return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 })
		}

		// Validate content type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

		if (!allowedTypes.includes(contentType)) {
			return NextResponse.json({ error: 'Invalid content type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
		}

		// Determine folder (originals, previews, thumbs)
		const validFolders = ['originals', 'previews', 'thumbs']
		const targetFolder = validFolders.includes(folder) ? folder : 'originals'

		// Generate unique key
		const timestamp = Date.now()
		const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
		const key = `${targetFolder}/${timestamp}-${sanitizedFilename}`

		const result = await getPresignedUploadUrl({
			key,
			contentType,
			size: 0, // Size will be validated on upload
		})

		return NextResponse.json({
			uploadUrl: result.uploadUrl,
			key: result.key,
			publicUrl: result.publicUrl,
		})
	} catch (error) {
		console.error('Error generating presigned URL:', error)

		return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
	}
}
