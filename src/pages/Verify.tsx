import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Mic, MicOff, MapPin, Check, X, Image as ImageIcon, AlertCircle, Clock, PlayCircle } from 'lucide-react'
import type { VerifyStatus } from '@/types'
import { VERIFY_STATUS_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import VoicePlayer from '@/components/VoicePlayer'

const verifyOptions: { value: VerifyStatus; label: string; color: string; bg: string; border: string }[] = [
  { value: 'confirmed', label: '属实', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  { value: 'partial', label: '部分属实', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
  { value: 'pending_further', label: '待进一步了解', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-300' },
]

export default function Verify() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const activeVerifyClueId = useStore((s) => s.activeVerifyClueId)
  const getClueById = useStore((s) => s.getClueById)
  const getCommunityById = useStore((s) => s.getCommunityById)
  const getVerificationByClueId = useStore((s) => s.getVerificationByClueId)
  const submitVerification = useStore((s) => s.submitVerification)

  const clueId = params.id || activeVerifyClueId
  const clue = clueId ? getClueById(clueId) : null
  const existingVerification = clueId ? getVerificationByClueId(clueId) : null
  const community = clue ? getCommunityById(clue.communityId) : undefined

  const isViewMode = !!existingVerification

  const [photos, setPhotos] = useState<string[]>(existingVerification?.photos || [])
  const [isRecording, setIsRecording] = useState(false)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(existingVerification?.voiceBlob || null)
  const [voiceDuration, setVoiceDuration] = useState(existingVerification?.voiceDuration || 0)
  const [location, setLocation] = useState(existingVerification?.location || '')
  const [locationConfirmed, setLocationConfirmed] = useState(!!existingVerification?.location)
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus | null>(existingVerification?.verifyStatus || null)
  const [isLocating, setIsLocating] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (existingVerification) {
      setPhotos(existingVerification.photos)
      setVoiceBlob(existingVerification.voiceBlob)
      setVoiceDuration(existingVerification.voiceDuration)
      setLocation(existingVerification.location)
      setLocationConfirmed(!!existingVerification.location)
      setVerifyStatus(existingVerification.verifyStatus)
    }
  }, [existingVerification])

  const handleTakePhoto = useCallback(() => {
    if (isViewMode) return
    fileInputRef.current?.click()
  }, [isViewMode])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setPhotos((prev) => {
          if (prev.length >= 3) return prev
          return [...prev, result]
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }, [isViewMode])

  const removePhoto = useCallback((index: number) => {
    if (isViewMode) return
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [isViewMode])

  const handleStartRecording = useCallback(async () => {
    if (isViewMode) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const duration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 5
        setVoiceBlob(blob)
        setVoiceDuration(duration)
        setIsRecording(false)
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
      }
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setRecordingStartTime(Date.now())
      setIsRecording(true)
    } catch {
      const mockBlob = new Blob(['mock voice data'], { type: 'audio/webm' })
      setVoiceBlob(mockBlob)
      setVoiceDuration(5)
      setIsRecording(false)
    }
  }, [isViewMode, recordingStartTime])

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handleGetLocation = useCallback(() => {
    if (isViewMode) return
    setIsLocating(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`${community?.name || '当前位置'}附近 (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`)
          setLocationConfirmed(true)
          setIsLocating(false)
        },
        () => {
          setLocation(`${community?.name || '模拟位置'}·中心花园旁`)
          setLocationConfirmed(true)
          setIsLocating(false)
        }
      )
    } else {
      setLocation(`${community?.name || '模拟位置'}·中心花园旁`)
      setLocationConfirmed(true)
      setIsLocating(false)
    }
  }, [community, isViewMode])

  const handleSubmit = useCallback(() => {
    if (!clueId || !verifyStatus) return
    submitVerification({
      clueId,
      photos,
      voiceNoteUrl: voiceBlob ? 'voice_note_mock' : '',
      voiceBlob,
      voiceDuration,
      location: location || '未定位',
      verifyStatus,
    })
    navigate('/feedback', { state: { clueId } })
  }, [clueId, verifyStatus, photos, voiceBlob, voiceDuration, location, submitVerification, navigate])

  if (!clue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-8">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-medium text-slate-500 mb-2">暂无核验任务</h2>
          <p className="text-sm text-slate-400 mb-6">请先从今日线索中选择一条前往核验</p>
          <button
            onClick={() => navigate('/')}
            className="bg-teal-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            返回线索列表
          </button>
        </div>
      </div>
    )
  }

  const canSubmit = !isViewMode && verifyStatus !== null

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className={`border-b px-5 pt-12 pb-4 ${isViewMode ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isViewMode ? 'bg-teal-100' : 'bg-amber-100'}`}>
            {isViewMode ? (
              <Check size={16} className="text-teal-600" />
            ) : (
              <AlertCircle size={16} className="text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h2 className={`text-sm font-semibold ${isViewMode ? 'text-teal-800' : 'text-amber-800'}`}>
              {isViewMode ? '核验取证包' : '核验任务'}
            </h2>
            <p className={`text-xs mt-0.5 line-clamp-2 ${isViewMode ? 'text-teal-600' : 'text-amber-600'}`}>
              {clue.originalText}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] ${isViewMode ? 'text-teal-500' : 'text-amber-500'}`}>
                {community?.name}
              </span>
              {existingVerification?.verifiedAt && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(existingVerification.verifiedAt).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Camera size={16} className="text-teal-600" />
            现场照片
            <span className="text-xs text-slate-400 font-normal">（最多3张）</span>
          </h3>
          <div className="flex gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                {!isViewMode && (
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                )}
              </div>
            ))}
            {!isViewMode && photos.length < 3 && (
              <button
                onClick={handleTakePhoto}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 active:bg-slate-50 transition-colors"
              >
                <ImageIcon size={20} className="text-slate-400" />
                <span className="text-[10px] text-slate-400">添加照片</span>
              </button>
            )}
            {isViewMode && photos.length === 0 && (
              <span className="text-xs text-slate-400 py-6">未拍摄照片</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Mic size={16} className="text-teal-600" />
            语音备注
          </h3>
          {voiceBlob ? (
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <VoicePlayer blob={voiceBlob} duration={voiceDuration} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                disabled={isViewMode}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all select-none ${
                  isRecording
                    ? 'bg-red-500 scale-110 animate-pulse-recording'
                    : isViewMode
                    ? 'bg-slate-100 border-2 border-slate-200'
                    : 'bg-teal-50 border-2 border-teal-200'
                }`}
              >
                {isRecording ? (
                  <MicOff size={24} className="text-white" />
                ) : voiceBlob ? (
                  <PlayCircle size={24} className="text-teal-600" />
                ) : (
                  <Mic size={24} className={isViewMode ? 'text-slate-300' : 'text-teal-600'} />
                )}
              </button>
              <div>
                <p className="text-sm text-slate-600">
                  {isViewMode ? '无语音备注' : isRecording ? '松手结束录音' : '长按开始录音'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isRecording ? '录音中...' : '现场情况可语音快速记录'}
                </p>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-teal-600" />
            位置确认
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            {location ? (
              <div className="flex items-center gap-2">
                <MapPin size={16} className={locationConfirmed ? 'text-green-500' : 'text-slate-400'} />
                <span className="text-sm text-slate-700 flex-1">{location}</span>
                {locationConfirmed && <Check size={16} className="text-green-500" />}
              </div>
            ) : (
              <button
                onClick={handleGetLocation}
                disabled={isLocating || isViewMode}
                className="flex items-center gap-2 text-sm text-teal-600 font-medium"
              >
                <MapPin size={16} />
                {isLocating ? '定位中...' : '点击获取当前位置'}
              </button>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">核实状态</h3>
          <div className="grid grid-cols-3 gap-3">
            {verifyOptions.map((opt) => {
              const selected = verifyStatus === opt.value
              return (
                <div
                  key={opt.value}
                  className={`rounded-xl py-4 px-2 border-2 transition-all text-center ${
                    selected ? `${opt.bg} ${opt.border}` : 'bg-white border-slate-200'
                  } ${!isViewMode && !selected ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!isViewMode) setVerifyStatus(opt.value)
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mx-auto mb-2 flex items-center justify-center ${
                      selected ? `${opt.border} ${opt.bg}` : 'border-slate-300'
                    }`}
                  >
                    {selected && (
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        opt.value === 'confirmed' ? 'bg-emerald-500' :
                        opt.value === 'partial' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    selected ? opt.color : 'text-slate-500'
                  }`}>
                    {opt.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {isViewMode && existingVerification && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-xs text-teal-700 font-medium mb-2">核验结论</p>
            <p className="text-sm text-teal-800">
              {VERIFY_STATUS_LABELS[existingVerification.verifyStatus!]}
            </p>
          </div>
        )}
      </div>

      {!isViewMode && (
        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white/80 backdrop-blur-lg border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full rounded-xl py-3.5 text-sm font-medium transition-all ${
              canSubmit
                ? 'bg-teal-600 text-white active:bg-teal-700 shadow-lg shadow-teal-600/20'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            提交核验结果
          </button>
        </div>
      )}

      {isViewMode && existingVerification && (
        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white/80 backdrop-blur-lg border-t border-slate-100">
          <button
            onClick={() => navigate('/feedback', { state: { clueId } })}
            className="w-full bg-teal-600 text-white rounded-xl py-3.5 text-sm font-medium active:bg-teal-700 shadow-lg shadow-teal-600/20"
          >
            填写反馈
          </button>
        </div>
      )}
    </div>
  )
}
