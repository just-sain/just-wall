'use client'

import { useCallback, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from '@shadcn'
import { Home, ImagePlus, Loader2, Upload, X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface UploadFormData {
	title: string
	description: string
	tags: string
	file: File | null
	preview: string | null
}

export default function AdminUploadPage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState<UploadFormData>({
		title: '',
		description: '',
		tags: '',
		file: null,
		preview: null,
	})

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]

		if (file) {
			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

			if (!allowedTypes.includes(file.type)) {
				alert('Invalid file type. Please select JPEG, PNG, WebP, or GIF.')

				return
			}

			// Validate file size (50MB max)
			if (file.size > 50 * 1024 * 1024) {
				alert('File too large. Maximum size is 50MB.')

				return
			}

			// Create preview
			const reader = new FileReader()

			reader.onload = (e) => {
				setFormData((prev) => ({
					...prev,
					file,
					preview: e.target?.result as string,
				}))
			}
			reader.readAsDataURL(file)

			// Auto-fill title from filename
			const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

			setFormData((prev) => ({ ...prev, title: title || '' }))
		}
	}, [])

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (!formData.file || !formData.title) {
				alert('Please select an image and provide a title.')

				return
			}

			setLoading(true)

			try {
				const data = new FormData()

				data.append('title', formData.title)
				data.append('description', formData.description)
				data.append('tags', formData.tags)
				data.append('file', formData.file)

				const response = await fetch('/api/admin/wallpapers', {
					method: 'POST',
					body: data,
				})

				if (!response.ok) {
					const error = await response.json()

					throw new Error(error.error || 'Failed to upload wallpaper')
				}

				const wallpaper = await response.json()

				// Reset form
				setFormData({
					title: '',
					description: '',
					tags: '',
					file: null,
					preview: null,
				})

				// Redirect to the new wallpaper
				router.push(`/wallpaper/${wallpaper.slug}`)
			} catch (error) {
				console.error('Error uploading wallpaper:', error)
				alert(error instanceof Error ? error.message : 'Failed to upload wallpaper')
			} finally {
				setLoading(false)
			}
		},
		[formData, router],
	)

	const handleClear = useCallback(() => {
		setFormData({
			title: '',
			description: '',
			tags: '',
			file: null,
			preview: null,
		})
	}, [])

	return (
		<div className='min-h-screen bg-background p-6'>
			<div className='max-w-2xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<div className='flex items-center gap-4'>
						<Link href='/'>
							<Button size='icon' variant='ghost'>
								<Home className='w-5 h-5' />
							</Button>
						</Link>
						<h1 className='text-2xl font-bold'>Upload Wallpaper</h1>
					</div>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Upload Wallpaper</CardTitle>
						<CardDescription>
							Upload a new wallpaper. Images will be automatically processed into multiple sizes.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className='space-y-6' onSubmit={handleSubmit}>
							{/* File Drop Zone */}
							<div className='relative'>
								<input
									accept='image/jpeg,image/png,image/webp,image/gif'
									className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
									disabled={loading}
									type='file'
									onChange={handleFileChange}
								/>
								{formData.preview ? (
									<div className='relative aspect-video rounded-lg overflow-hidden bg-muted'>
										<img alt='Preview' className='w-full h-full object-contain' src={formData.preview} />
										<button
											className='absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90'
											type='button'
											onClick={(e) => {
												e.stopPropagation()
												handleClear()
											}}
										>
											<X className='w-4 h-4' />
										</button>
									</div>
								) : (
									<div
										className={cn(
											'flex flex-col items-center justify-center gap-4 aspect-video',
											'border-2 border-dashed rounded-lg transition-colors',
											'hover:border-primary/50 hover:bg-muted/50',
											'border-border',
										)}
									>
										<ImagePlus className='w-12 h-12 text-muted-foreground' />
										<div className='text-center'>
											<p className='font-medium'>Click to upload or drag and drop</p>
											<p className='text-sm text-muted-foreground'>JPEG, PNG, WebP, GIF up to 50MB</p>
										</div>
									</div>
								)}
							</div>

							{/* Title */}
							<div className='space-y-2'>
								<Label htmlFor='title'>Title *</Label>
								<Input
									required
									disabled={loading}
									id='title'
									placeholder='Wallpaper title'
									value={formData.title}
									onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
								/>
							</div>

							{/* Description */}
							<div className='space-y-2'>
								<Label htmlFor='description'>Description</Label>
								<Textarea
									disabled={loading}
									id='description'
									placeholder='Optional description'
									rows={3}
									value={formData.description}
									onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
								/>
							</div>

							{/* Tags */}
							<div className='space-y-2'>
								<Label htmlFor='tags'>Tags</Label>
								<Input
									disabled={loading}
									id='tags'
									placeholder='nature, minimal, 4k (comma separated)'
									value={formData.tags}
									onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
								/>
								<p className='text-xs text-muted-foreground'>Separate multiple tags with commas</p>
							</div>

							{/* Submit */}
							<div className='flex gap-4'>
								<Button className='flex-1' disabled={loading || !formData.file} type='submit'>
									{loading ? (
										<>
											<Loader2 className='w-4 h-4 mr-2 animate-spin' />
											Uploading...
										</>
									) : (
										<>
											<Upload className='w-4 h-4 mr-2' />
											Upload Wallpaper
										</>
									)}
								</Button>
								<Button disabled={loading} type='button' variant='outline' onClick={handleClear}>
									Clear
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
