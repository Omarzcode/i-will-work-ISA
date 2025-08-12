"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { createManagerNotification } from "@/hooks/useNotifications"
import { toast } from "sonner"
import { Upload, X } from "lucide-react"

// Define PROBLEM_TYPES locally
const PROBLEM_TYPES = ["Electrical", "Plumbing", "HVAC", "Structural", "Equipment", "Safety", "Cleaning", "Other"]

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "text-green-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
]

export default function CreateRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemType: "",
    priority: "",
    location: "",
  })

  console.log("CreateRequest: Component loaded, user:", user?.email)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    console.log("CreateRequest: Images selected:", files.length)
    setSelectedImages((prev) => [...prev, ...files].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    console.log("CreateRequest: Removing image at index:", index)
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    console.log("CreateRequest: Uploading image to ImgBB:", file.name)
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      console.log("CreateRequest: Image uploaded successfully:", data.data.url)
      return data.data.url
    } catch (error) {
      console.error("CreateRequest: Error uploading image:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      console.error("CreateRequest: No user found")
      toast.error("Please log in to create a request")
      return
    }

    console.log("CreateRequest: Starting form submission")
    console.log("CreateRequest: Form data:", formData)
    console.log("CreateRequest: Selected images:", selectedImages.length)

    setIsSubmitting(true)

    try {
      // Upload images first
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        console.log("CreateRequest: Uploading images...")
        imageUrls = await Promise.all(selectedImages.map((file) => uploadImageToImgBB(file)))
        console.log("CreateRequest: All images uploaded:", imageUrls)
      }

      // Create the request
      const requestData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        userName: user.name || user.email,
        branchCode: user.branchCode,
        branchName: user.branchName,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        images: imageUrls,
        managerNotes: "",
      }

      console.log("CreateRequest: Creating request with data:", requestData)

      const docRef = await addDoc(collection(db, "requests"), requestData)
      console.log("CreateRequest: Request created with ID:", docRef.id)

      // Create notification for managers
      try {
        console.log("CreateRequest: Creating manager notification...")
        await createManagerNotification(
          "New Maintenance Request",
          `New ${formData.problemType} request from ${user.branchName}: ${formData.title}`,
          docRef.id,
        )
        console.log("CreateRequest: Manager notification created successfully")
      } catch (notificationError) {
        console.error("CreateRequest: Error creating manager notification:", notificationError)
        // Don't fail the request creation if notification fails
      }

      toast.success("Request submitted successfully!")
      console.log("CreateRequest: Request submission completed successfully")
      router.push("/my-requests")
    } catch (error) {
      console.error("CreateRequest: Error submitting request:", error)
      toast.error("Failed to submit request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to create a request.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="rounded-xl border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
          <CardTitle className="text-blue-900">Create Maintenance Request</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-blue-900">
                Request Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                required
                className="rounded-lg border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="problemType" className="text-blue-900">
                  Problem Type *
                </Label>
                <Select
                  value={formData.problemType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, problemType: value }))}
                  required
                >
                  <SelectTrigger className="rounded-lg border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select problem type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {PROBLEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="rounded-md">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-blue-900">
                  Priority Level *
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                  required
                >
                  <SelectTrigger className="rounded-lg border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {PRIORITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="rounded-md">
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-blue-900">
                Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Specific location within the branch"
                required
                className="rounded-lg border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-blue-900">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the problem"
                rows={4}
                required
                className="rounded-lg border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-blue-900">Images (Optional)</Label>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-8 w-8 text-blue-400 mb-2" />
                  <span className="text-blue-600">Click to upload images</span>
                  <span className="text-sm text-gray-500">Max 5 images</span>
                </label>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
