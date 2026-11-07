import { useMutation } from '@vue/apollo-composable'
import { provideForm, useForm } from '@vuehookform/core'
import { useToast } from 'primevue/usetoast'
import {
  COMPLETE_POST_IMAGE_UPLOAD_MUTATION,
  CREATE_POST_IMAGE_UPLOAD_MUTATION,
  CREATE_POST_MUTATION,
} from '~/api/post'
import { POST } from '~/constants/post'
import { ROUTE } from '~/constants/routes'
import { createPostDefaultValues, createPostSchema } from '~/schemas/post'
import type {
  CompletePostImageUploadMutation,
  CompletePostImageUploadVariables,
  CreatePostImageUploadMutation,
  CreatePostImageUploadVariables,
  CreatePostMutation,
  CreatePostVariables,
} from '~/types/post'
import type { MerchantStore } from '~/types/store'
import { getGraphqlErrorDetails } from '~/utils/graphql'

const toUtcDateTime = (value: string) => new Date(value).toISOString()

export const usePostForm = (store: MerchantStore) => {
  const { t } = useTranslate()
  const toast = useToast()
  const form = useForm({
    schema: createPostSchema,
    defaultValues: createPostDefaultValues(store),
    reValidateMode: 'onChange',
  })
  const selectedImage = ref<File | null>(null)
  const imageError = ref<string | null>(null)
  const { mutate: createPostImageUpload } = useMutation<
    CreatePostImageUploadMutation,
    CreatePostImageUploadVariables
  >(CREATE_POST_IMAGE_UPLOAD_MUTATION)
  const { mutate: completePostImageUpload } = useMutation<
    CompletePostImageUploadMutation,
    CompletePostImageUploadVariables
  >(COMPLETE_POST_IMAGE_UPLOAD_MUTATION)
  const { mutate: createPost } = useMutation<CreatePostMutation, CreatePostVariables>(
    CREATE_POST_MUTATION,
  )

  provideForm(form)

  const setSelectedImage = (file: File | null) => {
    if (!file) {
      selectedImage.value = null
      imageError.value = POST.ERROR_CODE.IMAGE_REQUIRED
      return
    }

    if (!POST.IMAGE_CONTENT_TYPES.includes(file.type as (typeof POST.IMAGE_CONTENT_TYPES)[number])) {
      selectedImage.value = null
      imageError.value = POST.ERROR_CODE.IMAGE_INVALID
      return
    }

    if (file.size > POST.IMAGE_MAX_BYTES) {
      selectedImage.value = null
      imageError.value = POST.ERROR_CODE.IMAGE_TOO_LARGE
      return
    }

    selectedImage.value = file
    imageError.value = null
  }

  const showSubmitError = (error: unknown) => {
    const { code, fields } = getGraphqlErrorDetails(error)

    if (fields.length) {
      form.setErrors(
        Object.fromEntries(fields.map(({ field, code: fieldCode }) => [field, fieldCode] as const)),
      )
      return
    }

    toast.add({
      severity: 'error',
      summary: t('postError.title'),
      detail: code === POST.ERROR_CODE.STORE_REQUIRED ? t('postError.storeRequired') : t('postError.save'),
      life: 5000,
    })
  }

  const uploadImage = async (file: File) => {
    const uploadResult = await createPostImageUpload({ input: { contentType: file.type } })
    const upload = uploadResult?.data?.createPostImageUpload

    if (!upload) throw new Error('Post image upload intent was not returned')

    const formData = new FormData()
    for (const { name, value } of upload.fields) formData.append(name, value)
    formData.append('file', file)

    const response = await fetch(upload.uploadUrl, { method: 'POST', body: formData })

    if (!response.ok) throw new Error('Post image upload failed')

    const completeResult = await completePostImageUpload({ assetId: upload.assetId })
    const asset = completeResult?.data?.completePostImageUpload

    if (!asset) throw new Error('Post image upload could not be completed')

    return asset.id
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const image = selectedImage.value

    if (!image) {
      imageError.value = POST.ERROR_CODE.IMAGE_REQUIRED
      return
    }

    try {
      const imageAssetId = await uploadImage(image)
      await createPost({
        input: {
          imageAssetId,
          title: values.title,
          description: values.description || undefined,
          originalPrice: values.originalPrice,
          currentPrice: values.currentPrice,
          quantity: values.quantity,
          pickupStartAt: toUtcDateTime(values.pickupStartAt),
          pickupEndAt: toUtcDateTime(values.pickupEndAt),
          expiresAt: toUtcDateTime(values.expiresAt),
          storeName: values.storeName,
          phone: values.phone,
          address: values.address,
        },
      })
    } catch (error: unknown) {
      showSubmitError(error)
      return
    }

    toast.add({ severity: 'success', summary: t('postForm.created'), life: 3000 })
    await navigateTo(ROUTE.MERCHANT)
  })

  return { formState: form.formState, imageError, onSubmit, selectedImage, setSelectedImage }
}
