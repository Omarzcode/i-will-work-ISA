export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!)

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload image")
  }

  const data = await response.json()
  return data.data.url
}
