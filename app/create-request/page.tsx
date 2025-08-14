"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadImage } from "@/lib/imgbb"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  AlertCircle,
  Wrench,
  Zap,
  Droplets,
  Thermometer,
  Lightbulb,
  Shield,
  Wifi,
  Armchair,
  Sparkles,
  HelpCircle,
  Flag,
  AlertTriangle,
  Circle,
} from "lucide-react"
import { PROBLEM_TYPES, PRIORITY_OPTIONS } from "@/lib/types"

export default function CreateRequestPage() {
  const { user } = useAuth()
  const { createNotification } = useNotifications()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const problemTypeIcons = {
    "Air Conditioning": Thermometer,
    Electrical: Zap,
    Plumbing: Droplets,
    Heating: Thermometer,
    Lighting: Lightbulb,
    "Security System": Shield,
    "Internet/Network": Wifi,
    Furniture: Armchair,
    Cleaning: Sparkles,
    Other: HelpCircle,
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Zap className="w-4 h-4" />
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "medium":
        return <Flag className="w-4 h-4" />
      case "low":
        return <Circle className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === priority)
    return priorityOption?.color || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!selectedType || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a problem type and provide a description",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let imageUrl = ""
      if (image) {
        const uploadResult = await uploadImage(image)
        imageUrl = uploadResult.url
      }

      // Create the maintenance request
      const requestData = {
        branchCode: user.branchCode,
        problemType: selectedType,
        description: description.trim(),
        imageUrl,
        timestamp: serverTimestamp(),
        status: "قيد المراجعة",
        userId: user.uid,
        priority: selectedPriority,
      }

      const docRef = await addDoc(collection(db, "requests"), requestData)

      // Create notification for MANAGERS (isForManager: true)
      await createNotification({
        title: `New ${selectedType} Request`,
        message: `A new ${selectedType} request has been submitted from Branch ${user.branchCode} and requires your attention.`,
        type: "new_request",
        read: false,
        requestId: docRef.id,
        branchCode: user.branchCode,
        isForManager: true, // This goes to managers
      })

      toast({
        title: "✅ Request Submitted",
        description: "Your maintenance request has been submitted successfully",
      })

      router.push("/my-requests")
    } catch (error) {
      console.error("Error submitting request:", error)
      toast({
        title: "❌ Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
            <p className="text-gray-600">Please log in to create a maintenance request.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
        <div className="px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Create Maintenance Request</h1>
              <p className="text-gray-600">Submit a new maintenance request for your branch</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-3 py-1">
                  Branch {user.branchCode}
                </Badge>
              </div>
            </div>

            <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900">Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Problem Type Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-4 block">
                      What type of problem are you experiencing?
                    </Label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {PROBLEM_TYPES.map((type) => {
                        const IconComponent = problemTypeIcons[type as keyof typeof problemTypeIcons]
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                              selectedType === type
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-xl ${selectedType === type ? "bg-blue-100" : "bg-gray-100"}`}
                              >
                                <IconComponent
                                  className={`w-5 h-5 ${selectedType === type ? "text-blue-600" : "text-gray-600"}`}
                                />
                              </div>
                              <span className="font-medium text-sm">{type}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-4 block">Priority Level</Label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {PRIORITY_OPTIONS.map((priority) => (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => setSelectedPriority(priority.value as "low" | "medium" | "high" | "urgent")}
                          className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                            selectedPriority === priority.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityIcon(priority.value)}
                            <span className="font-medium text-sm">{priority.label}</span>
                          </div>
                          <Badge className={`${getPriorityColor(priority.value)} border rounded-full text-xs`}>
                            {priority.label}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-base font-medium text-gray-900 mb-2 block">
                      Describe the problem in detail
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide a detailed description of the issue, including when it started, what you've tried, and any other relevant information..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base resize-none"
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-2 block">Add a photo (optional)</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setImage(null)
                              setImagePreview(null)
                            }}
                            className="absolute top-2 right-2 rounded-xl"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !selectedType || !description.trim()}
                      className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-base font-medium"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Submitting Request...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Wrench className="w-5 h-5" />
                          Submit Request
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
