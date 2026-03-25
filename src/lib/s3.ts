import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
	endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
	region: process.env.MINIO_REGION || 'us-east-1',
	credentials: {
		accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
		secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
	},
	forcePathStyle: true,
})

const BUCKET = process.env.MINIO_BUCKET || 'just-wall'

export interface UploadParams {
	key: string
	contentType: string
	size: number
}

export interface PresignedUrlResult {
	uploadUrl: string
	key: string
	publicUrl: string
}

/**
 * Generate presigned URL for direct upload to Minio
 */
export async function getPresignedUploadUrl(params: UploadParams): Promise<PresignedUrlResult> {
	const { key, contentType } = params

	const command = new PutObjectCommand({
		Bucket: BUCKET,
		Key: key,
		ContentType: contentType,
	})

	const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

	// Generate public URL (can be proxied through Next.js API route)
	const publicUrl = `/api/files/${key}`

	return {
		uploadUrl,
		key,
		publicUrl,
	}
}

/**
 * Generate presigned URL for downloading
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: BUCKET,
		Key: key,
	})

	return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Delete object from Minio
 */
export async function deleteObject(key: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: BUCKET,
		Key: key,
	})

	await s3Client.send(command)
}

/**
 * Get public URL for an object
 */
export function getPublicUrl(key: string): string {
	return `/api/files/${key}`
}

export { BUCKET, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, s3Client }

// Helper functions for different image types
export function getOriginalKey(filename: string): string {
	return `originals/${Date.now()}-${filename}`
}

export function getPreviewKey(filename: string): string {
	return `previews/${Date.now()}-preview-${filename}`
}

export function getThumbnailKey(filename: string): string {
	return `thumbs/${Date.now()}-thumb-${filename}`
}
