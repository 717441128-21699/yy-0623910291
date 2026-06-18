import { X, Camera, Mic, MapPin, Clock, ClipboardCopy, FileText, Send, Smile, Meh, Frown, RefreshCw, MessageSquare } from 'lucide-react'
import type { Verification, FeedbackRecord, Clue, FollowUpRecord } from '@/types'
import { VERIFY_STATUS_LABELS, CATEGORY_LABELS, SATISFACTION_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import CategoryIcon from '@/components/CategoryIcon'
import VoicePlayer from '@/components/VoicePlayer'

interface Props {
  verification: Verification & { clue: Clue }
  feedback?: FeedbackRecord
  onClose: () => void
  onVerify?: () => void
  onFeedback?: () => void
}

export default function VerificationDetail({ verification, feedback, onClose, onVerify, onFeedback }: Props) {
  const getCommunityById = useStore((s) => s.getCommunityById)
  const community = getCommunityById(verification.clue.communityId)

  const verifyStatus = verification.verifyStatus
  const verifyStatusColor = verifyStatus === 'confirmed'
    ? 'bg-emerald-100 text-emerald-700'
    : verifyStatus === 'partial'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">取证详情</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 flex-1">
          <div className="py-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <CategoryIcon category={verification.clue.category} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">{community?.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${verifyStatusColor}`}>
                    {verifyStatus ? VERIFY_STATUS_LABELS[verifyStatus] : '未核验'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{verification.clue.originalText}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    类别：{CATEGORY_LABELS[verification.clue.category]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="py-4 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Camera size={14} className="text-teal-600" />
              现场照片
            </h4>
            {verification.photos.length > 0 ? (
              <div className="flex gap-3 flex-wrap">
                {verification.photos.map((photo, i) => (
                  <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">未拍摄照片</p>
            )}
          </div>

          <div className="py-4 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Mic size={14} className="text-teal-600" />
              语音备注
            </h4>
            {verification.voiceBlob ? (
              <VoicePlayer blob={verification.voiceBlob} duration={verification.voiceDuration} />
            ) : (
              <p className="text-sm text-slate-400">无语音备注</p>
            )}
          </div>

          <div className="py-4 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin size={14} className="text-teal-600" />
              核验位置
            </h4>
            <p className="text-sm text-slate-700">{verification.location || '未定位'}</p>
          </div>

          {verification.verifiedAt && (
            <div className="py-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock size={14} className="text-teal-600" />
                核验时间
              </h4>
              <p className="text-sm text-slate-700">
                {new Date(verification.verifiedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          )}

          {feedback && (
            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-teal-600" />
                  处置结果
                </h4>
                <div className="bg-slate-50 rounded-xl p-3">
                  {feedback.result ? (
                    <p className="text-sm text-slate-700">{feedback.result}</p>
                  ) : (
                    <p className="text-sm text-slate-400">无处置结果</p>
                  )}
                </div>
              </div>

              {feedback.transferDept && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Send size={14} className="text-teal-600" />
                    转办信息
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-slate-700">
                      <span className="text-slate-400">转办部门：</span>
                      {feedback.transferDept}
                    </p>
                    {feedback.transferReason && (
                      <p className="text-sm text-slate-700">
                        <span className="text-slate-400">转办原因：</span>
                        {feedback.transferReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <ClipboardCopy size={14} className="text-teal-600" />
                  社区群回复
                </h4>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <p className="text-sm text-teal-800 leading-relaxed">{feedback.generatedNotice}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(feedback.generatedNotice).catch(() => {})
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-teal-600 font-medium"
                  >
                    <ClipboardCopy size={12} />
                    一键复制
                  </button>
                </div>
              </div>

              {feedback.followUps && feedback.followUps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={14} className="text-purple-600" />
                    回访记录
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-normal">
                      {feedback.followUps.length}条
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {feedback.followUps.map((fu: FollowUpRecord, idx: number) => {
                      const SatIcon = fu.satisfaction === 'satisfied' ? Smile :
                        fu.satisfaction === 'neutral' ? Meh :
                        fu.satisfaction === 'dissatisfied' ? Frown : Meh
                      const satColor = fu.satisfaction === 'satisfied' ? 'text-green-500' :
                        fu.satisfaction === 'neutral' ? 'text-amber-500' :
                        fu.satisfaction === 'dissatisfied' ? 'text-red-500' : 'text-slate-400'
                      return (
                        <div key={fu.id} className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full text-slate-500">
                              第{idx + 1}次回访
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${satColor.replace('text-', 'bg-').replace('500', '100')} ${satColor}`}>
                              <SatIcon size={10} />
                              {fu.satisfaction ? SATISFACTION_LABELS[fu.satisfaction] : '未记录'}
                            </span>
                            {fu.isRecurrence && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                                <RefreshCw size={8} />
                                已复发
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 ml-auto">
                              {new Date(fu.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {fu.additionalNotes && (
                            <p className="text-xs text-slate-600 mb-2">{fu.additionalNotes}</p>
                          )}
                          {fu.additionalPhotos.length > 0 && (
                            <div className="flex gap-1.5">
                              {fu.additionalPhotos.map((p: string, i: number) => (
                                <img key={i} src={p} alt="" className="w-14 h-14 rounded-lg object-cover" />
                              ))}
                            </div>
                          )}
                          {fu.generatedFollowUpNotice && (
                            <div className="mt-2 bg-white rounded-lg p-2 border border-purple-100">
                              <p className="text-[10px] text-purple-700 leading-relaxed whitespace-pre-line">
                                {fu.generatedFollowUpNotice}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(fu.generatedFollowUpNotice).catch(() => {})
                                }}
                                className="mt-1.5 flex items-center gap-1 text-[10px] text-purple-600 font-medium"
                              >
                                <ClipboardCopy size={10} />
                                复制回访回复
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          {!verification.verifyStatus && onVerify && (
            <button
              onClick={onVerify}
              className="flex-1 bg-teal-600 text-white rounded-xl py-3 text-sm font-medium active:bg-teal-700"
            >
              前往核验
            </button>
          )}
          {verification.verifyStatus && !feedback && onFeedback && (
            <button
              onClick={onFeedback}
              className="flex-1 bg-teal-600 text-white rounded-xl py-3 text-sm font-medium active:bg-teal-700"
            >
              填写反馈
            </button>
          )}
          {feedback && (
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-3 text-sm font-medium active:bg-slate-200"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
