import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addWorkspace } from '../features/workspaceSlice'
import api from '../configs/api'
import { useAuth } from '@clerk/react'

const CreateWorkspaceForm = () => {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()
    const { getToken } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/api/workspaces/create', 
                { name },
                { headers: { Authorization: `Bearer ${await getToken()}` }}
            )
            dispatch(addWorkspace(data.workspace))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-md w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4 dark:text-white'>Create Workspace</h3>
            <input
                type='text'
                placeholder='Workspace name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full border rounded-lg p-3 mb-4 dark:bg-zinc-800 dark:text-white dark:border-zinc-700'
                required
            />
            <button
                type='submit'
                disabled={loading}
                className='w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50'
            >
                {loading ? 'Creating...' : 'Create Workspace'}
            </button>
        </form>
    )
}

export default CreateWorkspaceForm