"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { uploadToImgBB } from "@/lib/imgbb"

// Define problem types locally
const PROBLEM_TYPES = ["Plumbing", "Electrical", "HVAC", "Structural", "Cleaning", "Equipment", "Safety", "Other"]

export default function CreateRequestPage() {
  const { user } = useAuth()
  const { createNotification } = useNotifications()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemType: "",
    priority: "medium",
    location: "",
    images: [] as File[],
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setFormData((prev) => ({ ...prev, images: files }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to create a request")
      return
    }

    console.log("CreateRequest: Starting form submission for user:", user.email)
    setIsSubmitting(true)
    setError("")

    try {
      // Upload images if any
      const imageUrls: string[] = []
      if (formData.images.length > 0) {
        console.log("CreateRequest: Uploading", formData.images.length, "images")
        for (const image of formData.images) {
          try {
            const url = await uploadToImgBB(image)
            imageUrls.push(url)
            console.log("CreateRequest: Successfully uploaded image:", url)
          } catch (uploadError) {
            console.error("CreateRequest: Error uploading image:", uploadError)
          }
        }
      }

      // Create the request
      const requestData = {
        title: formData.title,
        description: formData.description,
        problemType: formData.problemType,
        priority: formData.priority,
        location: formData.location,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
        branchCode: user.branchCode,
        branchName: user.branchName,
        imageUrls: imageUrls,
        rating: null,
        feedback: null,
      }

      console.log("CreateRequest: Adding request to Firestore:", requestData)
      const docRef = await addDoc(collection(db, "requests"), requestData)
      console.log("CreateRequest: Successfully created request with ID:", docRef.id)

      // Create notification for managers
      try {
        console.log("CreateRequest: Creating notification for managers")
        await createNotification({
          title: "New Maintenance Request",
          message: `New ${formData.problemType} request from ${user.branchName}: ${formData.title}`,
          isForManager: true,
        })
        console.log("CreateRequest: Successfully created manager notification")
      } catch (notificationError) {
        console.error("CreateRequest: Error creating notification:", notificationError)
        // Don't fail the request creation if notification fails
      }

      console.log("CreateRequest: Request created successfully, redirecting to dashboard")
      router.push("/dashboard")
    } catch (error) {
      console.error("CreateRequest: Error creating request:", error)
      setError("Failed to create request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>You must be logged in to create a maintenance request.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-900">Create Maintenance Request</CardTitle>
          <CardDescription>Submit a new maintenance request for your branch: {user.branchName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                required
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemType">Problem Type *</Label>
              <Select
                value={formData.problemType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, problemType: value }))}
                required
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select problem type" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {PROBLEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="rounded-lg">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="low" className="rounded-lg">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="rounded-lg">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="rounded-lg">
                    High
                  </SelectItem>
                  <SelectItem value="urgent" className="rounded-lg">
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Specific location within the branch"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the problem"
                rows={4}
                required
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images (Optional)</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="rounded-lg"
              />
              {formData.images.length > 0 && (
                <p className="text-sm text-gray-600">{formData.images.length} image(s) selected</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg">
              {isSubmitting ? "Creating Request..." : "Create Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
