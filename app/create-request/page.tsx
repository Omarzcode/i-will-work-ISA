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
import { ArrowLeft, Camera, Upload, X, CheckCircle, AlertCircle, ImageIcon } from "lucide-react"
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size must be less than 10MB")
        return
      }

      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError("") // Clear any previous errors
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const createNotificationForManagers = async (requestId: string, problemType: string, branchCode: string) => {
    try {
      await addDoc(collection(db, "notifications"), {
        title: "New Maintenance Request",
        message: `New ${problemType} request from ${branchCode} branch`,
        type: "new_request",
        timestamp: serverTimestamp(),
        read: false,
        requestId: requestId,
        branchCode: branchCode,
        isForManager: true,
      })
      console.log("Notification created for managers")
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!problemType) {
      setError("Please select an issue type")
      return
    }

    if (!description.trim()) {
      setError("Please describe the issue")
      return
    }

    if (description.trim().length < 10) {
      setError("Please provide a more detailed description (at least 10 characters)")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      let imageUrl = ""

      if (image) {
        imageUrl = await uploadToImgBB(image)
      }

      // Create request document
      const docRef = await addDoc(collection(db, "requests"), {
        branchCode: user?.branchCode || "unknown",
        problemType,
        description: description.trim(),
        status: "قيد المراجعة",
        timestamp: serverTimestamp(),
        imageUrl,
        userId: user?.uid || "",
      })

      console.log("Request created with ID:", docRef.id)

      // Create notification for managers
      await createNotificationForManagers(docRef.id, problemType, user?.branchCode || "unknown")

      toast({
        title: "Request Submitted Successfully! 🎉",
        description: "Your maintenance request has been submitted and is now under review.",
      })

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
      console.error("Error submitting request:", error)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
        <div className="px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Mobile-optimized header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 h-12 px-4 rounded-2xl hover:bg-white/80 active:bg-white lg:h-10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back</span>
            </Button>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">New Request</h1>
              <p className="text-gray-600">Submit a maintenance request for your branch</p>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto rounded-3xl shadow-lg border-0 lg:shadow-sm lg:border">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-3xl">
              <CardTitle className="text-center text-xl lg:text-left">Create Maintenance Request</CardTitle>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Issue Type - Mobile optimized */}
                <div className="space-y-3">
                  <Label htmlFor="problemType" className="text-base font-semibold text-gray-900">
                    Issue Type *
                  </Label>
                  <Select value={problemType} onValueChange={setProblemType}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base">
                      <SelectValue placeholder="Select an issue type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {PROBLEM_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="h-12 text-base">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description - Mobile optimized */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-semibold text-gray-900">
                    Issue Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail... (minimum 10 characters)"
                    rows={6}
                    disabled={isLoading}
                    className="rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{description.length}/500 characters</p>
                    {description.length >= 10 && (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Good description
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Upload - Mobile optimized */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">Photo (Optional)</Label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-48 lg:h-64 object-cover rounded-2xl border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-3 right-3 h-10 w-10 rounded-xl shadow-lg"
                        onClick={removeImage}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                      <div className="absolute bottom-3 left-3 bg-green-600 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                        Image ready
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 lg:p-12 hover:border-blue-400 transition-colors">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Camera className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="image-upload"
                            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-5 h-5 mr-2" />
                            Choose Photo
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
                          <p className="text-sm text-gray-500">or drag and drop</p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons - Mobile optimized */}
                <div className="flex flex-col gap-3 pt-4 lg:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="h-14 rounded-2xl border-2 font-medium text-base lg:flex-1 lg:h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !problemType || !description.trim() || description.length < 10}
                    className="h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl font-medium text-base shadow-lg lg:flex-1 lg:h-12"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Submitting...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
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
