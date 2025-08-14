"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadToImgBB } from "@/lib/imgbb"
import { useAuth } from "@/hooks/useAuth"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, X, CheckCircle, AlertCircle, FileText, Send } from "lucide-react"
import Image from "next/image"

const problemTypes = [
  "Electrical Issues",
  "Plumbing Problems",
  "HVAC/Air Conditioning",
  "Lighting",
  "Furniture Repair",
  "Equipment Malfunction",
  "Cleaning Services",
  "Security Systems",
  "Network/IT Issues",
  "Building Maintenance",
  "Other",
]

export default function CreateRequestPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    problemType: "",
    description: "",
    priority: "medium",
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

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
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      let imageUrl = null
      if (image) {
        imageUrl = await uploadToImgBB(image)
      }

      await addDoc(collection(db, "requests"), {
        ...formData,
        imageUrl,
        branchCode: user.branchCode,
        userEmail: user.email,
        status: "قيد المراجعة",
        timestamp: serverTimestamp(),
      })

      toast({
        title: "Request Submitted Successfully! 🎉",
        description: "Your maintenance request has been submitted and is under review.",
      })

      // Reset form
      setFormData({
        problemType: "",
        description: "",
        priority: "medium",
      })
      setImage(null)
      setImagePreview(null)
      setCurrentStep(1)
    } catch (error) {
      console.error("Error submitting request:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = formData.problemType && formData.description.trim().length >= 10
  const canSubmit = canProceedToStep2 && formData.priority

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
        <div className="px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Create New Request</h1>
            <p className="text-gray-600">Submit a maintenance request for your branch</p>
          </div>

          {/* Progress Steps - Mobile optimized */}
          <div className="mb-8">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
                </div>
                <span className="font-medium hidden sm:inline">Problem Details</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStep >= 2 ? "bg-blue-600 w-full" : "bg-gray-200 w-0"
                  }`}
                />
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
                </div>
                <span className="font-medium hidden sm:inline">Additional Info</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            {/* Step 1: Problem Details */}
            {currentStep === 1 && (
              <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Problem Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="problemType" className="text-base font-medium text-gray-700 mb-3 block">
                      What type of problem are you experiencing? *
                    </Label>
                    <Select
                      value={formData.problemType}
                      onValueChange={(value) => setFormData({ ...formData, problemType: value })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base bg-white">
                        <SelectValue placeholder="Select problem type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {problemTypes.map((type) => (
                          <SelectItem key={type} value={type} className="h-12 text-base">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-base font-medium text-gray-700 mb-3 block">
                      Describe the problem in detail *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide a detailed description of the issue, including location, when it started, and any other relevant information..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      className="rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base resize-none bg-white"
                      required
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">Minimum 10 characters required</p>
                      <p
                        className={`text-sm ${formData.description.length >= 10 ? "text-green-600" : "text-gray-400"}`}
                      >
                        {formData.description.length}/500
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep2}
                      className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-8"
                    >
                      Continue
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Additional Information */}
            {currentStep === 2 && (
              <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="priority" className="text-base font-medium text-gray-700 mb-3 block">
                      Priority Level *
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 text-base bg-white">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="low" className="h-12 text-base">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Low - Can wait a few days
                          </div>
                        </SelectItem>
                        <SelectItem value="medium" className="h-12 text-base">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            Medium - Should be addressed soon
                          </div>
                        </SelectItem>
                        <SelectItem value="high" className="h-12 text-base">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            High - Urgent attention needed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-3 block">Add Photo (Optional)</Label>
                    <div className="space-y-4">
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-white">
                          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Camera className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-gray-600 mb-4">
                            Take a photo or upload an image to help us understand the problem better
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl h-12 px-6 border-2 bg-transparent"
                              onClick={() => document.getElementById("image-upload")?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <p className="text-sm text-gray-500 mt-3">Maximum file size: 5MB</p>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-white border-2 border-gray-200">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            width={400}
                            height={300}
                            className="w-full h-64 object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={removeImage}
                            className="absolute top-3 right-3 rounded-full w-8 h-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="rounded-2xl h-12 px-6 border-2 flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="bg-green-600 hover:bg-green-700 rounded-2xl h-12 px-8 flex-1"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Submitting...
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>

          {/* Help Section */}
          <Card className="rounded-3xl border-0 shadow-sm bg-white/60 backdrop-blur-sm mt-8 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Tips for better requests:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Be specific about the type and nature of the problem
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Include photos when possible to help our team understand the issue
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Set the appropriate priority level to help us respond accordingly
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
