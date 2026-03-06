import { defineStore } from 'pinia'
import type { BoneTransform, AttachmentInfo } from '@/core/types/ISpineAdapter'

export const useInspectorStore = defineStore('inspector', () => {
  const boneTransforms    = shallowRef<BoneTransform[]>([])
  const activeAttachments = shallowRef<AttachmentInfo[]>([])

  function update(bones: BoneTransform[], attachments: AttachmentInfo[]) {
    boneTransforms.value    = bones
    activeAttachments.value = attachments
  }

  function clear() {
    boneTransforms.value    = []
    activeAttachments.value = []
  }

  return { boneTransforms, activeAttachments, update, clear }
})
