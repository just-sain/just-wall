export interface Tag {
	id: string
	name: string
	slug: string
	color?: string
	count?: number
}

export interface Wallpaper {
	id: string
	slug: string
	title: string
	description?: string
	thumbnailUrl: string | null
	previewUrl: string | null
	originalUrl: string
	width: number
	height: number
	format: string
	size?: number
	viewsCount: number
	downloads: number
	tags: Tag[]
	createdAt: string
}

export interface Pagination {
	page: number
	limit: number
	total: number
	totalPages: number
	hasMore: boolean
}

export interface WallpapersResponse {
	data: Wallpaper[]
	pagination: Pagination
}

export interface WallpaperDetail extends Wallpaper {
	updatedAt: string
}

export interface TagsResponse {
	data: Tag[]
}
