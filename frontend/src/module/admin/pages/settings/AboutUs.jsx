import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import api, { uploadAPI } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/api/config"
import { Heart, Users, Shield, Clock, Star, Award, Plus, X, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCompanyName } from "@/lib/hooks/useCompanyName"
import { getModuleToken } from "@/lib/utils/auth"

// Icon mapping
const iconMap = {
  Heart,
  Users,
  Shield,
  Clock,
  Star,
  Award
}

const iconOptions = [
  { value: 'Heart', label: 'Heart' },
  { value: 'Users', label: 'Users' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Clock', label: 'Clock' },
  { value: 'Star', label: 'Star' },
  { value: 'Award', label: 'Award' }
]

const colorOptions = [
  { value: 'text-pink-600 dark:text-pink-400', label: 'Pink', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  { value: 'text-blue-600 dark:text-blue-400', label: 'Blue', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'text-green-600 dark:text-green-400', label: 'Green', bg: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'text-orange-600 dark:text-orange-400', label: 'Orange', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'text-purple-600 dark:text-purple-400', label: 'Purple', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { value: 'text-red-600 dark:text-red-400', label: 'Red', bg: 'bg-red-100 dark:bg-red-900/30' }
]

export default function AboutUs() {
  const companyName = useCompanyName()
  const logoFileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [aboutData, setAboutData] = useState({
    appName: 'Appzeto Food',
    version: '1.0.0',
    description: '',
    logo: '',
    features: []
  })

  useEffect(() => {
    fetchAboutData()
  }, [])

  const getAdminAuthConfig = () => {
    const token = getModuleToken("admin") || localStorage.getItem("accessToken")
    if (!token || token === "null" || token === "undefined") {
      return null
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }

  const buildAboutPayload = (data) => {
    const features = Array.isArray(data.features)
      ? data.features
          .filter((feature) => feature && feature.icon && String(feature.title || "").trim() && String(feature.description || "").trim())
          .map((feature, index) => ({
            icon: feature.icon,
            title: String(feature.title || "").trim(),
            description: String(feature.description || "").trim(),
            color: feature.color || "text-gray-600",
            bgColor: feature.bgColor || "bg-gray-100",
            order: Number.isFinite(feature.order) ? feature.order : index
          }))
      : []

    const stats = Array.isArray(data.stats)
      ? data.stats
          .filter((stat) => stat && stat.icon && String(stat.label || "").trim() && String(stat.value || "").trim())
          .map((stat, index) => ({
            label: String(stat.label || "").trim(),
            value: String(stat.value || "").trim(),
            icon: stat.icon,
            order: Number.isFinite(stat.order) ? stat.order : index
          }))
      : []

    return {
      appName: String(data.appName || "").trim(),
      version: String(data.version || "").trim(),
      description: String(data.description || "").trim(),
      logo: String(data.logo || "").trim(),
      features,
      stats
    }
  }

  const fetchAboutData = async () => {
    try {
      setLoading(true)
      const authConfig = getAdminAuthConfig()
      if (!authConfig) {
        toast.error("Admin session not found. Please login again.")
        return
      }
      const response = await api.get(API_ENDPOINTS.ADMIN.ABOUT, authConfig)
      if (response.data.success) {
        setAboutData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching about data:', error)
      toast.error(error?.response?.data?.message || 'Failed to load about page data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const payload = buildAboutPayload(aboutData)
      if (!payload.appName || !payload.version || !payload.description) {
        toast.error("App Name, Version and Description are required")
        return
      }
      const authConfig = getAdminAuthConfig()
      if (!authConfig) {
        toast.error("Admin session expired. Please login again.")
        return
      }

      setSaving(true)
      const response = await api.put(API_ENDPOINTS.ADMIN.ABOUT, payload, authConfig)
      if (response.data.success) {
        toast.success('About page updated successfully')
        await fetchAboutData()
      }
    } catch (error) {
      console.error('Error saving about data:', error)
      toast.error(error.response?.data?.message || 'Failed to save about page')
    } finally {
      setSaving(false)
    }
  }

  const addFeature = () => {
    setAboutData(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          icon: 'Heart',
          title: '',
          description: '',
          color: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-100 dark:bg-pink-900/30',
          order: prev.features.length
        }
      ]
    }))
  }

  const removeFeature = async (index) => {
    try {
      // Update state immediately for better UX
      const updatedData = {
        ...aboutData,
        features: aboutData.features.filter((_, i) => i !== index)
      }
      
      setAboutData(updatedData)
      
      // Save to backend immediately
      const authConfig = getAdminAuthConfig()
      if (!authConfig) {
        toast.error("Admin session expired. Please login again.")
        return
      }
      setSaving(true)
      const response = await api.put(API_ENDPOINTS.ADMIN.ABOUT, buildAboutPayload(updatedData), authConfig)
      if (response.data.success) {
        toast.success('Feature deleted successfully')
        setAboutData(response.data.data)
      }
    } catch (error) {
      console.error('Error deleting feature:', error)
      toast.error(error.response?.data?.message || 'Failed to delete feature')
      // Revert state on error
      fetchAboutData()
    } finally {
      setSaving(false)
    }
  }

  const updateFeature = (index, field, value) => {
    setAboutData(prev => {
      const newFeatures = [...prev.features]
      newFeatures[index] = { ...newFeatures[index], [field]: value }
      
      // Update bgColor when color changes
      if (field === 'color') {
        const colorOption = colorOptions.find(opt => opt.value === value)
        if (colorOption) {
          newFeatures[index].bgColor = colorOption.bg
        }
      }
      
      return { ...prev, features: newFeatures }
    })
  }

  const handleLogoUploadClick = () => {
    logoFileInputRef.current?.click()
  }

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      e.target.value = ""
      return
    }

    try {
      setUploadingLogo(true)
      const response = await uploadAPI.uploadMedia(file, { folder: "about-page" })
      const uploadedUrl = response?.data?.data?.url || response?.data?.url

      if (!uploadedUrl) {
        throw new Error("Failed to get uploaded image URL")
      }

      setAboutData((prev) => ({ ...prev, logo: uploadedUrl }))
      toast.success("Logo uploaded successfully")
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error(error?.response?.data?.message || "Failed to upload logo")
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">About Us</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your About page content</p>
          </div>
          <Button type="button" onClick={handleSave} disabled={saving} size="lg" className="whitespace-nowrap bg-sky-500 hover:bg-sky-600 text-white border-sky-500">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={aboutData.appName}
                onChange={(e) => setAboutData(prev => ({ ...prev, appName: e.target.value }))}
                placeholder={companyName}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={aboutData.version}
                onChange={(e) => setAboutData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={aboutData.description}
                onChange={(e) => setAboutData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Your trusted food delivery partner..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="logo"
                  value={aboutData.logo}
                  onChange={(e) => setAboutData(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogoUploadClick}
                  disabled={uploadingLogo}
                  className="whitespace-nowrap"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Features</CardTitle>
            <Button onClick={addFeature} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {aboutData.features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || Heart
              return (
                <Card key={index} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`${feature.bgColor} rounded-lg p-3 flex-shrink-0`}>
                        <IconComponent className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Icon</Label>
                            <Select
                              value={feature.icon}
                              onValueChange={(value) => updateFeature(index, 'icon', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {iconOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Color</Label>
                            <Select
                              value={feature.color}
                              onValueChange={(value) => updateFeature(index, 'color', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => updateFeature(index, 'title', e.target.value)}
                            placeholder="Feature title"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={feature.description}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            placeholder="Feature description"
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {aboutData.features.length === 0 && (
              <p className="text-center text-slate-500 py-8">No features added yet. Click "Add Feature" to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg" className="bg-sky-500 hover:bg-sky-600 text-white border-sky-500">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
        </form>
      </div>
    </div>
  )
}
