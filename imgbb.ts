export interface ImgBBResponse {
  data: {
    id: string
    title: string
    url_viewer: string
    url: string
    display_url: string
    width: number
    height: number
    size: number
    time: number
    expiration: number
    image: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    thumb: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    medium: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    delete_url: string
  }
  success: boolean
  status: number
}

export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY

  if (!apiKey) {
    throw new Error("ImgBB API key is not configured")
  }

  const formData = new FormData()
  formData.append("image", file)
  formData.append("key", apiKey)

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.statusText}`)
  }

  const result: ImgBBResponse = await response.json()

  if (!result.success) {
    throw new Error("ImgBB upload failed")
  }

  return result.data.display_url
}
