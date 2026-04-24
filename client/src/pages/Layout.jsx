import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
import { useUser, SignIn, useAuth, useOrganization, CreateOrganization } from '@clerk/react'
import { fetchworkspaces } from '../features/workspaceSlice'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { loading, workspaces } = useSelector((state) => state.workspace)
    const dispatch = useDispatch()
    const { user, isLoaded } = useUser()
    const { getToken } = useAuth()
    const { organization } = useOrganization()

    useEffect(() => {
        dispatch(loadTheme())
    }, [])

    // Initial fetch
    useEffect(() => {
        if (isLoaded && user) {
            dispatch(fetchworkspaces({ getToken }))
        }
    }, [isLoaded, user?.id, organization?.id])

    // Poll every 2s if user has org but workspace not in DB yet (Inngest delay)
    useEffect(() => {
        if (isLoaded && user && organization && workspaces.length === 0 && !loading) {
            const interval = setInterval(() => {
                dispatch(fetchworkspaces({ getToken }))
            }, 2000)
            return () => clearInterval(interval)
        }
    }, [isLoaded, user?.id, organization?.id, workspaces.length, loading])

    if (!isLoaded || loading) return (
        <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
            <Loader2Icon className="size-7 text-blue-500 animate-spin" />
        </div>
    )

    if (!user) return (
        <div className='flex justify-center items-center h-screen bg-white dark:bg-zinc-950'>
            <SignIn />
        </div>
    )

    if (!loading && workspaces.length === 0) return (
        <div className='min-h-screen flex flex-col justify-center items-center gap-6 bg-white dark:bg-zinc-950'>
            <div className='text-center'>
                <h2 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>Welcome! 👋</h2>
                <p className='text-gray-500 dark:text-gray-400'>Create your first workspace to get started.</p>
            </div>
            <CreateOrganization afterCreateOrganizationUrl="/" />
        </div>
    )

    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout