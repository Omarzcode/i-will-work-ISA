"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { uploadToImgBB } from "@/lib/imgbb"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Upload, X, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/layout/AppLayout"

// Define PROBLEM_TYPES directly in this file
const PROBLEM_TYPES = [
  "Air Conditioning",
  "Electrical",
  "Plumbing",
  "Heating",
  "Lighting",
  "Security System",
  "Internet/Network",
  "Furniture",
  "Cleaning",
  "Other",
] as const

export default function CreateRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [problemType, setProblemType] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  console.log("CreateRequest: Component loaded, user:", user?.email, "branchCode:", user?.branchCode)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("CreateRequest: Image selected:", file.name, file.size)
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    console.log("CreateRequest: Removing image")
    setImage(null)
    setImagePreview(null)
  }

  const createNotificationForManagers = async (requestId: string, problemType: string, branchCode: string) => {
    try {
      console.log("CreateRequest: Creating notification for managers")
      console.log("CreateRequest: Notification data:", {
        requestId,
        problemType,
        branchCode,
      })

      const notificationData = {
        title: "New Maintenance Request",
        message: `New ${problemType} request from ${branchCode} branch`,
        type: "new_request",
        timestamp: serverTimestamp(),
        read: false,
        requestId: requestId,
        branchCode: branchCode,
        isForManager: true,
      }

      console.log("CreateRequest: Adding notification to Firestore:", notificationData)

      const docRef = await addDoc(collection(db, "notifications"), notificationData)
      console.log("CreateRequest: Notification created successfully with ID:", docRef.id)
    } catch (error) {
      console.error("CreateRequest: Error creating notification for managers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("CreateRequest: Form submitted")
    console.log("CreateRequest: Form data:", { problemType, description, hasImage: !!image })

    if (!problemType) {
      setError("Please select an issue type")
      return
    }

    if (!description.trim()) {
      setError("Please describe the issue")
      return
    }

    if (!user) {
      setError("User not authenticated")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      let imageUrl = ""

      if (image) {
        console.log("CreateRequest: Uploading image...")
        imageUrl = await uploadToImgBB(image)
        console.log("CreateRequest: Image uploaded successfully:", imageUrl)
      }

      console.log("CreateRequest: Creating request document...")
      // Create request document
      const requestData = {
        branchCode: user.branchCode,
        problemType,
        description: description.trim(),
        status: "قيد المراجعة",
        timestamp: serverTimestamp(),
        imageUrl,
        userId: user.uid,
      }

      console.log("CreateRequest: Request data:", requestData)
      const docRef = await addDoc(collection(db, "requests"), requestData)
      console.log("CreateRequest: Request created with ID:", docRef.id)

      // Create notification for managers
      await createNotificationForManagers(docRef.id, problemType, user.branchCode)

      toast({
        title: "Request Submitted Successfully!",
        description: "Your maintenance request has been submitted and is now under review.",
      })

      console.log("CreateRequest: Success! Resetting form...")
      // Reset form
      setProblemType("")
      setDescription("")
      setImage(null)
      setImagePreview(null)

      // Navigate back after a short delay to show the success message
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("CreateRequest: Error submitting request:", error)
      setError("Failed to submit request. Please try again.")
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4 rounded-2xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">New Request</h1>
          </div>

          <Card className="max-w-2xl mx-auto rounded-3xl">
            <CardHeader>
              <CardTitle>Create Maintenance Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="problemType">Issue Type</Label>
                  <Select value={problemType} onValueChange={setProblemType}>
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Select an issue type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {PROBLEM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Issue Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={5}
                    disabled={isLoading}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo (Optional)</Label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-2xl border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 rounded-xl"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded-xl text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Image ready
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-xl font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a photo</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={isLoading}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="flex-1 rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-2xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
