import type { Clue, Verification, FeedbackRecord } from '@/types'

const STORAGE_KEY = 'grid_clue_app_data'

export interface StoredData {
  clues: Clue[]
  verifications: Verification[]
  feedbacks: FeedbackRecord[]
  savedAt: string
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function base64ToBlob(base64: string): Blob {
  const arr = base64.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'audio/webm'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

async function serializeVerifications(verifications: Verification[]): Promise<Verification[]> {
  return Promise.all(
    verifications.map(async (v) => {
      if (v.voiceBlob && !v.voiceBase64) {
        const base64 = await blobToBase64(v.voiceBlob)
        return { ...v, voiceBase64: base64 }
      }
      return v
    })
  )
}

function deserializeVerifications(verifications: Verification[]): Verification[] {
  return verifications.map((v) => {
    if (v.voiceBase64 && !v.voiceBlob) {
      try {
        const blob = base64ToBlob(v.voiceBase64)
        return { ...v, voiceBlob: blob }
      } catch {
        return v
      }
    }
    return v
  })
}

export async function saveToLocalStorage(data: {
  clues: Clue[]
  verifications: Verification[]
  feedbacks: FeedbackRecord[]
}): Promise<void> {
  try {
    const serializedVerifications = await serializeVerifications(data.verifications)
    const stored: StoredData = {
      clues: data.clues,
      verifications: serializedVerifications,
      feedbacks: data.feedbacks,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function loadFromLocalStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredData
    parsed.verifications = deserializeVerifications(parsed.verifications)
    return parsed
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
    return null
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
