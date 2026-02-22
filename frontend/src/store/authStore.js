import { create } from 'zustand'
import { auth, googleProvider, db, storage } from '../firebase'
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth'
import {
    collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import {
    ref, uploadBytes, getDownloadURL, listAll,
} from 'firebase/storage'

const useAuthStore = create((set, get) => ({
    user: null,
    authLoading: true,
    authError: null,

    // --- Auth ---
    initAuth: () => {
        onAuthStateChanged(auth, (user) => {
            set({ user, authLoading: false })
        })
    },

    signInWithGoogle: async () => {
        set({ authError: null })
        try {
            await signInWithPopup(auth, googleProvider)
        } catch (e) {
            set({ authError: e.message })
        }
    },

    logout: async () => {
        try {
            await signOut(auth)
            set({ user: null })
        } catch (e) {
            console.error('Logout error', e)
        }
    },

    // --- Firestore: Save evaluation report ---
    saveReport: async (report) => {
        const { user } = get()
        if (!user) return null
        try {
            const docRef = await addDoc(collection(db, 'evaluations'), {
                userId: user.uid,
                userEmail: user.email,
                createdAt: serverTimestamp(),
                rankings: report.rankings || [],
                requirements: report.requirements || {},
                report: report.report || '',
                status: report.status || 'complete',
                vendorCount: report.rankings?.length || 0,
                topVendor: report.rankings?.[0]?.vendor_name || 'N/A',
                topScore: report.rankings?.[0]?.overall_score || 0,
            })
            return docRef.id
        } catch (e) {
            console.error('Error saving report:', e)
            return null
        }
    },

    // --- Firestore: Get past evaluations ---
    getPastEvaluations: async () => {
        const { user } = get()
        if (!user) return []
        try {
            const q = query(
                collection(db, 'evaluations'),
                orderBy('createdAt', 'desc'),
                limit(20)
            )
            const snap = await getDocs(q)
            return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        } catch (e) {
            console.error('Error fetching evaluations:', e)
            return []
        }
    },

    // --- Storage: Upload file ---
    uploadFile: async (file, path) => {
        const { user } = get()
        if (!user) return null
        try {
            const storageRef = ref(storage, `users/${user.uid}/${path}/${file.name}`)
            const snap = await uploadBytes(storageRef, file)
            const url = await getDownloadURL(snap.ref)
            return { url, name: file.name, path: snap.ref.fullPath }
        } catch (e) {
            console.error('Error uploading to Firebase Storage:', e)
            return null
        }
    },

    // --- Storage: List user files ---
    listUserFiles: async (folder) => {
        const { user } = get()
        if (!user) return []
        try {
            const listRef = ref(storage, `users/${user.uid}/${folder}`)
            const res = await listAll(listRef)
            const files = await Promise.all(
                res.items.map(async (itemRef) => ({
                    name: itemRef.name,
                    path: itemRef.fullPath,
                    url: await getDownloadURL(itemRef),
                }))
            )
            return files
        } catch (e) {
            console.error('Error listing files:', e)
            return []
        }
    },
}))

export default useAuthStore
