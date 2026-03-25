import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

import { BUCKET, PutObjectCommand, s3Client } from './s3'

export interface ProcessedImage {
	originalKey: string
	previewKey: string
	thumbnailKey: string
	width: number
	height: number
	format: string
	size: number
}

export interface ImageMetadata {
	width: number
	height: number
	format: string
	size: number
}

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
	const image = sharp(buffer)
	const metadata = await image.metadata()

	return {
		width: metadata.width || 0,
		height: metadata.height || 0,
		format: metadata.format || 'unknown',
		size: buffer.length,
	}
}

/**
 * Process and upload image to S3 - generates thumbnails and preview
 */
export async function processAndUploadImage(file: Buffer, originalFilename: string): Promise<ProcessedImage> {
	const timestamp = Date.now()
	const baseName = originalFilename.replace(/\.[^/.]+$/, '')

	const originalKey = `originals/${timestamp}-${originalFilename}`
	const previewKey = `previews/${timestamp}-preview-${baseName}.webp`
	const thumbnailKey = `thumbs/${timestamp}-thumb-${baseName}.webp`

	// Get original metadata
	const originalImage = sharp(file)
	const metadata = await originalImage.metadata()

	const width = metadata.width || 0
	const height = metadata.height || 0
	const format = metadata.format || 'unknown'

	// 1. Upload original (keep as-is, but convert to webp for optimization)
	const originalWebp = await sharp(file).webp({ quality: 90 }).toBuffer()

	await s3Client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: originalKey,
			Body: originalWebp,
			ContentType: 'image/webp',
		}),
	)

	// 2. Generate and upload preview (1920px max width)
	const previewImage = await sharp(file)
		.resize(1920, null, {
			withoutEnlargement: true,
			fit: 'inside',
		})
		.webp({ quality: 85 })
		.toBuffer()

	await s3Client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: previewKey,
			Body: previewImage,
			ContentType: 'image/webp',
		}),
	)

	// 3. Generate and upload thumbnail (400px max width)
	const thumbnailImage = await sharp(file)
		.resize(400, null, {
			withoutEnlargement: true,
			fit: 'inside',
		})
		.webp({ quality: 80 })
		.toBuffer()

	await s3Client.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: thumbnailKey,
			Body: thumbnailImage,
			ContentType: 'image/webp',
		}),
	)

	return {
		originalKey,
		previewKey,
		thumbnailKey,
		width,
		height,
		format,
		size: file.length,
	}
}

/**
 * Process image from URL (for admin uploads via URL)
 */
export async function processImageFromUrl(imageUrl: string): Promise<ProcessedImage> {
	const response = await fetch(imageUrl)

	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.statusText}`)
	}

	const buffer = await response.arrayBuffer()
	const filename = imageUrl.split('/').pop() || 'image.jpg'

	return processAndUploadImage(Buffer.from(buffer), filename)
}

/**
 * Delete image and its variants from S3
 */
export async function deleteImageFiles(originalKey: string, previewKey: string, thumbnailKey: string): Promise<void> {
	const keys = [originalKey, previewKey, thumbnailKey].filter(Boolean)

	await Promise.all(
		keys.map(async (key) => {
			await s3Client.send(
				new DeleteObjectCommand({
					Bucket: BUCKET,
					Key: key,
				}),
			)
		}),
	)
}
