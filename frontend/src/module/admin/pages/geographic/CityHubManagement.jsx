import { useState, useEffect } from "react"
import {
    Building2,
    MapPin,
    Plus,
    Trash2,
    Edit,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Globe,
    PlusCircle,
    X,
    Search
} from "lucide-react"
import { adminAPI } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

export default function CityHubManagement() {
    const [activeTab, setActiveTab] = useState("cities")

    // Cities State
    const [cities, setCities] = useState([])
    const [citiesLoading, setCitiesLoading] = useState(true)
    const [cityForm, setCityForm] = useState({ cityName: "", status: "active" })
    const [editingCityId, setEditingCityId] = useState(null)

    // Hubs State
    const [hubs, setHubs] = useState([])
    const [hubsLoading, setHubsLoading] = useState(true)
    const [hubForm, setHubForm] = useState({
        cityId: "",
        hubName: "",
        hubArea: "",
        serviceablePincodes: [],
        status: "active"
    })
    const [pincodeInput, setPincodeInput] = useState("")
    const [editingHubId, setEditingHubId] = useState(null)

    // Common State
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchCities()
        fetchHubs()
    }, [])

    const fetchCities = async () => {
        try {
            setCitiesLoading(true)
            const response = await adminAPI.getCities()
            if (response.data.success) {
                setCities(response.data.data.cities)
            }
        } catch (err) {
            console.error("Error fetching cities:", err)
            setError("Failed to load cities")
        } finally {
            setCitiesLoading(false)
        }
    }

    const fetchHubs = async () => {
        try {
            setHubsLoading(true)
            const response = await adminAPI.getHubs()
            if (response.data.success) {
                setHubs(response.data.data.hubs)
            }
        } catch (err) {
            console.error("Error fetching hubs:", err)
            setError("Failed to load hubs")
        } finally {
            setHubsLoading(false)
        }
    }

    // City Handlers
    const handleCitySubmit = async (e) => {
        e.preventDefault()
        if (!cityForm.cityName) return setError("City name is required")

        try {
            setSubmitting(true)
            setError(null)

            let response
            if (editingCityId) {
                response = await adminAPI.updateCity(editingCityId, cityForm)
            } else {
                response = await adminAPI.createCity(cityForm)
            }

            if (response.data.success) {
                setSuccess(editingCityId ? "City updated successfully" : "City created successfully")
                setCityForm({ cityName: "", status: "active" })
                setEditingCityId(null)
                fetchCities()
                setTimeout(() => setSuccess(null), 3000)
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save city")
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditCity = (city) => {
        setCityForm({ cityName: city.cityName, status: city.status })
        setEditingCityId(city._id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDeleteCity = async (id) => {
        if (!window.confirm("Are you sure? This may affect hubs linked to this city.")) return
        try {
            await adminAPI.deleteCity(id)
            setSuccess("City deleted successfully")
            fetchCities()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete city")
        }
    }

    // Hub Handlers
    const handleHubSubmit = async (e) => {
        e.preventDefault()
        if (!hubForm.cityId || !hubForm.hubName) {
            return setError("City and Hub name are required")
        }

        try {
            setSubmitting(true)
            setError(null)

            let response
            if (editingHubId) {
                response = await adminAPI.updateHub(editingHubId, hubForm)
            } else {
                response = await adminAPI.createHub(hubForm)
            }

            if (response.data.success) {
                setSuccess(editingHubId ? "Hub updated successfully" : "Hub created successfully")
                setHubForm({ cityId: "", hubName: "", hubArea: "", serviceablePincodes: [], status: "active" })
                setEditingHubId(null)
                fetchHubs()
                setTimeout(() => setSuccess(null), 3000)
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save hub")
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddPincode = () => {
        if (!pincodeInput) return
        if (hubForm.serviceablePincodes.includes(pincodeInput)) {
            setPincodeInput("")
            return
        }
        setHubForm({
            ...hubForm,
            serviceablePincodes: [...hubForm.serviceablePincodes, pincodeInput]
        })
        setPincodeInput("")
    }

    const handleRemovePincode = (pin) => {
        setHubForm({
            ...hubForm,
            serviceablePincodes: hubForm.serviceablePincodes.filter(p => p !== pin)
        })
    }

    const handleEditHub = (hub) => {
        setHubForm({
            cityId: hub.cityId?._id || hub.cityId,
            hubName: hub.hubName,
            hubArea: hub.hubArea || "",
            serviceablePincodes: hub.serviceablePincodes || [],
            status: hub.status
        })
        setEditingHubId(hub._id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDeleteHub = async (id) => {
        if (!window.confirm("Delete this hub?")) return
        try {
            await adminAPI.deleteHub(id)
            setSuccess("Hub deleted successfully")
            fetchHubs()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete hub")
        }
    }

    const filteredCities = cities.filter(c =>
        c.cityName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredHubs = hubs.filter(h =>
        h.hubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.cityId?.cityName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-4 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">City & Hub Management</h1>
                            <p className="text-slate-500 text-sm">Organize service areas by cities and localized hubs</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search cities/hubs..."
                            className="pl-10 w-full md:w-64 bg-slate-50 border-slate-200 text-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{success}</p>
                        <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <Tabs defaultValue="cities" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm mb-6 h-auto flex flex-wrap sm:flex-nowrap gap-2 items-center w-fit">
                        <TabsTrigger
                            value="cities"
                            className="flex items-center justify-center py-2.5 px-6 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200 font-medium hover:bg-slate-50 data-[state=active]:hover:bg-indigo-700 shadow-none border-none"
                        >
                            <Building2 className="w-4 h-4 mr-2.5" />
                            Manage Cities
                        </TabsTrigger>
                        <TabsTrigger
                            value="hubs"
                            className="flex items-center justify-center py-2.5 px-6 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-200 font-medium hover:bg-slate-50 data-[state=active]:hover:bg-indigo-700 shadow-none border-none"
                        >
                            <MapPin className="w-4 h-4 mr-2.5" />
                            Manage Hubs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cities" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* City Form */}
                            <Card className="lg:col-span-1 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">{editingCityId ? "Edit City" : "Add New City"}</CardTitle>
                                    <CardDescription>Enter city details to enable service area</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCitySubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cityName">City Name</Label>
                                            <Input
                                                id="cityName"
                                                value={cityForm.cityName}
                                                onChange={(e) => setCityForm({ ...cityForm, cityName: e.target.value })}
                                                placeholder="e.g. Mumbai, Delhi"
                                                className="bg-slate-50 border-slate-200 text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <select
                                                id="status"
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={cityForm.status}
                                                onChange={(e) => setCityForm({ ...cityForm, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editingCityId ? "Update" : "Create")}
                                            </Button>
                                            {editingCityId && (
                                                <Button type="button" variant="outline" onClick={() => {
                                                    setEditingCityId(null)
                                                    setCityForm({ cityName: "", status: "active" })
                                                }}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* City List */}
                            <Card className="lg:col-span-2 shadow-sm border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>City Name</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Hubs</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {citiesLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></TableCell>
                                                </TableRow>
                                            ) : filteredCities.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-40 text-center text-slate-500">No cities found</TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredCities.map((city) => {
                                                    const cityHubs = hubs.filter(h => (h.cityId?._id || h.cityId) === city._id)
                                                    return (
                                                        <TableRow key={city._id}>
                                                            <TableCell className="font-medium text-slate-900">{city.cityName}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={city.status === 'active' ? 'success' : 'secondary'} className={city.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                                    {city.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-slate-600 text-sm font-medium bg-slate-100 px-2 py-1 rounded-full">{cityHubs.length} Hubs</span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => handleEditCity(city)}>
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteCity(city._id)}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="hubs" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Hub Form */}
                            <Card className="lg:col-span-1 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">{editingHubId ? "Edit Hub" : "Add New Hub"}</CardTitle>
                                    <CardDescription>Assign hub to a city and define service area</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleHubSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hubCity">Select City</Label>
                                            <select
                                                id="hubCity"
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={hubForm.cityId}
                                                onChange={(e) => setHubForm({ ...hubForm, cityId: e.target.value })}
                                                required
                                            >
                                                <option value="">Choose a city...</option>
                                                {cities.map(city => (
                                                    <option key={city._id} value={city._id}>{city.cityName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hubName">Hub Name</Label>
                                            <Input
                                                id="hubName"
                                                value={hubForm.hubName}
                                                onChange={(e) => setHubForm({ ...hubForm, hubName: e.target.value })}
                                                placeholder="e.g. Andheri West Hub"
                                                required
                                                className="bg-slate-50 border-slate-200 text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hubArea">Hub Area (Optional)</Label>
                                            <Input
                                                id="hubArea"
                                                value={hubForm.hubArea}
                                                onChange={(e) => setHubForm({ ...hubForm, hubArea: e.target.value })}
                                                placeholder="e.g. SV Road Area"
                                                className="bg-slate-50 border-slate-200 text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Serviceable Pincodes</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    value={pincodeInput}
                                                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="6-digit PIN"
                                                    maxLength={6}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPincode())}
                                                    className="bg-slate-50 border-slate-200 text-slate-900"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleAddPincode}>
                                                    <PlusCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-1 border border-dashed border-slate-200 p-3 rounded-lg min-h-[60px]">
                                                {hubForm.serviceablePincodes.length === 0 && <p className="text-xs text-slate-400 italic">No pincodes added</p>}
                                                {hubForm.serviceablePincodes.map(pin => (
                                                    <Badge key={pin} className="bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center gap-1 py-1 pr-1">
                                                        {pin}
                                                        <button type="button" onClick={() => handleRemovePincode(pin)} className="hover:bg-amber-300/30 rounded-full p-0.5">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hubStatus">Status</Label>
                                            <select
                                                id="hubStatus"
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={hubForm.status}
                                                onChange={(e) => setHubForm({ ...hubForm, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editingHubId ? "Update" : "Create")}
                                            </Button>
                                            {editingHubId && (
                                                <Button type="button" variant="outline" onClick={() => {
                                                    setEditingHubId(null)
                                                    setHubForm({ cityId: "", hubName: "", hubArea: "", serviceablePincodes: [], status: "active" })
                                                }}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Hub List */}
                            <Card className="lg:col-span-2 shadow-sm border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Hub Name</TableHead>
                                                <TableHead>City</TableHead>
                                                <TableHead>Pincodes</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {hubsLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></TableCell>
                                                </TableRow>
                                            ) : filteredHubs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-40 text-center text-slate-500">No hubs found</TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredHubs.map((hub) => (
                                                    <TableRow key={hub._id}>
                                                        <TableCell>
                                                            <div className="font-medium text-slate-900">{hub.hubName}</div>
                                                            {hub.hubArea && <div className="text-xs text-slate-500">{hub.hubArea}</div>}
                                                        </TableCell>
                                                        <TableCell className="text-slate-600 font-medium">
                                                            {hub.cityId?.cityName || "Unknown City"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {hub.serviceablePincodes?.slice(0, 3).map(pin => (
                                                                    <span key={pin} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium border border-indigo-100">{pin}</span>
                                                                ))}
                                                                {hub.serviceablePincodes?.length > 3 && (
                                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">+{hub.serviceablePincodes.length - 3} more</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={hub.status === 'active' ? 'success' : 'secondary'} className={hub.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                                {hub.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => handleEditHub(hub)}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteHub(hub._id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
