const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "your-imgbb-api-key-here"

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("key", IMGBB_API_KEY)

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      return data.data.url
    } else {
      throw new Error("Upload failed")
    }
  } catch (error) {
    console.error("Error uploading to ImgBB:", error)
    throw error
  }
}

// New function that returns the expected format
export async function uploadImage(file: File): Promise<{ url: string }> {
  const url = await uploadToImgBB(file)
  return { url }
}
